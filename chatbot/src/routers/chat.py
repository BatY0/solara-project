"""
POST /api/v1/chat  — main chatbot endpoint.

Flow:
  1. Fetch the cached crop name/id index from the backend.
  2. Ask the Groq-based crop identifier which crop (if any) the user means.
     Handles any language (Turkish, Arabic, etc.) transparently.
     Falls back gracefully if Groq is unavailable.
  3. If a crop id was resolved → fetch the full guide and inject it as context.
     If none → inject only the name list so Gemini can ask for clarification.
  4. Call Gemini 2.5 Flash and return the reply + updated history.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.services import crop_guide_client, gemini_service, crop_identifier_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str
    crop_id: Optional[str] = None  # Which crop was active during this turn


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list[ChatMessage]] = []
    crop_id: Optional[str] = None  # Pre-selected crop from the calling app


class ChatResponse(BaseModel):
    reply: str
    conversation_history: list[ChatMessage]
    crop_id: Optional[str] = None  # The ID of the crop discussed in this turn


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Get cached name/id index
    crop_index = await crop_guide_client.get_crop_index()

    # 2. Ask the Groq identifier which crop the user is referring to.
    #    It understands any language and uses crop_id as the "active crop" hint.
    #    The full history (with per-turn crop_ids) lets it resolve vague references
    #    like "the first one" or "the other crop" without relying on the full text.
    resolved_id = await crop_identifier_service.identify(
        message=request.message,
        crop_index=crop_index,
        conversation_history=[
            {"role": m.role, "content": m.content, "crop_id": m.crop_id}
            for m in (request.conversation_history or [])
        ],
        active_crop_id=request.crop_id,
    )

    # 3. Fetch the full guide if a crop was identified
    crop_guide = None
    if resolved_id:
        crop_guide = await crop_guide_client.get_crop_by_id(resolved_id)

    # 4. Build history list (dicts for the service)
    history = [
        {"role": m.role, "content": m.content}
        for m in (request.conversation_history or [])
    ]

    # 5. Call Gemini
    try:
        reply = await gemini_service.get_reply(
            user_message=request.message,
            conversation_history=history,
            crop_guide=crop_guide,
            crop_names=[v["display_name"] for v in crop_index.values()] if not resolved_id else None,
        )
    except Exception as exc:
        logger.error("Error getting reply from Gemini: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to get a response from the AI model.")

    # 6. Append this turn to history and return
    # Both the user and model messages are stamped with the resolved crop_id
    # so future turns can trace which crop was being discussed at each point.
    updated_history = list(request.conversation_history or []) + [
        ChatMessage(role="user",  content=request.message, crop_id=resolved_id),
        ChatMessage(role="model", content=reply,            crop_id=resolved_id),
    ]

    return ChatResponse(
        reply=reply,
        conversation_history=updated_history,
        crop_id=resolved_id
    )
