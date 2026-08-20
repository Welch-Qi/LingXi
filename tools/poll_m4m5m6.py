#!/usr/bin/env python3
"""M4/M5/M6 三路并行轮询 Cursor Cloud Agent 状态"""
import base64
import json
import os
import time
import urllib.request

AGENTS = {
    "M4": ("bc-081e6252-1df9-417a-b8d1-35b9461c8097", "run-03ae2b10-2e2c-4f5b-bb1e-39ea878fd20d"),
    "M5": ("bc-3f886876-130a-41e0-88ac-55cefa02caf6", "run-f7d23b5d-e399-4cc6-855e-13e67a250b34"),
    "M6": ("bc-5eddff8d-3d22-4a27-bed4-13121791cdbd", "run-605b8928-e461-45a4-9d1b-48eef03dc90f"),
}

TERMINAL = {"FINISHED", "ERROR", "CANCELLED", "EXPIRED"}
INTERVAL = 120
MAX_MINUTES = 60


def check(key):
    env_key = os.environ.get("CURSOR_API_KEY", "")
    auth = base64.b64encode(f"{env_key}:".encode()).decode()
    agent_id, run_id = AGENTS[key]
    url = f"https://api.cursor.com/v1/agents/{agent_id}/runs/{run_id}"
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Basic {auth}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"[{key}] 查询失败: {e}", flush=True)
        return None


def main():
    start = time.time()
    done = {}
    while len(done) < len(AGENTS):
        elapsed = (time.time() - start) / 60
        if elapsed > MAX_MINUTES:
            print(f"超时 {MAX_MINUTES} 分钟，退出。已完成: {list(done)}", flush=True)
            break
        for key in AGENTS:
            if key in done:
                continue
            data = check(key)
            if not data:
                continue
            status = data.get("status", "?")
            dur = data.get("durationMs", "running")
            print(f"[{time.strftime('%H:%M:%S')}] {key}: status={status} duration={dur}ms", flush=True)
            if status in TERMINAL:
                branches = data.get("git", {}).get("branches", [])
                for b in branches:
                    print(f"  {key} branch={b.get('branch')} pr={b.get('prUrl', 'N/A')}", flush=True)
                done[key] = status
        if len(done) < len(AGENTS):
            time.sleep(INTERVAL)
    print(f"全部终态: {done}", flush=True)


if __name__ == "__main__":
    main()
