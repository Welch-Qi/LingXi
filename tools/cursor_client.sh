#!/usr/bin/env bash
# ============================================================
# 灵犀系统 · Cursor Client 封装脚本
# ============================================================
# 功能：派发任务 / 轮询状态 / 拉取结果 / 合并 PR
# 所有 Cursor API 调用收敛到此脚本，接口变更只改一处
# ============================================================
# 依赖：curl, git, gh (GitHub CLI), jq
# 使用前：source .env
# ============================================================

set -euo pipefail

# ---- 加载环境变量 ----
if [ -f "$(dirname "$0")/../.env" ]; then
    set -a
    source "$(dirname "$0")/../.env"
    set +a
fi

# ---- 常量 ----
API_BASE="${CURSOR_API_BASE:-https://api.cursor.com/v1}"
REPO_URL="${REPO_URL:-https://github.com/Welch-Qi/LingXi.git}"
BASE_BRANCH="${BASE_BRANCH:-main}"
BRANCH_PREFIX="${BRANCH_PREFIX:-cursor/feat}"
POLL_INTERVAL="${POLL_INTERVAL:-900}"
RUN_TIMEOUT="${RUN_TIMEOUT:-5400}"
MAX_FIX_ROUNDS="${MAX_FIX_ROUNDS:-5}"

# ---- 颜色输出 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ---- 前置检查 ----
# 用法: check_env [cursor] [github]
# 不传参 = 两者都检查；传 cursor = 只检查 CURSOR_API_KEY；传 github = 只检查 GITHUB_TOKEN
check_env() {
    local need_cursor=1
    local need_github=1
    if [ "${1:-}" = "cursor" ]; then need_github=0; fi
    if [ "${1:-}" = "github" ]; then need_cursor=0; fi

    if [ "$need_cursor" -eq 1 ] && [ -z "${CURSOR_API_KEY:-}" ]; then
        log_error "CURSOR_API_KEY 未设置，请先 source .env"
        exit 1
    fi
    if [ "$need_github" -eq 1 ] && [ -z "${GITHUB_TOKEN:-}" ]; then
        log_error "GITHUB_TOKEN 未设置，请先 source .env"
        exit 1
    fi
    # jq 或 Python 二选一
    local _jq_path
    _jq_path=$(command -v jq 2>/dev/null) || _jq_path=""
    if [ -n "$_jq_path" ] && [ "$_jq_path" != "jq" ] && [ -x "$_jq_path" ]; then
        :  # 外部 jq 可用
    elif command -v python >/dev/null 2>&1; then
        :  # Python fallback 可用
    else
        log_error "需要 jq 或 python，请先安装其一"
        exit 1
    fi
    for cmd in curl git; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_error "$cmd 未安装，请先安装"
            exit 1
        fi
    done
}

# jq 包装函数（避免 command -v 找到函数自身导致递归）
jq() {
    local _jq_path
    _jq_path=$(command -v jq 2>/dev/null) || _jq_path=""
    # command -v 返回 "jq" 说明只找到函数自身，没有外部二进制
    if [ -n "$_jq_path" ] && [ "$_jq_path" != "jq" ] && [ -x "$_jq_path" ]; then
        "$_jq_path" "$@"
    else
        python "$(dirname "$0")/jq_shim.py" "$@"
    fi
}

