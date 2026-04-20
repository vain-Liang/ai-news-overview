from __future__ import annotations

import uuid
from types import MethodType
from typing import TYPE_CHECKING, Any, cast

import pytest
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase

if TYPE_CHECKING:
    from httpx import AsyncClient

    from app.auth.manager import UserManager


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
    assert "/auth/jwt/login" in payload["auth"]["login_path"]
    assert "/auth/cookie/login" in payload["auth"]["login_path"]
    assert payload["auth"]["forgot_password_path"] == "/auth/forgot-password"
    assert payload["auth"]["reset_password_path"] == "/auth/reset-password"
    assert payload["auth"]["request_verify_path"] == "/auth/request-verify-token"
    assert payload["auth"]["verify_path"] == "/auth/verify"
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


@pytest.mark.asyncio
async def test_register_sends_verification_email(client: AsyncClient, monkeypatch: pytest.MonkeyPatch) -> None:
    sent_messages: list[dict[str, str]] = []

    async def fake_send_email_message(*, to_email: str, subject: str, text_body: str, html_body: str | None = None) -> bool:
        sent_messages.append(
            {
                "to_email": to_email,
                "subject": subject,
                "text_body": text_body,
                "html_body": html_body or "",
            }
        )
        return True

    monkeypatch.setattr("app.auth.manager.send_email_message", fake_send_email_message)

    email = f"verify-{uuid.uuid4().hex[:8]}@example.com"
    response = await client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "StrongPass123!",
            "username": f"verify-user-{uuid.uuid4().hex[:6]}",
        },
    )

    assert response.status_code == 201
    assert sent_messages
    assert sent_messages[0]["to_email"] == email
    assert sent_messages[0]["subject"] == "Confirm your account"
    assert "/verify-account?token=" in sent_messages[0]["text_body"]


@pytest.mark.asyncio
async def test_request_verify_token_resends_verification_email(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    sent_messages: list[dict[str, str]] = []

    async def fake_send_email_message(*, to_email: str, subject: str, text_body: str, html_body: str | None = None) -> bool:
        sent_messages.append(
            {
                "to_email": to_email,
                "subject": subject,
                "text_body": text_body,
                "html_body": html_body or "",
            }
        )
        return True

    monkeypatch.setattr("app.auth.manager.send_email_message", fake_send_email_message)

    email = f"resend-{uuid.uuid4().hex[:8]}@example.com"
    register_response = await client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "StrongPass123!",
            "username": f"resend-user-{uuid.uuid4().hex[:6]}",
        },
    )
    assert register_response.status_code == 201
    sent_messages.clear()

    response = await client.post(
        "/auth/request-verify-token",
        json={"email": email},
    )

    assert response.status_code == 202
    assert sent_messages
    assert sent_messages[0]["to_email"] == email
    assert sent_messages[0]["subject"] == "Confirm your account"


