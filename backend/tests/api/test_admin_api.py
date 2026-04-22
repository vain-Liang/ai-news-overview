from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase


async def _create_user(
    *,
    email: str,
    password: str,
    is_superuser: bool,
    is_active: bool = True,
    username: str | None = None,
    nickname: str | None = None,
    created_at: datetime | None = None,
    updated_at: datetime | None = None,
):
    from app.auth.manager import UserManager
    from app.core.database import async_session_maker
    from app.models.user import User

    async with async_session_maker() as session:
        user_db = SQLAlchemyUserDatabase(session, User)
        manager = UserManager(user_db)
        user = User(
            email=email,
            hashed_password=manager.password_helper.hash(password),
            is_active=is_active,
            is_superuser=is_superuser,
            is_verified=True,
            username=username,
            nickname=nickname,
        )
        session.add(user)
        await session.flush()

        if created_at is not None:
            user.created_at = created_at
        if updated_at is not None:
            user.updated_at = updated_at

        await session.commit()
        await session.refresh(user)
        return user


async def _login(client, *, email: str, password: str) -> str:
    response = await client.post(
        "/auth/jwt/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


@pytest.mark.asyncio
async def test_admin_user_list_requires_superuser(client) -> None:
    password = "StrongPass123!"
    email = f"member-{uuid.uuid4().hex[:8]}@example.com"
    await _create_user(email=email, password=password, is_superuser=False)
    token = await _login(client, email=email, password=password)

    response = await client.get(
        "/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_superuser_can_list_users_with_default_pagination(client) -> None:
    admin_password = "StrongPass123!"
    admin_email = f"admin-{uuid.uuid4().hex[:8]}@example.com"

    base_time = datetime(2026, 1, 1, tzinfo=UTC)
    await _create_user(
        email=admin_email,
        password=admin_password,
        is_superuser=True,
        created_at=base_time - timedelta(days=1),
        updated_at=base_time - timedelta(days=1),
    )

    created_users = []
    for index in range(12):
        created_users.append(
            await _create_user(
                email=f"member-{index}-{uuid.uuid4().hex[:6]}@example.com",
                password=admin_password,
                is_superuser=False,
                username=f"member-{index}",
                nickname=f"Nickname {index}",
                created_at=base_time + timedelta(days=index),
                updated_at=base_time + timedelta(days=index, hours=1),
            )
        )

    token = await _login(client, email=admin_email, password=admin_password)

    list_response = await client.get(
        "/admin/users",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert list_response.status_code == 200
    payload = list_response.json()
    assert payload["summary"]["total"] == 13
    assert payload["summary"]["active"] == 13
    assert payload["summary"]["inactive"] == 0
    assert payload["summary"]["superusers"] == 1
    assert payload["pagination"] == {
        "page": 1,
        "page_size": 10,
        "total_items": 13,
        "total_pages": 2,
    }
    assert len(payload["users"]) == 10
    returned_ids = [user["id"] for user in payload["users"]]
    expected_ids = [str(user.id) for user in reversed(created_users[-10:])]
    assert returned_ids[:10] == expected_ids


@pytest.mark.asyncio
async def test_superuser_can_filter_paginate_and_toggle_account_status(client) -> None:
    admin_password = "StrongPass123!"
    admin_email = f"admin-{uuid.uuid4().hex[:8]}@example.com"
    base_time = datetime(2026, 2, 1, tzinfo=UTC)
    await _create_user(
        email=admin_email,
        password=admin_password,
        is_superuser=True,
        created_at=base_time - timedelta(days=1),
        updated_at=base_time - timedelta(days=1),
    )

    member_alpha = await _create_user(
        email=f"alpha-{uuid.uuid4().hex[:8]}@example.com",
        password=admin_password,
        is_superuser=False,
        is_active=True,
        username="alpha-writer",
        nickname="Alpha Desk",
        created_at=base_time,
        updated_at=base_time + timedelta(days=1),
    )
    await _create_user(
        email=f"beta-{uuid.uuid4().hex[:8]}@example.com",
        password=admin_password,
        is_superuser=False,
        is_active=False,
        username="beta-editor",
        nickname="City Beta",
        created_at=base_time + timedelta(days=2),
        updated_at=base_time + timedelta(days=2, hours=1),
    )
    member_gamma = await _create_user(
        email=f"gamma-{uuid.uuid4().hex[:8]}@example.com",
        password=admin_password,
        is_superuser=False,
        is_active=True,
        username="gamma-producer",
        nickname="Gamma Pulse",
        created_at=base_time + timedelta(days=4),
        updated_at=base_time + timedelta(days=5),
    )

    token = await _login(client, email=admin_email, password=admin_password)

    search_response = await client.get(
        "/admin/users",
        params={
            "search": "gamma",
            "created_from": (base_time + timedelta(days=3)).isoformat(),
            "updated_to": (base_time + timedelta(days=5, hours=1)).isoformat(),
            "is_active": "true",
            "page": 1,
            "page_size": 5,
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert search_response.status_code == 200
    search_payload = search_response.json()
    assert search_payload["summary"] == {
        "total": 4,
        "active": 3,
        "inactive": 1,
        "superusers": 1,
    }
    assert search_payload["pagination"] == {
        "page": 1,
        "page_size": 5,
        "total_items": 1,
        "total_pages": 1,
    }
    assert [user["id"] for user in search_payload["users"]] == [str(member_gamma.id)]

    page_response = await client.get(
        "/admin/users",
        params={"page": 2, "page_size": 2},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert page_response.status_code == 200
    page_payload = page_response.json()
    assert page_payload["pagination"] == {
        "page": 2,
        "page_size": 2,
        "total_items": 4,
        "total_pages": 2,
    }
    assert len(page_payload["users"]) == 2

    update_response = await client.patch(
        f"/admin/users/{member_alpha.id}",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert update_response.status_code == 200
    assert update_response.json()["is_active"] is False


@pytest.mark.asyncio
async def test_admin_user_list_rejects_invalid_date_ranges(client) -> None:
    password = "StrongPass123!"
    email = f"admin-{uuid.uuid4().hex[:8]}@example.com"
    await _create_user(email=email, password=password, is_superuser=True)
    token = await _login(client, email=email, password=password)

    response = await client.get(
        "/admin/users",
        params={
            "created_from": "2026-03-10T00:00:00+00:00",
            "created_to": "2026-03-01T00:00:00+00:00",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "created_from cannot be later than created_to."


@pytest.mark.asyncio
async def test_superuser_cannot_disable_own_account(client) -> None:
    admin_password = "StrongPass123!"
    admin = await _create_user(
        email=f"self-admin-{uuid.uuid4().hex[:8]}@example.com",
        password=admin_password,
        is_superuser=True,
    )
    token = await _login(client, email=admin.email, password=admin_password)

    response = await client.patch(
        f"/admin/users/{admin.id}",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Superusers cannot disable their own account."
