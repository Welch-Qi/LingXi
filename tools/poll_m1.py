#!/usr/bin/env python3
"""M1 Agent 状态轮询脚本"""
import json
import os
import time
import urllib.request
import base64
from datetime import datetime

# 加载 .env
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line.startswith("#") or not line:
            continue
        if "=" in line:
            k, _, v = line.partition("=")
            v = v.strip().strip('"').strip("'")
            os.environ[k] = v

API_KEY = os.environ.get("CURSOR_API_KEY", "")
AGENT_ID = "bc-fa985d5d-b3a7-4377-84cc-0598b42a2267"
RUN_ID = "run-d29a8a8c-315c-441b-9ae4-1b57b9b1083a"
API_BASE = "https://api.cursor.com/v1"
POLL_INTERVAL = 120  # 2 minutes

auth = base64.b64encode(f"{API_KEY}:".encode()).decode()

start = time.time()
while True:
    try:
        req = urllib.request.Request(
            f"{API_BASE}/agents/{AGENT_ID}/runs/{RUN_ID}",
            method="GET"
        )
        req.add_header("Authorization", f"Basic {auth}")
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read().decode())
    except Exception as e:
        elapsed = int(time.time() - start)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] poll error: {e} ({elapsed}s)")
        time.sleep(POLL_INTERVAL)
        continue

    status = data.get("status", "?")
    elapsed = int(time.time() - start)
    print(f"[{datetime.now().strftime('%H:%M:%S')}] status={status} elapsed={elapsed}s")

    if status in ("FINISHED", "ERROR", "CANCELLED", "EXPIRED"):
        print(f"\n=== FINAL STATUS: {status} ===")
        print(f"duration: {data.get('durationMs', '?')}ms")
        branches = data.get("git", {}).get("branches", [])
        for b in branches:
            print(f"  branch={b.get('branch')} pr={b.get('prUrl')}")
        result = data.get("result", "")
        if result:
            print(f"  result preview: {result[:300]}")
        break

    time.sleep(POLL_INTERVAL)
