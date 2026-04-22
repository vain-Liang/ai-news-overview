from __future__ import annotations

import logging
import re
import sys
from typing import TYPE_CHECKING, cast
from uuid import UUID

import jwt
from fastapi_users import BaseUserManager, InvalidPasswordException, UUIDIDMixin, exceptions
from fastapi_users.jwt import decode_jwt, generate_jwt
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase  # noqa: TC002
from sqlalchemy import func, select
from zxcvbn import zxcvbn

from app.core.config import get_settings
from app.models.user import User
from app.tasks.mail_jobs import send_email_task

if TYPE_CHECKING:
    from fastapi import Request, Response

    from app.schemas.user import UserCreate

settings = get_settings()
logger = logging.getLogger(__name__)


class UserManager(UUIDIDMixin, BaseUserManager[User, UUID]):
    reset_password_token_secret = settings.auth_secret
    verification_token_secret = settings.auth_secret
    email_change_token_secret = settings.auth_secret
    email_change_token_audience = "fastapi-users:verify-email-change"
    reset_password_token_lifetime_seconds = settings.token_lifetime_seconds
    verification_token_lifetime_seconds = settings.token_lifetime_seconds
    email_change_token_lifetime_seconds = settings.token_lifetime_seconds

    async def validate_password(
        self,
        password: str,
        user: UserCreate | User,
    ) -> None:
        if len(password) < 8:
            raise InvalidPasswordException(
                reason="Password should be at least 8 characters",
            )

        if user.email.lower() in password.lower():
            raise InvalidPasswordException(
                reason="Password should not contain e-mail",
            )

        has_lowercase = bool(re.search(r"[a-z]", password))
        has_uppercase = bool(re.search(r"[A-Z]", password))
        has_symbol = bool(re.search(r"[^a-zA-Z0-9]", password))
        if not (has_lowercase and has_uppercase and has_symbol):
            raise InvalidPasswordException(
                reason="Password must include uppercase, lowercase, and special characters",
            )

        # Use [zxcvbn](https://github.com/dwolfhub/zxcvbn-python) to check weak password
        if zxcvbn(password)["score"] < 3:
            raise InvalidPasswordException(
                reason="Password is too weak",
            )

    async def on_after_register(self, user: User, request: Request | None = None) -> None:
        logger.info("User %s has registered.", user.id)
        try:
            await self.request_verify(user, request)
        except exceptions.UserAlreadyVerified:
            logger.info("User %s is already verified after registration hook.", user.id)

    async def on_after_login(
        self,
        user: User,
        request: Request | None = None,
        response: Response | None = None,
    ) -> None:
        logger.info("User %s logged in.", user.id)

    async def on_after_forgot_password(
        self,
        user: User,
        token: str,
        request: Request | None = None,
    ) -> None:
        reset_url = f"{settings.frontend_base_url}/reset-password?token={token}"
        if settings.debug:
            self._print_debug_link_notice(
                title="PASSWORD RESET LINK",
                subtitle="Open this URL in the browser to reset the password during local development.",
                user_email=user.email,
                url=reset_url,
                color_code="33",
            )

        self._send_auth_action_email(
            to_email=user.email,
            subject="Reset your password",
            headline="Reset your password",
            action_url=reset_url,
            action_label="Reset password",
            fallback_instructions="If the button does not work, copy and paste this URL into your browser:",
        )

    async def on_after_reset_password(self, user: User, request: Request | None = None) -> None:
        logger.info("User %s reset their password.", user.id)

    async def on_after_request_verify(
        self,
        user: User,
        token: str,
        request: Request | None = None,
    ) -> None:
        verify_url = f"{settings.frontend_base_url}/verify-account?token={token}"
        if settings.debug:
            self._print_debug_link_notice(
                title="ACCOUNT VERIFICATION LINK",
                subtitle="Open this URL in the browser to confirm the account during local development.",
                user_email=user.email,
                url=verify_url,
                color_code="36",
            )

        self._send_auth_action_email(
            to_email=user.email,
            subject="Confirm your account",
            headline="Confirm your account",
            action_url=verify_url,
            action_label="Confirm account",
            fallback_instructions="If the button does not work, copy and paste this URL into your browser:",
        )

    async def on_after_verify(self, user: User, request: Request | None = None) -> None:
        logger.info("User %s verified their email address.", user.id)

    async def on_after_request_email_change(
        self,
        user: User,
        token: str,
        pending_email: str,
        request: Request | None = None,
    ) -> None:
        verify_url = f"{settings.frontend_base_url}/verify-account?token={token}&mode=email-change&email={pending_email}"
        if settings.debug:
            self._print_debug_link_notice(
                title="EMAIL CHANGE VERIFICATION LINK",
                subtitle="Open this URL in the browser to confirm the new email address during local development.",
                user_email=pending_email,
                url=verify_url,
                color_code="35",
            )

        self._send_auth_action_email(
            to_email=pending_email,
            subject="Confirm your new email address",
            headline="Confirm your new email address",
            action_url=verify_url,
            action_label="Confirm new email",
            fallback_instructions="If the button does not work, copy and paste this URL into your browser:",
        )

    async def on_after_verify_email_change(self, user: User, request: Request | None = None) -> None:
        logger.info("User %s verified a pending email change.", user.id)

    async def _username_exists(self, username: str) -> bool:
        user_db = cast("SQLAlchemyUserDatabase[User, UUID]", self.user_db)
        statement = select(User).where(func.lower(User.username) == func.lower(username))
        result = await user_db.session.execute(statement)
        return result.scalar_one_or_none() is not None

    async def _pending_email_exists(self, pending_email: str, *, excluding_user_id: UUID | None = None) -> bool:
        user_db = cast("SQLAlchemyUserDatabase[User, UUID]", self.user_db)
        statement = select(User).where(func.lower(User.pending_email) == func.lower(pending_email))
        if excluding_user_id is not None:
            statement = statement.where(User.id != excluding_user_id)
        result = await user_db.session.execute(statement)
        return result.scalar_one_or_none() is not None

    async def create(
        self,
        user_create: UserCreate,
        safe: bool = False,
        request: Request | None = None,
    ) -> User:
        await self.validate_password(user_create.password, user_create)

        normalized_email = user_create.email.strip().lower()
        normalized_username = self._normalize_optional_text(user_create.username)
        normalized_nickname = self._normalize_optional_text(user_create.nickname)

        existing_user = await self.user_db.get_by_email(normalized_email)
        if existing_user is not None:
            raise exceptions.UserAlreadyExists

        if normalized_username and await self._username_exists(normalized_username):
            raise exceptions.UserAlreadyExists

        user_dict = (
            user_create.create_update_dict()
            if safe
            else user_create.create_update_dict_superuser()
        )
        password = user_dict.pop("password")
        user_dict["email"] = normalized_email
        user_dict["username"] = normalized_username
        user_dict["nickname"] = normalized_nickname
        user_dict["hashed_password"] = self.password_helper.hash(password)

        created_user = await self.user_db.create(user_dict)

        await self.on_after_register(created_user, request)

        return created_user

    async def update(
        self,
        user_update,
        user: User,
        safe: bool = False,
        request: Request | None = None,
    ) -> User:
        updated_user_data = (
            user_update.create_update_dict()
            if safe
            else user_update.create_update_dict_superuser()
        )

        if "username" in updated_user_data:
            updated_user_data["username"] = self._normalize_optional_text(updated_user_data["username"])
            username = updated_user_data["username"]
            if username and username.lower() != (user.username or "").lower() and await self._username_exists(username):
                raise exceptions.UserAlreadyExists

        if "nickname" in updated_user_data:
            updated_user_data["nickname"] = self._normalize_optional_text(updated_user_data["nickname"])

        updated_user = await self._update(user, updated_user_data)
        await self.on_after_update(updated_user, updated_user_data, request)
        return updated_user

    async def request_email_change(
        self,
        user: User,
        new_email: str,
        request: Request | None = None,
    ) -> User:
        if not user.is_active:
            raise exceptions.UserInactive

        normalized_email = new_email.strip().lower()
        if normalized_email == user.email:
            return user

        existing_user = await self.user_db.get_by_email(normalized_email)
        if existing_user is not None and existing_user.id != user.id:
            raise exceptions.UserAlreadyExists

        if await self._pending_email_exists(normalized_email, excluding_user_id=user.id):
            raise exceptions.UserAlreadyExists

        updated_user = await self._update(user, {"pending_email": normalized_email})
        token = generate_jwt(
            {
                "sub": str(updated_user.id),
                "email": normalized_email,
                "aud": self.email_change_token_audience,
            },
            self.email_change_token_secret,
            self.email_change_token_lifetime_seconds,
        )
        await self.on_after_request_email_change(updated_user, token, normalized_email, request)
        return updated_user

    async def verify_email_change(self, token: str, request: Request | None = None) -> User:
        try:
            data = decode_jwt(
                token,
                self.email_change_token_secret,
                [self.email_change_token_audience],
            )
        except jwt.PyJWTError as exc:
            raise exceptions.InvalidVerifyToken from exc

        try:
            user_id = data["sub"]
            pending_email = str(data["email"]).strip().lower()
        except KeyError as exc:
            raise exceptions.InvalidVerifyToken from exc

        try:
            parsed_id = self.parse_id(user_id)
            user = await self.get(parsed_id)
        except (exceptions.InvalidID, exceptions.UserNotExists) as exc:
            raise exceptions.InvalidVerifyToken from exc

        if not user.pending_email or user.pending_email.lower() != pending_email:
            raise exceptions.InvalidVerifyToken

        existing_user = await self.user_db.get_by_email(pending_email)
        if existing_user is not None and existing_user.id != user.id:
            raise exceptions.UserAlreadyExists

        verified_user = await self._update(
            user,
            {
                "email": pending_email,
                "pending_email": None,
                "is_verified": True,
            },
        )
        await self.on_after_verify_email_change(verified_user, request)
        return verified_user

    @staticmethod
    def _normalize_optional_text(value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None

    def _send_auth_action_email(
        self,
        *,
        to_email: str,
        subject: str,
        headline: str,
        action_url: str,
        action_label: str,
        fallback_instructions: str,
    ) -> None:
        text_body = (
            f"{headline}\n\n"
            f"{action_label}: {action_url}\n\n"
            f"{fallback_instructions}\n{action_url}\n"
        )
        html_body = (
            "<html><body style=\"font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;\">"
            f"<h2>{headline}</h2>"
            f"<p><a href=\"{action_url}\" style=\"display:inline-block;padding:12px 20px;background:#2563eb;"
            "color:#ffffff;text-decoration:none;border-radius:8px;\">"
            f"{action_label}</a></p>"
            f"<p>{fallback_instructions}</p>"
            f"<p><a href=\"{action_url}\">{action_url}</a></p>"
            "</body></html>"
        )

        try:
            send_email_task.delay(
                to_email=to_email,
                subject=subject,
                text_body=text_body,
                html_body=html_body,
            )
        except Exception:
            logger.exception("Failed to queue auth email '%s' to %s", subject, to_email)

    @staticmethod
    def _print_debug_link_notice(
        *,
        title: str,
        subtitle: str,
        user_email: str,
        url: str,
        color_code: str,
    ) -> None:
        reset = "\033[0m"
        bold = "\033[1m"
        color = f"\033[{color_code}m"
        dim = "\033[2m"
        lines = [
            "",
            f"{bold}{color}{'=' * 76}{reset}",
            f"{bold}{color}🔗 {title}{reset}",
            f"{dim}{subtitle}{reset}",
            f"{bold}User:{reset} {user_email}",
            f"{bold}URL:{reset}  {url}",
            f"{bold}{color}{'=' * 76}{reset}",
            "",
        ]
        print("\n".join(lines), file=sys.stderr, flush=True)