# ============================================================
# 函数 1：dispatch — 派发任务到 Cursor Cloud Agents API
# ============================================================
# 用法：./cursor_client.sh dispatch <task_brief_path> <module_name> [agent_id]
# 示例：./cursor_client.sh dispatch tasks/M4-backend.md M4-backend
# ============================================================
dispatch() {
    check_env
    local brief_path="$1"
    local module_name="$2"
    local agent_id="${3:-}"

    if [ ! -f "$brief_path" ]; then
        log_error "任务简报不存在: $brief_path"
        exit 1
    fi

    local branch="${BRANCH_PREFIX}-${module_name,,}"
    local brief_rel="${brief_path#./}"

    # 构建 prompt：只引用文件路径，不塞需求细节
    local prompt_text="读取仓库中 ${brief_rel} 任务简报和 contracts.md 中相关章节，按照简报要求实现功能。完成后运行测试，将结果写入 artifacts/${module_name}/result.json，提交并推送分支 ${branch}，autoCreatePR 开 PR。"

    # 构建 JSON payload（autoCreatePR 是顶层字段，不在 repos 内）
    local payload
    if [ -n "$agent_id" ]; then
        payload=$(jq -n \
            --arg pt "$prompt_text" \
            --arg url "$REPO_URL" \
            --arg ref "$BASE_BRANCH" \
            --arg aid "$agent_id" \
            '{
                prompt: { text: $pt },
                model: { id: "composer-2.5" },
                repos: [{ url: $url, startingRef: $ref }],
                workOnCurrentBranch: false,
                autoCreatePR: true,
                agentId: $aid
            }')
    else
        payload=$(jq -n \
            --arg pt "$prompt_text" \
            --arg url "$REPO_URL" \
            --arg ref "$BASE_BRANCH" \
            '{
                prompt: { text: $pt },
                model: { id: "composer-2.5" },
                repos: [{ url: $url, startingRef: $ref }],
                workOnCurrentBranch: false,
                autoCreatePR: true
            }')
    fi

    log_info "派发任务: $module_name"
    log_info "  简报: $brief_path"
    log_info "  分支: $branch"

    local response http_code
    response=$(curl -sS --write-out '\n%{http_code}' --request POST "${API_BASE}/agents" \
        -u "${CURSOR_API_KEY}:" \
        -H 'Content-Type: application/json' \
        -d "$payload" 2>/dev/null) || {
        log_error "curl 调用失败"
        echo "$response"
        exit 1
    }

    # 提取 HTTP 状态码（最后一行）
    http_code=$(echo "$response" | tail -1)
    response=$(echo "$response" | sed '$d')

    # 验证响应
    if [ "$http_code" != "201" ]; then
        log_error "API 返回非 201 状态码: $http_code"
        echo "$response"
        exit 1
    fi

    # 解析响应
    local agent_id_resp run_id status
    agent_id_resp=$(echo "$response" | jq -r '.agent.id // empty')
    run_id=$(echo "$response" | jq -r '.run.id // empty')
    status=$(echo "$response" | jq -r '.run.status // .agent.status // "UNKNOWN"')

    if [ -z "$agent_id_resp" ]; then
        log_error "未获取到 agentId，响应:"
        echo "$response" | jq . 2>/dev/null || echo "$response"
        exit 1
    fi

    log_info "派发成功"
    log_info "  agentId: $agent_id_resp"
    log_info "  runId:   $run_id"
    log_info "  status:  $status"

    # 输出结构化结果（可被 WorkBuddy 解析）
    jq -n \
        --arg module "$module_name" \
        --arg agentId "$agent_id_resp" \
        --arg runId "$run_id" \
        --arg status "$status" \
        --arg branch "$branch" \
        '{module: $module, agentId: $agentId, runId: $runId, status: $status, branch: $branch}'
}

# ============================================================
# 函数 2：poll — 轮询 run 状态
# ============================================================
# 用法：./cursor_client.sh poll <agent_id> <run_id>
# 示例：./cursor_client.sh poll bc-xxx run-yyy
# ============================================================
poll() {
    check_env
    local agent_id="$1"
    local run_id="$2"

    if [ -z "$agent_id" ] || [ -z "$run_id" ]; then
        log_error "用法: $0 poll <agent_id> <run_id>"
        exit 1
    fi

    local start_time
    start_time=$(date +%s)

    while true; do
        local response status elapsed
        response=$(curl -sS "${API_BASE}/agents/${agent_id}/runs/${run_id}" \
            -u "${CURSOR_API_KEY}:" 2>/dev/null) || {
            log_warn "轮询请求失败，${POLL_INTERVAL}秒后重试..."
            sleep "$POLL_INTERVAL"
            continue
        }

        status=$(echo "$response" | jq -r '.status // "UNKNOWN"' 2>/dev/null)
        elapsed=$(( $(date +%s) - start_time ))

        log_info "状态: $status (已轮询 ${elapsed}s)"

        case "$status" in
            FINISHED|ERROR|CANCELLED|EXPIRED)
                log_info "终态: $status"
                # 提取 git 信息（分支名和 PR URL）
                local pr_url git_branch
                pr_url=$(echo "$response" | jq -r '.git.branches[0].prUrl // empty' 2>/dev/null)
                git_branch=$(echo "$response" | jq -r '.git.branches[0].branch // empty' 2>/dev/null)
                if [ -n "$pr_url" ]; then
                    log_info "PR:       $pr_url"
                fi
                if [ -n "$git_branch" ]; then
                    log_info "分支:     $git_branch"
                fi
                echo "$response" | jq .
                return 0
                ;;
            CREATING|RUNNING)
                if [ "$elapsed" -ge "$RUN_TIMEOUT" ]; then
                    log_error "超时（${RUN_TIMEOUT}s），标记为 ERROR"
                    jq -n --arg status "TIMEOUT" --arg agentId "$agent_id" --arg runId "$run_id" \
                        '{status: $status, agentId: $agentId, runId: $runId, message: "run timed out"}'
                    return 1
                fi
                sleep "$POLL_INTERVAL"
                ;;
            *)
                log_warn "未知状态: $status"
                sleep "$POLL_INTERVAL"
                ;;
        esac
    done
}

