#!/usr/bin/env python
"""jq shim - 用 Python 实现 cursor_client.sh 所需的最小 jq 功能
支持: -n --arg, -r (path/array-index/ //-fallback), pretty-print
"""
import sys, json, re


def parse_path(expr):
    """解析 jq 路径表达式如 .git.branches[0].prUrl → [('key','git'),('key','branches'),('index',0),('key','prUrl')]"""
    steps = []
    for part in expr.lstrip('.').split('.'):
        if part == '':
            continue
        # 处理 field[0] 或 field[0][1]
        m = re.match(r'^(\w*)\[(\d+)\](.*)$', part)
        while m:
            field, idx, rest = m.group(1), int(m.group(2)), m.group(3)
            if field:
                steps.append(('key', field))
            steps.append(('index', idx))
            part = rest
            m = re.match(r'^\[(\d+)\](.*)$', part)
            if m:
                continue
            m = re.match(r'^(\w*)\[(\d+)\](.*)$', part)
        if part == '':
            continue
        steps.append(('key', part))
    return steps


def navigate(obj, steps):
    """按 steps 导航 JSON 树"""
    for stype, sval in steps:
        if stype == 'key':
            if isinstance(obj, dict):
                obj = obj.get(sval)
            else:
                return None
        elif stype == 'index':
            if isinstance(obj, list) and sval < len(obj):
                obj = obj[sval]
            else:
                return None
        if obj is None:
            return None
    return obj


def split_alt(expr):
    """按 // 拆分表达式（处理引号内的 //）"""
    parts = []
    current = ''
    in_str = False
    quote = ''
    i = 0
    while i < len(expr):
        c = expr[i]
        if in_str:
            current += c
            if c == quote:
                in_str = False
        elif c in ('"', "'"):
            in_str = True
            quote = c
            current += c
        elif expr[i:i+2] == '//':
            parts.append(current)
            current = ''
            i += 2
            continue
        else:
            current += c
        i += 1
    parts.append(current)
    return parts


def eval_expr(obj, expr):
    """求值 jq 表达式，支持 // 回退"""
    for part in split_alt(expr):
        part = part.strip()
        if not part:
            continue
        # 字符串字面量
        if (part.startswith('"') and part.endswith('"')) or (part.startswith("'") and part.endswith("'")):
            return part[1:-1]
        # empty 关键字 → 跳过（尝试下一个 //）
        if part == 'empty':
            continue
        # 路径表达式
        steps = parse_path(part)
        result = navigate(obj, steps)
        if result is not None and result != '':
            return result
    return None


def main():
    args = sys.argv[1:]

    # jq -n --arg key val ... '{json}'
    if '-n' in args:
        idx = args.index('-n')
        rest = args[idx+1:]
        string_args = {}
        i = 0
        while i < len(rest) and rest[i] == '--arg':
            key = rest[i+1]
            val = rest[i+2]
            string_args[key] = val
            i += 3
        template = ' '.join(rest[i:]).strip().strip("'").strip('"')
        result = template
        for k, v in string_args.items():
            result = result.replace(f'${k}', json.dumps(v, ensure_ascii=False))
        try:
            parsed = json.loads(result)
            print(json.dumps(parsed, ensure_ascii=False, indent=2))
        except Exception:
            # jq 模板用不带引号的键（如 {prompt: {...}}），
            # Python json.loads 要求键带引号，这里补引号
            fixed = re.sub(r'([{,]\s*)(\w+)(\s*:)', r'\1"\2"\3', result)
            try:
                parsed = json.loads(fixed)
                print(json.dumps(parsed, ensure_ascii=False, indent=2))
            except Exception:
                print(result)
        return

    # echo "$json" | jq -r '.field'
    if '-r' in args:
        idx = args.index('-r')
        expr = args[idx+1] if idx+1 < len(args) else '.'
        data = sys.stdin.read()
        try:
            obj = json.loads(data)
        except Exception:
            print(data.strip())
            return
        result = eval_expr(obj, expr)
        if result is None:
            print('')
        elif isinstance(result, (dict, list)):
            print(json.dumps(result, ensure_ascii=False))
        else:
            print(result)
        return

    # echo "$json" | jq . (pretty print)
    if len(args) == 0 or args == ['.']:
        data = sys.stdin.read()
        try:
            obj = json.loads(data)
            print(json.dumps(obj, ensure_ascii=False, indent=2))
        except Exception:
            print(data.strip())
        return

    # 其他：透传 stdin pretty-print
    data = sys.stdin.read()
    try:
        obj = json.loads(data)
        print(json.dumps(obj, ensure_ascii=False, indent=2))
    except Exception:
        print(data.strip())


if __name__ == '__main__':
    main()
