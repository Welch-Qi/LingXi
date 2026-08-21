#!/usr/bin/env python3
"""并行轮询 M8/M9/M10 Agent 状态"""
import base64, json, os, time, urllib.request

AGENTS = {
    "M8": ("bc-9158d07b-8972-4956-8037-112692a61577", "run-c3b19b49-82c5-434c-bba1-89521b2928c4"),
    "M9": ("bc-8ad1d87e-9244-41aa-8018-b28971f1bdd0", "run-08045b72-72ef-4596-853f-8acda82c055f"),
    "M10": ("bc-183795d3-7635-4a85-9b86-ee3d52e266f1", "run-0eee90c8-68b7-4af5-bae6-e33ec7cc4ca7"),
}

TERMINAL = {"FINISHED", "ERROR", "CANCELLED", "EXPIRED"}

key = os.environ.get("CURSOR_API_KEY", "")
if not key:
    print("ERROR: CURSOR_API_KEY not set")
    exit(1)
auth = base64.b64encode(f"{key}:".encode()).decode()

completed = set()
for i in range(60):
    for name, (aid, rid) in AGENTS.items():
        if name in completed:
            continue
        url = f"https://api.cursor.com/v1/agents/{aid}/runs/{rid}"
        req = urllib.request.Request(url)
        req.add_header("Authorization", f"Basic {auth}")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                d = json.loads(resp.read().decode())
            status = d.get("status", "?")
            dur = d.get("durationMs", "running")
            ts = time.strftime("%H:%M:%S")
            print(f"[{ts}] {name}: status={status} duration={dur}ms", flush=True)
            if status in TERMINAL:
                print(f"  FINAL: {status}", flush=True)
                for b in d.get("git", {}).get("branches", []):
                    print(f"  branch={b.get('branch')} pr={b.get('prUrl', 'N/A')}", flush=True)
                completed.add(name)
        except Exception as e:
            print(f"[{time.strftime('%H:%M:%S')}] {name}: ERROR {e}", flush=True)
    if len(completed) == 3:
        print("ALL DONE!", flush=True)
        break
    time.sleep(120)

print(f"Completed: {completed}", flush=True)