# ============================================================
# 函数 3：fetch_result — 拉取结果并验证
# ============================================================
# 用法：./cursor_client.sh fetch_result <branch> <module_name>
# 示例：./cursor_client.sh fetch_result cursor/feat-m4-backend M4-backend
# ============================================================
fetch_result() {
    check_env github
    local branch="$1"
    local module_name="$2"

    if [ -z "$branch" ] || [ -z "$module_name" ]; then
        log_error "用法: $0 fetch_result <branch> <module_name>"
        exit 1
    fi

    # 设置带 Token 的 remote URL
    local repo_root
    repo_root=$(git rev-parse --show-toplevel)
    git remote set-url origin "https://Welch-Qi:${GITHUB_TOKEN}@github.com/Welch-Qi/LingXi.git"

    log_info "拉取分支: $branch"
    git fetch origin "$branch" 2>&1 || {
        log_error "git fetch 失败"
        git remote set-url origin "https://github.com/Welch-Qi/LingXi.git"
        exit 1
    }

    # 清理 Token URL
    git remote set-url origin "https://github.com/Welch-Qi/LingXi.git"

    # 读取 result.json
    local result_file="artifacts/${module_name}/result.json"
    local result
    result=$(git show "origin/${branch}:${result_file}" 2>/dev/null) || {
        log_warn "result.json 不存在（可能是分支名或路径有误）"
        log_warn "  分支: $branch"
        log_warn "  路径: $result_file"
        exit 1
    }

    log_info "result.json 内容:"
    echo "$result" | jq .

    # 提取关键字段
    local status pr_url tests_passed tests_total coverage
    status=$(echo "$result" | jq -r '.status // "UNKNOWN"')
    pr_url=$(echo "$result" | jq -r '.prUrl // empty')
    tests_passed=$(echo "$result" | jq -r '.tests.passed // 0')
    tests_total=$(echo "$result" | jq -r '.tests.total // 0')
    coverage=$(echo "$result" | jq -r '.tests.coverage // 0')

    log_info "状态:     $status"
    log_info "PR:       ${pr_url:-N/A}"
    log_info "测试:     ${tests_passed}/${tests_total} 通过"
    log_info "覆盖率:   ${coverage}"

    # 检查 PR 状态（如果有 PR URL）
    if [ -n "$pr_url" ]; then
        local pr_state
        pr_state=$(gh pr view "$pr_url" --json state,statusCheckRollup 2>/dev/null | jq -r '.state' 2>/dev/null) || {
            log_warn "gh pr view 失败（gh 未认证或 PR 不存在）"
            pr_state="UNKNOWN"
        }
        log_info "PR 状态: $pr_state"
    fi

    # 输出结构化结果
    jq -n \
        --arg module "$module_name" \
        --arg branch "$branch" \
        --arg status "$status" \
        --arg prUrl "$pr_url" \
        --argjson testsPassed "$tests_passed" \
        --argjson testsTotal "$tests_total" \
        --argjson coverage "$coverage" \
        '{module: $module, branch: $branch, status: $status, prUrl: $prUrl, tests: {passed: $testsPassed, total: $testsTotal, coverage: $coverage}}'
}

