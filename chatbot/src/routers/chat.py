"""
POST /api/v1/chat  — main chatbot endpoint.

Flow:
  1. Fetch the cached crop name index.
  2. Scan the user message for a matching crop name.
  3. If found  → fetch the full guide and inject it as context.
     If not    → inject only the name list and let Gemini ask for clarification.
  4. Call Gemini Flash and return the reply + updated history.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.services import crop_guide_client, gemini_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    conversation_history: list[ChatMessage]


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # 1. Get cached name index
    crop_names = await crop_guide_client.get_crop_names()

    # 2. Try to detect which crop the user is asking about
    matched = crop_guide_client.find_crop_in_message(request.message, crop_names)

    crop_guide = None
    if matched:
        crop_guide = await crop_guide_client.get_crop_by_id(matched["id"])

    # 3. Build history list (dicts for the service)
    history = [
        {"role": m.role, "content": m.content}
        for m in (request.conversation_history or [])
    ]

    # 4. Call Gemini
    try:
        reply = await gemini_service.get_reply(
            user_message=request.message,
            conversation_history=history,
            crop_guide=crop_guide,
            crop_names=[v["display_name"] for v in crop_names.values()] if not matched else None,
        )
    except Exception as exc:
        logger.error("Error getting reply from Gemini: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to get a response from the AI model.")

    # 5. Append this turn to history and return
    updated_history = list(request.conversation_history or []) + [
        ChatMessage(role="user", content=request.message),
        ChatMessage(role="model", content=reply),
    ]

    return ChatResponse(reply=reply, conversation_history=updated_history)
