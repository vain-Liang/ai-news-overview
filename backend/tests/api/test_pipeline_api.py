from __future__ import annotations

import uuid


async def test_trigger_retrieval_pipeline_returns_task_id(client, monkeypatch) -> None:
    headers = await _auth_headers(client)

    async def fake_enforce(*_args, **_kwargs):
        return None

    monkeypatch.setattr("app.services.pipeline_rate_limit._enforce", fake_enforce)

    class DummyTaskResult:
        id = "retrieve-task-1"

    class DummyTask:
        @staticmethod
        def delay(*, sources):
            assert sources == ["xinhua"]
            return DummyTaskResult()

    monkeypatch.setattr("app.api.v1.routes.pipeline.run_retrieval_task", DummyTask)

    response = await client.post("/pipeline/retrieve", json={"sources": ["xinhua"]}, headers=headers)

    assert response.status_code == 202
    assert response.json() == {"task_id": "retrieve-task-1", "status": "queued"}


async def test_trigger_workflow_summarization_pipeline_returns_task_id(client, monkeypatch) -> None:
    headers = await _auth_headers(client)

    async def fake_enforce(*_args, **_kwargs):
        return None

    monkeypatch.setattr("app.services.pipeline_rate_limit._enforce", fake_enforce)

    class DummyTaskResult:
        id = "summary-task-1"

    class DummyTask:
        @staticmethod
        def delay(*, workflow_task_id: str, provider: str | None):
            assert workflow_task_id == "workflow-task-1"
            assert provider == "openai"
            return DummyTaskResult()

    monkeypatch.setattr("app.api.v1.routes.pipeline.run_summarization_task", DummyTask)

    response = await client.post(
        "/pipeline/summarize",
        json={"workflow_task_id": "workflow-task-1", "provider": "openai"},
        headers=headers,
    )

    assert response.status_code == 202
    assert response.json() == {"task_id": "summary-task-1", "status": "queued"}


async def _auth_headers(client) -> dict[str, str]:
    email = f"pipeline-user-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"
    register_response = await client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "username": f"pipeline-user-{uuid.uuid4().hex[:6]}",
            "nickname": "Pipeline User",
        },
    )
    assert register_response.status_code == 201

    login_response = await client.post(
        "/auth/jwt/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_response.status_code == 200

    return {"Authorization": f"Bearer {login_response.json()['access_token']}"}
