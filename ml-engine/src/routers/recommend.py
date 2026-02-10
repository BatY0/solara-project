from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.services import model_store


router = APIRouter()


class CropRecommendationRequest(BaseModel):
    N: float = Field(..., description="Nitrogen content (kg/ha)")
    P: float = Field(..., description="Phosphorus content (kg/ha)")
    K: float = Field(..., description="Potassium content (kg/ha)")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Relative humidity in percent")
    ph: float = Field(..., description="Soil pH value")
    rainfall: float = Field(..., description="Rainfall in mm")
    top_n: Optional[int] = Field(5, ge=1, description="Number of top crops to return")


class CropRecommendation(BaseModel):
    crop: str
    probability: float


class CropRecommendationResponse(BaseModel):
    recommendations: list[CropRecommendation]


def _model_to_dict(model: BaseModel) -> dict:
    if hasattr(model, "model_dump"):
        return model.model_dump()
    return model.dict()


@router.post("/recommend", response_model=CropRecommendationResponse)
def recommend_crops(request: CropRecommendationRequest) -> CropRecommendationResponse:
    payload = _model_to_dict(request)
    top_n = payload.pop("top_n", None)
    if top_n is None:
        top_n = 5

    try:
        results = model_store.recommend(payload, top_n)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    recommendations = [
        CropRecommendation(crop=crop, probability=probability)
        for crop, probability in results
    ]

    return CropRecommendationResponse(recommendations=recommendations)
