from __future__ import annotations

from fastapi import FastAPI

from fastapi import APIRouter
from src.routers.recommend import router as recommend_router
from src.services import model_store


app = FastAPI(title="Crop Recommendation API")

api_router = APIRouter(prefix="/api/v1")

@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


@app.on_event("startup")
def startup_event() -> None:
    model_store.load_model()


api_router.include_router(recommend_router)
app.include_router(api_router)
