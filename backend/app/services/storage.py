"""
Storage abstraction. Suporta:
  - Supabase Storage (bucket configurado em SUPABASE_STORAGE_BUCKET)
  - Filesystem local (fallback dev)
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import BinaryIO

from loguru import logger

from app.core.config import settings
from app.core.supabase_admin import get_supabase_admin


def _safe_name(filename: str) -> str:
    base = os.path.basename(filename or "file").replace("/", "_")
    return f"{uuid.uuid4().hex[:8]}_{base}"


async def upload_file(
    *,
    content: bytes,
    original_filename: str,
    mime_type: str | None = None,
    folder: str = "imports",
) -> str:
    """
    Faz upload de um ficheiro. Devolve um identificador (path ou object key).
    O caminho local é devolvido se storage_backend == 'local'.
    """
    name = _safe_name(original_filename)
    object_key = f"{folder}/{name}"

    if settings.storage_backend == "supabase":
        sb = get_supabase_admin()
        if sb is None:
            logger.warning("Supabase admin indisponível, a cair para local")
            return _upload_local(content, name)
        try:
            sb.storage.from_(settings.supabase_storage_bucket).upload(
                path=object_key,
                file=content,
                file_options={"content-type": mime_type or "application/octet-stream"},
            )
            return object_key
        except Exception as e:
            logger.error(f"Supabase upload falhou: {e}; fallback local")
            return _upload_local(content, name)

    return _upload_local(content, name)


def _upload_local(content: bytes, name: str) -> str:
    Path(settings.ocr_upload_dir).mkdir(parents=True, exist_ok=True)
    p = Path(settings.ocr_upload_dir) / name
    p.write_bytes(content)
    return str(p)


async def download_to_local(object_key: str) -> str:
    """Para processamento: se vier do Supabase, descarrega para tmp local e devolve path."""
    if settings.storage_backend != "supabase" or not object_key.startswith("imports/"):
        return object_key
    sb = get_supabase_admin()
    if sb is None:
        return object_key
    try:
        data = sb.storage.from_(settings.supabase_storage_bucket).download(object_key)
        Path(settings.ocr_upload_dir).mkdir(parents=True, exist_ok=True)
        p = Path(settings.ocr_upload_dir) / Path(object_key).name
        p.write_bytes(data)
        return str(p)
    except Exception as e:
        logger.error(f"Download Supabase falhou: {e}")
        return object_key


async def delete_object(object_key: str) -> None:
    if settings.storage_backend == "supabase" and object_key.startswith("imports/"):
        sb = get_supabase_admin()
        if sb is not None:
            try:
                sb.storage.from_(settings.supabase_storage_bucket).remove([object_key])
            except Exception as e:
                logger.warning(f"Supabase delete falhou: {e}")
    else:
        try:
            os.remove(object_key)
        except OSError:
            pass
