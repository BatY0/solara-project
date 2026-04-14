"""
Provides chatbot replies via a configurable LLM provider.

The system prompt is built dynamically:
  - If a specific crop guide is provided, it is injected in full (all fields).
  - Otherwise, only the list of known crop names is injected and the model
    is instructed to ask the user to clarify which crop they mean.
"""

import logging
import json
from typing import Optional

import httpx
import google.generativeai as genai

from src.config import settings

logger = logging.getLogger(__name__)

_OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions"
_OPENROUTER_FREE_ROUTER_MODEL = "openrouter/free"
_OPENROUTER_NON_THINKING_FALLBACK_MODEL = "openai/gpt-oss-120b:free"

_BASE_SYSTEM_PROMPT = """You are an agricultural assistant built by Solara. \
Your main priority is to use the provided crop guides to assist farmers with questions about crop cultivation. \
You must ONLY answer questions related to agriculture and the provided crop guides. If a user asks about an unrelated topic, politely decline to answer and steer the conversation back to agriculture. \
Be concise, practical, and friendly. \
Write naturally and clearly, with correct grammar in the user's language. \
Keep responses short by default: around 3-5 sentences. \
If helpful, use at most 3 short bullet points. \
Prioritize the most useful next-step advice over long explanations. \
Always answer in the same language the user writes in. \
Do not make up information that is not present in the provided crop guide data. \
You are only given one crop guide per turn. Only answer about the crop in the current guide. Do not mention, reference, or acknowledge any other crops from the conversation history unless the user explicitly asks about them in their current message."""

_GUIDE_TEMPLATE = """
You have been given the following crop guide to answer the user's question:

## Basic Information
Crop: {name}
Scientific Name: {scientific_name}
Family: {family}
Growth Habit: {growth_habit}
Lifespan: {lifespan}

## Description & Uses
{description}
Common Varieties: {common_varieties}
Uses: {uses}

## Climate & Environment
Climate Hardiness: {climate_hardiness}
Frost Tolerance: {frost_tolerance}
Sunlight Hours/Day: {sunlight_hours}
Optimal Temperature: {temp_min}°C – {temp_max}°C
Germination Temperature: {germ_temp_min}°C – {germ_temp_max}°C
Growth Temperature: {growth_temp_min}°C – {growth_temp_max}°C
Fruiting Temperature: {fruiting_temp_min}°C – {fruiting_temp_max}°C
Weekly Water Need: {water_weekly_mm} mm
Drought Tolerance: {drought_tolerance}
Waterlogging Sensitivity: {waterlogging_sensitivity}

## Soil Requirements
Soil Type: {soil_type}
pH Range: {ph_min} – {ph_max}
Nitrogen (N) Requirement: {n_requirement}
Phosphorus (P) Requirement: {p_requirement}
Potassium (K) Requirement: {k_requirement}

## Planting
Plant Spacing: {spacing_plant_cm} cm
Row Spacing: {spacing_row_cm} cm
Planting Depth: {depth_cm} cm
Germination Days: {germination_days}
Days to Maturity: {days_to_maturity}
Expected Yield: {expected_yield}
Planting Method: {planting_method}
Planting Timing: {planting_timing}
Soil Preparation: {soil_preparation_steps}

## Crop Care
Irrigation: {irrigation}
Fertilization: {fertilization}
Weed Control: {weed_control}
Support & Pruning: {support_pruning}

## Pests & Diseases
Common Pests: {common_pests}
Common Diseases: {common_diseases}
Management Strategies: {management_strategies}
{pest_disease_details}

## Harvesting
Signs of Readiness: {signs_of_readiness}
Harvesting Method: {harvesting_method}
Curing: {curing}

## Post-Harvest & Storage
Storage Conditions: {storage_conditions}
Shelf Life: {shelf_life}
{post_harvest_details}

Use this information to answer the user's question accurately.
"""

_NO_GUIDE_TEMPLATE = """
The user has not specified a crop clearly. The available crops in the system are:
{crop_list}

Politely ask the user which crop they would like guidance on.
"""


