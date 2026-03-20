from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers.chat import router as chat_router

app = FastAPI(
    title="Solara Crop Chatbot",
    description="AI chatbot that answers crop-related questions using Gemini Flash.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this when wiring into the frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


app.include_router(chat_router, prefix="/api/v1")
