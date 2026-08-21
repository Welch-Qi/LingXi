from __future__ import annotations

from fastapi.testclient import TestClient

from lingxi_agent_runtime.api import app, create_app

client = TestClient(app)


def test_create_task_sync() -> None:
    response = client.post(
        "/api/v1/agent/tasks",
        json={
            "goal": "分析德国市场工业泵搜索趋势",
            "context": {"tenantId": "1", "userId": "u_admin"},
            "async": False,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["taskId"].startswith("task_")
    assert body["data"]["status"] == "FINISHED"
    assert body["data"]["traceId"]


def test_get_task_status() -> None:
    create_resp = client.post(
        "/api/v1/agent/tasks",
        json={
            "goal": "分析东南亚市场趋势",
            "context": {"tenantId": "1", "userId": "u_admin"},
            "async": False,
        },
    )
    task_id = create_resp.json()["data"]["taskId"]

    get_resp = client.get(f"/api/v1/agent/tasks/{task_id}")
    assert get_resp.status_code == 200
    body = get_resp.json()
    assert body["code"] == 0
    assert body["data"]["taskId"] == task_id
    assert body["data"]["status"] == "FINISHED"
    assert body["data"]["finalAnswer"] or body["data"]["agentOutputs"]


def test_get_task_not_found() -> None:
    response = client.get("/api/v1/agent/tasks/task_not_exists")
    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 30005
    assert body["data"] is None


def test_chat() -> None:
    response = client.post(
        "/api/v1/agent/chat",
        json={"message": "帮我看看最近的热门市场", "sessionId": "session_test"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["code"] == 0
    assert body["data"]["reply"]
    assert "market_analyst" in body["data"]["suggestedAgents"]
    assert body["data"]["sessionId"] == "session_test"


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_list_skills() -> None:
    response = client.get("/api/v1/skills")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body
    assert len(body["items"]) > 0
    assert "skillId" in body["items"][0]


def test_create_app_factory() -> None:
    test_client = TestClient(create_app())
    assert test_client.get("/health").status_code == 200