def _format_pest_disease(pd_list: list) -> str:
    if not pd_list:
        return ""
    lines = ["\nDetailed Pest & Disease Records:"]
    for item in pd_list:
        lines.append(
            f"  [{item.get('itemType', 'N/A')}] {item.get('name', 'N/A')} "
            f"(Severity: {item.get('severity', 'N/A')}) — "
            f"Prevention: {item.get('prevention', 'N/A')}; "
            f"Organic Treatment: {item.get('organicTreatment', 'N/A')}; "
            f"Chemical Treatment: {item.get('chemicalTreatment', 'N/A')}; "
            f"Notes: {item.get('notes', 'N/A')}"
        )
    return "\n".join(lines)


def _format_post_harvest(ph_list: list) -> str:
    if not ph_list:
        return ""
    lines = ["\nDetailed Post-Harvest Profiles:"]
    for item in ph_list:
        lines.append(
            f"  Climate Band: {item.get('climateBand', 'N/A')} — "
            f"Curing: {item.get('curing', 'N/A')}; "
            f"Storage Temp: {item.get('storageTemperatureMin', 'N/A')}–{item.get('storageTemperatureMax', 'N/A')}°C; "
            f"Humidity: {item.get('storageHumidityMin', 'N/A')}–{item.get('storageHumidityMax', 'N/A')}%; "
            f"Shelf Life: {item.get('shelfLifeDays', 'N/A')} days; "
            f"Notes: {item.get('storageNotes', 'N/A')}"
        )
    return "\n".join(lines)


def _build_system_prompt(
    crop_guide: Optional[dict] = None,
    crop_names: Optional[list[str]] = None,
) -> str:
    if crop_guide:
        def _v(key, default="N/A"):
            val = crop_guide.get(key)
            return val if val not in (None, "") else default

        context = _GUIDE_TEMPLATE.format(
            name=_v("name"),
            scientific_name=_v("scientificName"),
            family=_v("family"),
            growth_habit=_v("growthHabit"),
            lifespan=_v("lifespan"),
            description=_v("description", "No description available."),
            common_varieties=_v("commonVarieties"),
            uses=_v("uses"),
            climate_hardiness=_v("climateHardiness"),
            frost_tolerance=_v("frostTolerance"),
            sunlight_hours=_v("sunlightHours"),
            temp_min=_v("optimalTemperatureMin"),
            temp_max=_v("optimalTemperatureMax"),
            germ_temp_min=_v("germinationTempMin"),
            germ_temp_max=_v("germinationTempMax"),
            growth_temp_min=_v("growthTempMin"),
            growth_temp_max=_v("growthTempMax"),
            fruiting_temp_min=_v("fruitingTempMin"),
            fruiting_temp_max=_v("fruitingTempMax"),
            water_weekly_mm=_v("waterWeeklyMm"),
            drought_tolerance=_v("droughtTolerance"),
            waterlogging_sensitivity=_v("waterloggingSensitivity"),
            soil_type=_v("soilType"),
            ph_min=_v("phMin"),
            ph_max=_v("phMax"),
            n_requirement=_v("nRequirement"),
            p_requirement=_v("pRequirement"),
            k_requirement=_v("kRequirement"),
            spacing_plant_cm=_v("spacingPlantCm"),
            spacing_row_cm=_v("spacingRowCm"),
            depth_cm=_v("depthCm"),
            germination_days=_v("germinationDays"),
            days_to_maturity=_v("daysToMaturity"),
            expected_yield=_v("expectedYield"),
            planting_method=_v("plantingMethod"),
            planting_timing=_v("plantingTiming"),
            soil_preparation_steps=_v("soilPreparationSteps"),
            irrigation=_v("irrigation"),
            fertilization=_v("fertilization"),
            weed_control=_v("weedControl"),
            support_pruning=_v("supportPruning"),
            common_pests=_v("commonPests"),
            common_diseases=_v("commonDiseases"),
            management_strategies=_v("managementStrategies"),
            pest_disease_details=_format_pest_disease(crop_guide.get("pestDiseases") or []),
            signs_of_readiness=_v("signsOfReadiness"),
            harvesting_method=_v("harvestingMethod"),
            curing=_v("curing"),
            storage_conditions=_v("storageConditions"),
            shelf_life=_v("shelfLife"),
            post_harvest_details=_format_post_harvest(crop_guide.get("postHarvestProfiles") or []),
        )
    elif crop_names:
        crop_list = "\n".join(f"- {name}" for name in sorted(crop_names))
        context = _NO_GUIDE_TEMPLATE.format(crop_list=crop_list)
    else:
        context = "\nNo crop guide data is currently available. Answer based on general agricultural knowledge and remind the user that detailed guides may not be loaded."

    return _BASE_SYSTEM_PROMPT + context


