"""Agent Runtime entrypoint: CLI / API server."""

from __future__ import annotations

import argparse
import json
import sys

import uvicorn

from lingxi_agent_runtime.config import get_settings
from lingxi_agent_runtime.runtime import AgentRuntime


def _run_once(goal: str, tenant_id: str, user_id: str) -> int:
    runtime = AgentRuntime(get_settings())
    result = runtime.run(goal, tenant_id=tenant_id, user_id=user_id)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result.get("status") in {"completed", "awaiting_human"} else 1


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Lingxi Agent Runtime (LangGraph)")
    sub = parser.add_subparsers(dest="cmd")

    run_p = sub.add_parser("run", help="执行一次多智能体协作任务")
    run_p.add_argument("--goal", required=True)
    run_p.add_argument("--tenant-id", default="1")
    run_p.add_argument("--user-id", default="u_admin")

    serve_p = sub.add_parser("serve", help="启动 FastAPI 服务")
    serve_p.add_argument("--host", default=None)
    serve_p.add_argument("--port", type=int, default=None)

    args = parser.parse_args(argv)
    settings = get_settings()

    if args.cmd == "run":
        raise SystemExit(_run_once(args.goal, args.tenant_id, args.user_id))
    if args.cmd == "serve":
        uvicorn.run(
            "lingxi_agent_runtime.api:app",
            host=args.host or settings.host,
            port=args.port or settings.port,
            reload=False,
        )
        return

    # 默认：跑一条 mock 演示任务
    raise SystemExit(
        _run_once(
            "分析德国工业泵市场机会，并给出触达与销售转化建议",
            "1",
            "u_admin",
        )
    )


if __name__ == "__main__":
    main(sys.argv[1:])
