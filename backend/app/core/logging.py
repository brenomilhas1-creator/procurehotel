"""
Logging estruturado com Loguru.
"""

from __future__ import annotations

import json
import sys

from loguru import logger

from app.core.config import settings


def _json_sink(message) -> None:
    record = message.record
    payload = {
        "ts": record["time"].isoformat(),
        "level": record["level"].name,
        "msg": record["message"],
        "module": record["name"],
        "func": record["function"],
        "line": record["line"],
    }
    if record["extra"]:
        payload.update(record["extra"])
    if record["exception"] is not None:
        payload["exception"] = str(record["exception"])
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")


def setup_logging() -> None:
    logger.remove()
    if settings.app_env == "production":
        logger.add(_json_sink, level="INFO", serialize=False, enqueue=True)
    else:
        logger.add(
            sys.stderr,
            level="DEBUG" if settings.app_env == "development" else "INFO",
            colorize=True,
            format=(
                "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
                "<level>{level: <8}</level> | "
                "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
                "<level>{message}</level>"
            ),
            enqueue=True,
        )


def get_logger():
    return logger
