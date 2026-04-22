from __future__ import annotations

from celery import Celery
from celery.schedules import crontab

from app.core.config import get_settings


def _create_celery_app() -> Celery:
    settings = get_settings()
    app = Celery(
        "ai_news_review",
        broker=settings.celery_broker_url,
        backend=settings.celery_result_backend,
        include=["app.tasks.crawl_jobs", "app.tasks.rag_jobs", "app.tasks.mail_jobs"],
    )
    app.conf.update(
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_acks_late=True,
        worker_prefetch_multiplier=1,
        beat_schedule={
            "retrieve-news-twice-daily": {
                "task": "app.tasks.crawl_jobs.run_retrieval_task",
                "schedule": crontab(hour="0,12", minute="0"),
                "kwargs": {"sources": None},
            },
        },
    )
    return app


celery_app = _create_celery_app()
