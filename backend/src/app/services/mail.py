from __future__ import annotations

import logging
from functools import lru_cache

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import NameEmail, SecretStr

from app.core.config import get_settings

logger = logging.getLogger(__name__)


async def send_email_message(*, to_email: str, subject: str, text_body: str, html_body: str | None = None) -> bool:
    settings = get_settings()

    if not settings.mail_enabled:
        logger.info("Mail delivery disabled. Skipping email to %s with subject %s", to_email, subject)
        return False

    message = MessageSchema(
        subject=subject,
        recipients=[NameEmail(name=to_email, email=to_email)],
        body=html_body or text_body,
        alternative_body=text_body if html_body else None,
        subtype=MessageType.html if html_body else MessageType.plain,
    )

    await FastMail(get_mail_connection_config()).send_message(message)
    return True


@lru_cache
def get_mail_connection_config() -> ConnectionConfig:
    settings = get_settings()
    return ConnectionConfig(
        MAIL_USERNAME=settings.smtp_username or settings.mail_sender_email,
        MAIL_PASSWORD=SecretStr(settings.smtp_password),
        MAIL_FROM=settings.mail_sender_email,
        MAIL_FROM_NAME=settings.mail_sender_name,
        MAIL_PORT=settings.smtp_port,
        MAIL_SERVER=settings.smtp_host,
        MAIL_STARTTLS=settings.smtp_use_tls,
        MAIL_SSL_TLS=settings.smtp_use_ssl,
        USE_CREDENTIALS=bool(settings.smtp_username),
        VALIDATE_CERTS=settings.smtp_validate_certs,
        TIMEOUT=int(settings.smtp_timeout_seconds),
        SUPPRESS_SEND=0,
    )
