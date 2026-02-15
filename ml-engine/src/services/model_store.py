from __future__ import annotations

from pathlib import Path
from typing import Optional
import pickle

import numpy as np


MODEL_PATH = Path(__file__).resolve().parents[2] / "models" / "crop_recommendation.pkl"

_model = None
_scaler = None
_label_encoder = None
_feature_names: Optional[list[str]] = None


def load_model() -> None:
    global _model, _scaler, _label_encoder, _feature_names

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

    with MODEL_PATH.open("rb") as handle:
        package = pickle.load(handle)

    _model = package["model"]
    _scaler = package["scaler"]
    _label_encoder = package["label_encoder"]
    _feature_names = package.get("feature_names")

    if not _feature_names:
        _feature_names = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]


def recommend(payload: dict, top_n: int) -> list[tuple[str, float]]:
    if _model is None or _scaler is None or _label_encoder is None:
        raise RuntimeError("Model is not loaded")

    missing = [name for name in _feature_names or [] if name not in payload]
    if missing:
        raise ValueError(f"Missing features: {missing}")

    features = np.array([[payload[name] for name in _feature_names]], dtype=float)
    scaled = _scaler.transform(features)
    probabilities = _model.predict(scaled)[0]

    top_n = min(top_n, len(probabilities))
    top_indices = np.argsort(probabilities)[::-1][:top_n]

    return [
        (
            _label_encoder.classes_[idx],
            float(probabilities[idx] * 100),
        )
        for idx in top_indices
    ]
