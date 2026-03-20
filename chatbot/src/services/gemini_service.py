"""
Wraps the Google Generative AI SDK for Gemini Flash chat.

The system prompt is built dynamically:
  - If a specific crop guide is provided, it is injected in full.
  - Otherwise, only the list of known crop names is injected and Gemini
    is instructed to ask the user to clarify which crop they mean.
"""

import logging
from typing import Optional

import google.generativeai as genai

from src.config import settings

logger = logging.getLogger(__name__)

MODEL_NAME = "gemini-2.5-flash"

# Configure once at module load
genai.configure(api_key=settings.gemini_api_key)

_BASE_SYSTEM_PROMPT = """You are an agricultural assistant built by Solara. \
Your main priority is to use the provided crop guides to assist farmers with questions about crop cultivation. \
You must ONLY answer questions related to agriculture and the provided crop guides. If a user asks about an unrelated topic, politely decline to answer and steer the conversation back to agriculture. \
Be concise, practical, and friendly. \
Always answer in the same language the user writes in. \
Do not make up information that is not present in the provided crop guide data."""

_GUIDE_TEMPLATE = """
You have been given the following crop guide to answer the user's question:

Crop: {name} ({scientific_name})
Optimal Temperature: {temp_min}°C – {temp_max}°C
Days to Maturity: {days_to_maturity}
Description: {description}
Planting Instructions: {planting_instructions}
Care Instructions: {care_instructions}

Use this information to answer the user's question accurately.
"""

_NO_GUIDE_TEMPLATE = """
The user has not specified a crop clearly. The available crops in the system are:
{crop_list}

Politely ask the user which crop they would like guidance on.
"""


def _build_system_prompt(
    crop_guide: Optional[dict] = None,
    crop_names: Optional[list[str]] = None,
) -> str:
    if crop_guide:
        context = _GUIDE_TEMPLATE.format(
            name=crop_guide.get("name", "Unknown"),
            scientific_name=crop_guide.get("scientificName") or "N/A",
            temp_min=crop_guide.get("optimalTemperatureMin", "N/A"),
            temp_max=crop_guide.get("optimalTemperatureMax", "N/A"),
            days_to_maturity=crop_guide.get("daysToMaturity", "N/A"),
            description=crop_guide.get("description") or "No description available.",
            planting_instructions=crop_guide.get("plantingInstructions") or "Not specified.",
            care_instructions=crop_guide.get("careInstructions") or "Not specified.",
        )
    elif crop_names:
        crop_list = "\n".join(f"- {name}" for name in sorted(crop_names))
        context = _NO_GUIDE_TEMPLATE.format(crop_list=crop_list)
    else:
        context = "\nNo crop guide data is currently available. Answer based on general agricultural knowledge and remind the user that detailed guides may not be loaded."

    return _BASE_SYSTEM_PROMPT + context


async def get_reply(
    user_message: str,
    conversation_history: list[dict],
    crop_guide: Optional[dict] = None,
    crop_names: Optional[list[str]] = None,
) -> str:
    """
    Sends the user message to Gemini Flash and returns the reply text.

    Args:
        user_message: The latest message from the user.
        conversation_history: List of previous turns [{role: "user"|"model", content: str}].
        crop_guide: Full crop guide dict to inject as context (mutually exclusive with crop_names).
        crop_names: List of display names to show when no specific crop detected.
    """
    system_prompt = _build_system_prompt(crop_guide=crop_guide, crop_names=crop_names)

    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=system_prompt,
    )

    # Convert our history format to Gemini's format
    history = [
        {"role": turn["role"], "parts": [turn["content"]]}
        for turn in conversation_history
    ]

    chat = model.start_chat(history=history)

    try:
        response = await chat.send_message_async(user_message)
        return response.text
    except Exception as exc:
        logger.error("Gemini API error: %s", exc)
        raise
