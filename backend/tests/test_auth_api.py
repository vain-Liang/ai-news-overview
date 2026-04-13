from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from httpx import AsyncClient


@pytest.mark.asyncio
async def test_healthz(client: AsyncClient) -> None:
    response = await client.get("/healthz")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_register_login_and_get_current_user(client: AsyncClient) -> None:
    email = f"auth-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"

    register_response = await client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "username": "demo-user",
            "nickname": "Demo User",
        },
    )
    assert register_response.status_code == 201
    assert register_response.json()["email"] == email

    login_response = await client.post(
        "/auth/jwt/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_response.status_code == 200
    login_payload = login_response.json()
    assert login_payload["token_type"] == "bearer"
    assert login_payload["access_token"]

    me_response = await client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {login_payload['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == email


@pytest.mark.asyncio
async def test_register_rejects_short_password(client: AsyncClient) -> None:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"auth-{uuid.uuid4().hex[:8]}@example.com",
            "password": "short",
            "username": "short-pass-user",
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": {
            "code": "REGISTER_INVALID_PASSWORD",
            "reason": "Password should be at least 8 characters",
        }
    }