def _map_to_openrouter_role(role: str) -> str:
    normalized = (role or "").strip().lower()
    if normalized == "model":
        return "assistant"
    if normalized in {"assistant", "system"}:
        return normalized
    return "user"


def _map_to_gemini_role(role: str) -> str:
    normalized = (role or "").strip().lower()
    if normalized == "assistant":
        return "model"
    if normalized == "model":
        return "model"
    return "user"


def _extract_text_from_openrouter_content(content: object) -> str:
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, dict):
        for key in ("text", "content", "value"):
            value = content.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    if isinstance(content, list):
        text_parts: list[str] = []
        for part in content:
            if isinstance(part, str) and part.strip():
                text_parts.append(part.strip())
                continue

            if not isinstance(part, dict):
                continue

            for key in ("text", "content", "value"):
                value = part.get(key)
                if isinstance(value, str) and value.strip():
                    text_parts.append(value.strip())
                    break

        if text_parts:
            return " ".join(text_parts).strip()

    return ""


def _extract_openrouter_text(data: dict) -> str:
    choices = data.get("choices")
    if not isinstance(choices, list):
        return ""

    for choice in choices:
        if not isinstance(choice, dict):
            continue

        message = choice.get("message")
        if isinstance(message, dict):
            extracted = _extract_text_from_openrouter_content(message.get("content"))
            if extracted:
                return extracted

            refusal = message.get("refusal")
            if isinstance(refusal, str) and refusal.strip():
                return refusal.strip()

        text = choice.get("text")
        if isinstance(text, str) and text.strip():
            return text.strip()

    return ""


def _has_reasoning_without_content(data: dict) -> bool:
    choices = data.get("choices")
    if not isinstance(choices, list):
        return False

    for choice in choices:
        if not isinstance(choice, dict):
            continue
        message = choice.get("message")
        if not isinstance(message, dict):
            continue

        content = message.get("content")
        reasoning = message.get("reasoning")
        if content in (None, "", []) and isinstance(reasoning, str) and reasoning.strip():
            return True

    return False


