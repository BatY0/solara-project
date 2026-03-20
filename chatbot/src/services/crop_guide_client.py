"""
Fetches crop guide data from the Java backend.

Strategy:
  - get_crop_names(): returns a lightweight {name (lowercase) -> {id, display_name}} dict,
    cached for CROP_CACHE_TTL seconds. Used to detect which crop a user is asking about.
  - get_crop_by_id(id): fetches the full guide for a single crop.
"""

import time
import logging
from typing import Optional

import httpx

from src.config import settings

logger = logging.getLogger(__name__)

# In-process cache: (timestamp, data)
_name_cache: tuple[float, dict] | None = None


async def get_crop_names() -> dict[str, dict]:
    """
    Returns a dict mapping lowercase crop name -> {id, display_name}.
    Result is cached for settings.crop_cache_ttl seconds.
    """
    global _name_cache

    now = time.monotonic()
    if _name_cache is not None and (now - _name_cache[0]) < settings.crop_cache_ttl:
        return _name_cache[1]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{settings.backend_base_url}/api/v1/crop-guides/get-all-guides"
            )
            resp.raise_for_status()
            data = resp.json()

        # Backend wraps results in {"data": [...], ...}
        guides = data.get("data", data) if isinstance(data, dict) else data

        result: dict[str, dict] = {}
        for guide in guides:
            name: str = guide.get("name", "")
            if name:
                result[name.lower()] = {
                    "id": guide.get("id"),
                    "display_name": name,
                }

        _name_cache = (now, result)
        return result

    except Exception as exc:
        logger.warning("Could not fetch crop names from backend: %s", exc)
        # Return cached data if available (even if stale), otherwise empty dict
        return _name_cache[1] if _name_cache else {}


async def get_crop_by_id(crop_id: str) -> Optional[dict]:
    """Fetches the full crop guide for a given UUID string."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{settings.backend_base_url}/api/v1/crop-guides/get-guide/{crop_id}"
            )
            resp.raise_for_status()
            data = resp.json()

        return data.get("data", data) if isinstance(data, dict) else data
    except Exception as exc:
        logger.warning("Could not fetch crop guide %s: %s", crop_id, exc)
        return None


def find_crop_in_message(message: str, crop_names: dict[str, dict]) -> Optional[dict]:
    """
    Scans the user message for a known crop name (case-insensitive).
    Returns the matching entry from crop_names or None.
    """
    lower_msg = message.lower()
    # Sort by length descending so longer names match before their substrings
    for name in sorted(crop_names.keys(), key=len, reverse=True):
        if name in lower_msg:
            return crop_names[name]
    return None