@pytest.mark.asyncio
async def test_debug_password_reset_link_is_printed_to_terminal(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    from app.auth.manager import UserManager
    from app.core.database import async_session_maker
    from app.models.user import User

    async def fake_send_email_message(**_: object) -> bool:
        return False

    monkeypatch.setattr("app.auth.manager.send_email_message", fake_send_email_message)
    monkeypatch.setattr("app.auth.manager.settings.debug", True)

    async with async_session_maker() as session:
        user_db = SQLAlchemyUserDatabase(session, User)
        user_manager: UserManager = UserManager(user_db)
        user = User(
            email=f"print-reset-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            is_active=True,
            is_superuser=False,
            is_verified=False,
        )
        await user_manager.on_after_forgot_password(user, "reset-token")

    captured = capsys.readouterr()
    assert "PASSWORD RESET LINK" in captured.err
    assert "/reset-password?token=reset-token" in captured.err
    assert "\033[" in captured.err


@pytest.mark.asyncio
async def test_debug_verify_link_is_printed_to_terminal(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    from app.auth.manager import UserManager
    from app.core.database import async_session_maker
    from app.models.user import User

    async def fake_send_email_message(**_: object) -> bool:
        return False

    monkeypatch.setattr("app.auth.manager.send_email_message", fake_send_email_message)
    monkeypatch.setattr("app.auth.manager.settings.debug", True)

    async with async_session_maker() as session:
        user_db = SQLAlchemyUserDatabase(session, User)
        user_manager: UserManager = UserManager(user_db)
        user = User(
            email=f"print-verify-{uuid.uuid4().hex[:8]}@example.com",
            hashed_password="hashed",
            is_active=True,
            is_superuser=False,
            is_verified=False,
        )
        await user_manager.on_after_request_verify(user, "verify-token")

    captured = capsys.readouterr()
    assert "ACCOUNT VERIFICATION LINK" in captured.err
    assert "/verify-account?token=verify-token" in captured.err
    assert "\033[" in captured.err


@pytest.mark.asyncio
async def test_forgot_password_and_reset_password_flow(client: AsyncClient) -> None:
    from app.auth.manager import UserManager
    from app.core.database import async_session_maker
    from app.models.user import User

    email = f"reset-{uuid.uuid4().hex[:8]}@example.com"
    old_password = "StrongPass123!"
    new_password = "NewStrongPass456!"

    register_response = await client.post(
        "/auth/register",
        json={
            "email": email,
            "password": old_password,
            "username": f"reset-user-{uuid.uuid4().hex[:6]}",
        },
    )
    assert register_response.status_code == 201

    forgot_response = await client.post(
        "/auth/forgot-password",
        json={"email": email},
    )
    assert forgot_response.status_code == 202

    reset_token = ""
    async with async_session_maker() as session:
        user_db = SQLAlchemyUserDatabase(session, User)
        user_manager: UserManager = UserManager(user_db)
        user = await user_db.get_by_email(email)
        assert user is not None

        async def capture_token(_self: Any, _user: User, token: str, _request=None) -> None:
            nonlocal reset_token
            reset_token = token

        cast("Any", user_manager).on_after_forgot_password = MethodType(capture_token, user_manager)
        await user_manager.forgot_password(user)

    assert reset_token

    reset_response = await client.post(
        "/auth/reset-password",
        json={
            "token": reset_token,
            "password": new_password,
        },
    )
    assert reset_response.status_code == 200

    old_login_response = await client.post(
        "/auth/jwt/login",
        data={"username": email, "password": old_password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert old_login_response.status_code == 400

    new_login_response = await client.post(
        "/auth/jwt/login",
        data={"username": email, "password": new_password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert new_login_response.status_code == 200


@pytest.mark.asyncio
async def test_verify_account_flow(client: AsyncClient) -> None:
    from app.auth.manager import UserManager
    from app.core.database import async_session_maker
    from app.models.user import User

    email = f"verify-flow-{uuid.uuid4().hex[:8]}@example.com"
    password = "StrongPass123!"

    register_response = await client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "username": f"verify-flow-user-{uuid.uuid4().hex[:6]}",
        },
    )
    assert register_response.status_code == 201

    verify_token = ""
    async with async_session_maker() as session:
        user_db = SQLAlchemyUserDatabase(session, User)
        user_manager: UserManager = UserManager(user_db)
        user = await user_db.get_by_email(email)
        assert user is not None

        async def capture_verify_token(_self: Any, _user: User, token: str, _request=None) -> None:
            nonlocal verify_token
            verify_token = token

        cast("Any", user_manager).on_after_request_verify = MethodType(capture_verify_token, user_manager)
        await user_manager.request_verify(user)

    assert verify_token

    verify_response = await client.post(
        "/auth/verify",
        json={"token": verify_token},
    )
    assert verify_response.status_code == 200
    assert verify_response.json()["email"] == email
    assert verify_response.json()["is_verified"] is True
