from __future__ import annotations

import asyncio
import logging

from app.services.mail import send_email_message
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

_MAX_RETRIES = 3
_RETRY_COUNTDOWN = 60


@celery_app.task(
    bind=True,
    name="app.tasks.mail_jobs.send_email_task",
    max_retries=_MAX_RETRIES,
    default_retry_delay=_RETRY_COUNTDOWN,
    acks_late=True,
)
def send_email_task(
    self,
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str | None = None,
) -> bool:
    """Send a transactional email. Retries up to 3 times on failure."""
    try:
        return asyncio.run(
            send_email_message(
                to_email=to_email,
                subject=subject,
                text_body=text_body,
                html_body=html_body,
            )
        )
    except Exception as exc:
        logger.error("Email delivery failed (attempt %d) to %s: %s", self.request.retries + 1, to_email, exc)
        raise self.retry(exc=exc, countdown=_RETRY_COUNTDOWN) from exc
