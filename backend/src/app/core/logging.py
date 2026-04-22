from __future__ import annotations

import json
import logging
import sys
from contextvars import ContextVar
from typing import Any

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

_TEXT_FORMAT = "%(asctime)s | %(levelname)-8s | %(name)s | rid=%(request_id)s | %(message)s"
_DATE_FORMAT = "%Y-%m-%dT%H:%M:%S"


class _RequestIdFilter(logging.Filter):
    """Inject request_id from the active context variable into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get("-")  # type: ignore[attr-defined]
        return True


class _JsonFormatter(logging.Formatter):
    """Emit each log record as a single JSON line."""

    def format(self, record: logging.LogRecord) -> str:
        record.request_id = request_id_ctx.get("-")  # type: ignore[attr-defined]
        payload: dict[str, Any] = {
            "ts": self.formatTime(record, self.datefmt or _DATE_FORMAT),
            "level": record.levelname,
            "logger": record.name,
            "rid": record.request_id,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def setup_logging(level: str = "INFO", fmt: str = "text") -> None:
    """Configure root logging and silence noisy third-party loggers.

    Call once at application startup before any log messages are emitted.
    """
    numeric_level = getattr(logging, level.upper(), logging.INFO)
    rid_filter = _RequestIdFilter()

    if fmt == "json":
        handler: logging.Handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(_JsonFormatter())
    else:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(_TEXT_FORMAT, datefmt=_DATE_FORMAT))

    handler.addFilter(rid_filter)
    logging.basicConfig(level=numeric_level, handlers=[handler], force=True)

    # Suppress overly verbose third-party loggers
    for noisy in ("httpx", "httpcore", "chromadb", "crawl4ai", "urllib3"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    logging.getLogger("uvicorn.access").setLevel(numeric_level)
    logging.getLogger("uvicorn.error").setLevel(numeric_level)
