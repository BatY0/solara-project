"""
Multilingual crop identifier powered by Groq.

Given a user message, the crop name/id index, and the conversation history
(with per-turn crop_id stamps), this service resolves which crop the user is
referring to — in any language.

Context is supplied to Groq as a tiny "hint" list extracted from the history
rather than the full conversation text, keeping token usage minimal.

Gracefully falls back to the active_crop_id if Groq is unavailable.
"""

import re
import logging
from typing import Optional

from groq import AsyncGroq

from src.config import settings

logger = logging.getLogger(__name__)

# UUID v4 pattern for response validation
_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

_client = AsyncGroq(api_key=settings.groq_api_key)

_SYSTEM_PROMPT = (
    "You are a crop name detector. "
    "Your only job is to identify which crop from a given list a user message refers to. "
    "You must reply with EXACTLY one of the following — nothing else:\n"
    "  • The crop's UUID if the user is asking about a crop DIFFERENT from the active one\n"
    "  • SAME   — if the user is still referring to the active crop (or their message is about it)\n"
    "  • NONE   — if the user is not asking about any specific crop in the list\n"
    "Use the 'Previously discussed' list to resolve vague references like "
    "'the first one', 'the other crop', 'that one', etc.\n"
    "Do not explain. Do not add punctuation. Output one token only."
)


def _extract_hint_crops(
    conversation_history: list[dict],
    active_crop_id: Optional[str],
    crop_index: dict[str, dict],
) -> list[tuple[str, str]]:
    """
    Scans the conversation history for crop_id stamps that differ from the
    current active crop. Returns a de-duplicated, ordered list of
    (crop_id, display_name) tuples — oldest first, most recent last.

    This gives Groq enough context to resolve references like
    'the first one' or 'the other crop' without sending full message text.
    """
    # Build reverse map: id -> display_name from the index
    id_to_name: dict[str, str] = {
        entry["id"]: entry["display_name"]
        for entry in crop_index.values()
    }

    seen_ids: list[str] = []
    seen_set: set[str] = set()

    for turn in conversation_history:
        cid = turn.get("crop_id")
        if cid and cid != active_crop_id and cid not in seen_set:
            seen_set.add(cid)
            seen_ids.append(cid)

    return [
        (cid, id_to_name[cid])
        for cid in seen_ids
        if cid in id_to_name
    ]


def _build_user_prompt(
    message: str,
    crop_index: dict[str, dict],
    conversation_history: list[dict],
    active_crop_id: Optional[str],
) -> str:
    # Build full crop list: "- Tomato (id: abc-123)"
    crop_lines = "\n".join(
        f"- {entry['display_name']} (id: {entry['id']})"
        for entry in crop_index.values()
    )

    # Resolve active crop display name
    active_name = "None"
    if active_crop_id:
        for entry in crop_index.values():
            if entry["id"] == active_crop_id:
                active_name = entry["display_name"]
                break

    # Build hint section from stamped history
    hints = _extract_hint_crops(conversation_history, active_crop_id, crop_index)
    if hints:
        hint_lines = "\n".join(f"  - {name} (id: {cid})" for cid, name in hints)
        hint_section = f"\nPreviously discussed in this chat:\n{hint_lines}\n"
    else:
        hint_section = ""

    return (
        f"Active crop: {active_name} (id: {active_crop_id or 'None'})"
        f"{hint_section}\n"
        f"Available crops:\n{crop_lines}\n\n"
        f'User message: "{message}"'
    )


async def identify(
    message: str,
    crop_index: dict[str, dict],
    conversation_history: list[dict],
    active_crop_id: Optional[str] = None,
) -> Optional[str]:
    """
    Identifies the crop the user is referring to in their message.

    Args:
        message:              The latest user message (any language).
        crop_index:           The cached name->{id, display_name} dict.
        conversation_history: List of prior turns, each with an optional
                              'crop_id' key stamped by the chat endpoint.
        active_crop_id:       The crop the calling app considers currently
                              active (used as the SAME baseline).

    Returns:
        A resolved crop UUID string, or None if no specific crop was identified.
    """
    if not crop_index:
        logger.warning("Crop index is empty; skipping identification.")
        return active_crop_id  # Graceful fallback

    user_prompt = _build_user_prompt(
        message=message,
        crop_index=crop_index,
        conversation_history=conversation_history,
        active_crop_id=active_crop_id,
    )

    try:
        response = await _client.chat.completions.create(
            model=settings.groq_model,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.0,   # Deterministic — this is a classification task
            max_tokens=50,     # UUID is 36 chars; "SAME"/"NONE" even shorter
        )
        raw = response.choices[0].message.content.strip()
        logger.debug("Crop identifier raw response: %r", raw)
    except Exception as exc:
        logger.warning("Groq crop identifier failed: %s — falling back to active crop.", exc)
        return active_crop_id  # Graceful degradation

    if raw == "SAME":
        return active_crop_id
    if raw == "NONE":
        return None
    if _UUID_RE.match(raw):
        # Validate the UUID actually exists in our index to prevent hallucination
        known_ids = {entry["id"] for entry in crop_index.values()}
        if raw in known_ids:
            return raw
        logger.warning("Groq returned an unknown crop id %r — discarding.", raw)
        return active_crop_id

    logger.warning("Groq returned unexpected response %r — discarding.", raw)
    return active_crop_id
