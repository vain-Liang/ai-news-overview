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
async def test_system_runtime(client: AsyncClient) -> None:
    response = await client.get("/system/runtime")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["auth"]["register_path"] == "/auth/register"
    assert payload["auth"]["login_path"] == "/auth/jwt/login"
    assert payload["auth"]["me_path"] == "/users/me"


@pytest.mark.asyncio
async def test_register_login_and_get_current_user(client: AsyncClient) -> None:
    email = f"auth-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"

    register_response = await client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "username": f"demo-user-{uuid.uuid4().hex[:6]}",
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
    payload = me_response.json()
    assert payload["email"] == email
    assert payload["nickname"] == "Demo User"


@pytest.mark.asyncio
async def test_register_allows_optional_username_and_nickname(client: AsyncClient) -> None:
    email = f"optional-{uuid.uuid4().hex[:8]}@example.com"

    response = await client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "StrongPass123!",
            "username": "   ",
            "nickname": "  Display Name  ",
        },
    )

    assert response.status_code == 201
    assert response.json()["email"] == email
    assert response.json()["username"] is None
    assert response.json()["nickname"] == "Display Name"


@pytest.mark.asyncio
async def test_register_rejects_short_password(client: AsyncClient) -> None:
    response = await client.post(
        "/auth/register",
        json={
            "email": f"auth-{uuid.uuid4().hex[:8]}@example.com",
            "password": "short",
            "username": f"short-pass-user-{uuid.uuid4().hex[:6]}",
        },
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": {
            "code": "REGISTER_INVALID_PASSWORD",
            "reason": "Password should be at least 8 characters",
        }
    }


@pytest.mark.asyncio
async def test_register_rejects_duplicate_username(client: AsyncClient) -> None:
    username = f"duplicate-{uuid.uuid4().hex[:8]}"

    first_response = await client.post(
        "/auth/register",
        json={
            "email": f"auth-{uuid.uuid4().hex[:8]}@example.com",
            "password": "StrongPass123!",
            "username": username,
        },
    )
    assert first_response.status_code == 201

    second_response = await client.post(
        "/auth/register",
        json={
            "email": f"auth-{uuid.uuid4().hex[:8]}@example.com",
            "password": "StrongPass123!",
            "username": username,
        },
    )

    assert second_response.status_code == 400
    assert second_response.json() == {"detail": "REGISTER_USER_ALREADY_EXISTS"}
