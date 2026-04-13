"""
Wraps the Google Generative AI SDK for Gemini Flash chat.

The system prompt is built dynamically:
  - If a specific crop guide is provided, it is injected in full (all fields).
  - Otherwise, only the list of known crop names is injected and Gemini
    is instructed to ask the user to clarify which crop they mean.
"""

import logging
from typing import Optional

import google.generativeai as genai

from src.config import settings

logger = logging.getLogger(__name__)

MODEL_NAME = "gemini-2.5-flash-lite"

# Configure once at module load
genai.configure(api_key=settings.gemini_api_key)

_BASE_SYSTEM_PROMPT = """You are an agricultural assistant built by Solara. \
Your main priority is to use the provided crop guides to assist farmers with questions about crop cultivation. \
You must ONLY answer questions related to agriculture and the provided crop guides. If a user asks about an unrelated topic, politely decline to answer and steer the conversation back to agriculture. \
Be concise, practical, and friendly. \
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