# ============================================================
# 函数 4：merge_pr — 合并 PR
# ============================================================
# 用法：./cursor_client.sh merge_pr <pr_url> [merge_method]
# merge_method: squash (默认) | merge | rebase
# ============================================================
merge_pr() {
    check_env github
    local pr_url="$1"
    local merge_method="${2:-squash}"

    if [ -z "$pr_url" ]; then
        log_error "用法: $0 merge_pr <pr_url> [merge_method]"
        exit 1
    fi

    log_info "合并 PR: $pr_url (方法: $merge_method)"

    gh pr merge "$pr_url" --"$merge_method" --delete-branch 2>&1 || {
        log_error "PR 合并失败"
        exit 1
    }

    log_info "PR 已合并并删除分支"
}

# ============================================================
# 函数 5：dispatch_fix — 派发修复任务
# ============================================================
# 用法：./cursor_client.sh dispatch_fix <fix_brief_path> <module_name> <agent_id>
# ============================================================
dispatch_fix() {
    check_env
    local brief_path="$1"
    local module_name="$2"
    local agent_id="$3"

    if [ -z "$agent_id" ]; then
        log_error "修复任务需要现有 agentId"
        exit 1
    fi

    local brief_rel="${brief_path#./}"
    local prompt_text="读取仓库中 ${brief_rel} 修复简报，按其中描述修复失败用例。完成后重新运行测试，更新 artifacts/${module_name}/result.json，提交并推送。"

    log_info "派发修复任务: $module_name (agentId: $agent_id)"

    local response
    response=$(curl -sS --request POST "${API_BASE}/agents/${agent_id}/runs" \
        -u "${CURSOR_API_KEY}:" \
        -H 'Content-Type: application/json' \
        -d "$(jq -n --arg pt "$prompt_text" '{prompt: {text: $pt}}')" 2>/dev/null) || {
        log_error "API 调用失败"
        echo "$response"
        exit 1
    }

    local run_id status
    run_id=$(echo "$response" | jq -r '.id // empty')
    status=$(echo "$response" | jq -r '.status // "UNKNOWN"')

    log_info "修复任务已派发"
    log_info "  runId: $run_id"
    log_info "  status: $status"

    jq -n \
        --arg module "$module_name" \
        --arg agentId "$agent_id" \
        --arg runId "$run_id" \
        --arg status "$status" \
        '{module: $module, agentId: $agentId, runId: $runId, status: $status, type: "fix"}'
}

# ============================================================
# 主入口
# ============================================================
usage() {
    cat <<'EOF'
用法: cursor_client.sh <command> [args...]

命令:
  dispatch       <brief_path> <module> [agent_id]   派发任务到 Cursor Cloud API
  poll           <agent_id> <run_id>               轮询 run 状态直到终态
  fetch_result   <branch> <module>                 拉取分支并读取 result.json
  merge_pr       <pr_url> [merge_method]            合并 PR 并删除分支
  dispatch_fix   <fix_brief> <module> <agent_id>   派发修复任务（追加 run）

环境变量（.env 文件）:
  CURSOR_API_KEY   Cursor API 密钥（必填）
  GITHUB_TOKEN     GitHub Token（必填）
  REPO_URL         仓库地址
  BASE_BRANCH      基线分支（默认 main）
  POLL_INTERVAL    轮询间隔秒（默认 900）
  RUN_TIMEOUT      run 超时秒（默认 5400）
  MAX_FIX_ROUNDS   修复轮次上限（默认 5）

示例:
  # 派发 M4 后端任务
  ./cursor_client.sh dispatch tasks/M4-backend.md M4-backend

  # 轮询状态
  ./cursor_client.sh poll bc-xxx run-yyy

  # 拉取结果
  ./cursor_client.sh fetch_result cursor/feat-m4-backend M4-backend

  # 合并 PR
  ./cursor_client.sh merge_pr "https://github.com/Welch-Qi/LingXi/pull/12"

  # 派发修复
  ./cursor_client.sh dispatch_fix tasks/M4-fix-001.md M4-backend bc-xxx
EOF
    exit 0
}

# ---- 分发命令 ----
case "${1:-}" in
    dispatch)       shift; dispatch "$@" ;;
    poll)           shift; poll "$@" ;;
    fetch_result)   shift; fetch_result "$@" ;;
    merge_pr)       shift; merge_pr "$@" ;;
    dispatch_fix)   shift; dispatch_fix "$@" ;;
    -h|--help|help|"")  usage ;;
    *)              log_error "未知命令: $1"; usage ;;
esac
