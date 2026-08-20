#!/usr/bin/env python3
"""三路并行轮询 M2/M3/M7 Agent 状态"""
import json
import os
import time
import urllib.request
import urllib.error

AGENTS = {
    "M2": ("bc-8ce549ac-3a96-41a8-a465-73dc72a65e92", "run-03be0d8e-5656-4b07-a7c7-4a70b2966c57"),
    "M3": ("bc-4ce778df-4c2a-4c46-ab8c-cb5a20429040", "run-33647b54-3956-4da9-bb2f-8b6efc355c80"),
    "M7": ("bc-58dea20a-0bc5-4c45-bbae-bffbe31e2b54", "run-31a9efe4-b8af-4f6a-a1be-6b994574d1f7"),
}

TERMINAL = {"FINISHED", "ERROR", "CANCELLED", "EXPIRED"}
API_BASE = "https://api.cursor.com/v1/agents"
KEY = os.environ.get("CURSOR_API_KEY", "")
INTERVAL = 120  # 2 minutes

def poll_one(name, agent_id, run_id):
    url = f"{API_BASE}/{agent_id}/runs/{run_id}"
    req = urllib.request.Request(url)
    auth = __import__("base64").b64encode(f"{KEY}:".encode()).decode()
    req.add_header("Authorization", f"Basic {auth}")
    try:
        resp = urllib.request.urlopen(req)
        data = json.loads(resp.read().decode())
        status = data.get("status", "?")
        duration = data.get("durationMs", "running")
        branches = data.get("git", {}).get("branches", [])
        pr_url = branches[0].get("prUrl", "") if branches else ""
        return {"name": name, "status": status, "duration": duration, "pr_url": pr_url, "data": data}
    except Exception as e:
        return {"name": name, "status": f"ERR:{e}", "duration": "?", "pr_url": "", "data": None}

def main():
    print(f"=== M2/M3/M7 并行轮询启动 {time.strftime('%H:%M:%S')} ===")
    done = set()
    results = {}

    while len(done) < len(AGENTS):
        for name, (aid, rid) in AGENTS.items():
            if name in done:
                continue
            r = poll_one(name, aid, rid)
            ts = time.strftime('%H:%M:%S')
            print(f"[{ts}] {r['name']}: status={r['status']} duration={r['duration']}ms")
            if r["status"] in TERMINAL:
                print(f"  >>> {r['name']} 终态: {r['status']}")
                if r["pr_url"]:
                    print(f"  >>> PR: {r['pr_url']}")
                results[name] = r
                done.add(name)

        if len(done) < len(AGENTS):
            time.sleep(INTERVAL)

    print(f"\n=== 全部完成 {time.strftime('%H:%M:%S')} ===")
    for name, r in results.items():
        print(f"{name}: {r['status']} | {r['duration']}ms | PR={r['pr_url'] or 'N/A'}")

if __name__ == "__main__":
    main()