async def _get_reply_openrouter(
    user_message: str,
    conversation_history: list[dict],
    system_prompt: str,
) -> str:
    if not settings.openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY is required when CHAT_PROVIDER=openrouter")

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(
        {
            "role": _map_to_openrouter_role(turn.get("role", "")),
            "content": turn.get("content", ""),
        }
        for turn in conversation_history
        if turn.get("content")
    )
    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": settings.openrouter_model,
        "messages": messages,
        "temperature": settings.chat_temperature,
        "max_tokens": settings.chat_max_output_tokens,
    }
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            _OPENROUTER_CHAT_COMPLETIONS_URL,
            headers=headers,
            json=payload,
        )
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            response_text = response.text
            should_retry_with_router = (
                response.status_code == 404
                and "No endpoints found for" in response_text
                and payload["model"] != _OPENROUTER_FREE_ROUTER_MODEL
            )
            if should_retry_with_router:
                logger.warning(
                    "OpenRouter model '%s' unavailable. Retrying with '%s'.",
                    payload["model"],
                    _OPENROUTER_FREE_ROUTER_MODEL,
                )
                payload["model"] = _OPENROUTER_FREE_ROUTER_MODEL
                response = await client.post(
                    _OPENROUTER_CHAT_COMPLETIONS_URL,
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
            else:
                logger.error("OpenRouter API error: %s - %s", exc, response_text)
                raise

        try:
            data = response.json()
        except ValueError as exc:
            raise ValueError("OpenRouter returned invalid JSON") from exc

        extracted_text = _extract_openrouter_text(data)
        if extracted_text:
            return extracted_text

        if _has_reasoning_without_content(data):
            logger.warning(
                "OpenRouter model returned reasoning without final content. "
                "Model=%s, max_tokens=%s",
                payload["model"],
                settings.chat_max_output_tokens,
            )
            if payload["model"] != _OPENROUTER_NON_THINKING_FALLBACK_MODEL:
                retry_payload = dict(payload)
                retry_payload["model"] = _OPENROUTER_NON_THINKING_FALLBACK_MODEL
                logger.warning(
                    "Retrying reasoning-only response with non-thinking model '%s'.",
                    _OPENROUTER_NON_THINKING_FALLBACK_MODEL,
                )
                retry_response = await client.post(
                    _OPENROUTER_CHAT_COMPLETIONS_URL,
                    headers=headers,
                    json=retry_payload,
                )
                try:
                    retry_response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    logger.warning(
                        "Non-thinking retry model '%s' failed: %s",
                        _OPENROUTER_NON_THINKING_FALLBACK_MODEL,
                        exc,
                    )
                    if settings.gemini_api_key:
                        logger.warning(
                            "OpenRouter retries failed. Falling back to Gemini."
                        )
                        return await _get_reply_gemini(
                            user_message=user_message,
                            conversation_history=conversation_history,
                            system_prompt=system_prompt,
                        )
                    return (
                        "I could not generate a final answer from the available free models "
                        "right now. Please try again in a moment."
                    )
                retry_data = retry_response.json()
                retry_text = _extract_openrouter_text(retry_data)
                if retry_text:
                    return retry_text

            if settings.gemini_api_key:
                logger.warning(
                    "OpenRouter returned reasoning-only response. Falling back to Gemini."
                )
                return await _get_reply_gemini(
                    user_message=user_message,
                    conversation_history=conversation_history,
                    system_prompt=system_prompt,
                )

            return (
                "I could not generate a final answer from this model right now. "
                "Please try again."
            )

        logger.error(
            "OpenRouter returned unrecognized payload shape: %s",
            json.dumps(data, ensure_ascii=False)[:1200],
        )
        raise ValueError("OpenRouter response is missing usable text content")


async def _get_reply_gemini(
    user_message: str,
    conversation_history: list[dict],
    system_prompt: str,
) -> str:
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY is required when CHAT_PROVIDER=gemini")

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=system_prompt,
        generation_config={
            "temperature": settings.chat_temperature,
            "max_output_tokens": settings.chat_max_output_tokens,
        },
    )

    history = [
        {
            "role": _map_to_gemini_role(turn.get("role", "")),
            "parts": [turn.get("content", "")],
        }
        for turn in conversation_history
        if turn.get("content")
    ]
    chat = model.start_chat(history=history)

    response = await chat.send_message_async(user_message)
    return response.text


async def get_reply(
    user_message: str,
    conversation_history: list[dict],
    crop_guide: Optional[dict] = None,
    crop_names: Optional[list[str]] = None,
) -> str:
    """
    Sends the user message to the configured provider and returns reply text.

    Args:
        user_message: The latest message from the user.
        conversation_history: List of previous turns [{role: "user"|"model", content: str}].
        crop_guide: Full crop guide dict to inject as context (mutually exclusive with crop_names).
        crop_names: List of display names to show when no specific crop detected.
    """
    system_prompt = _build_system_prompt(crop_guide=crop_guide, crop_names=crop_names)
    provider = settings.chat_provider.lower()

    try:
        if provider == "openrouter":
            return await _get_reply_openrouter(
                user_message=user_message,
                conversation_history=conversation_history,
                system_prompt=system_prompt,
            )
        if provider == "gemini":
            return await _get_reply_gemini(
                user_message=user_message,
                conversation_history=conversation_history,
                system_prompt=system_prompt,
            )
        raise ValueError(f"Unsupported CHAT_PROVIDER value: {settings.chat_provider}")
    except Exception as exc:
        logger.error("Chat provider '%s' failed: %s", provider, exc)
        raise
