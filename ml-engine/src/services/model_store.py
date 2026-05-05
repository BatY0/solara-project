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


def _get_contribution_blocks(contributions: np.ndarray, class_count: int, feature_count: int) -> np.ndarray:
    """Normalize LightGBM contribution output to shape (class_count, feature_count + 1)."""
    if contributions.ndim == 2:
        if contributions.shape[1] == (feature_count + 1) * class_count:
            return contributions.reshape(class_count, feature_count + 1)
        if class_count == 1 and contributions.shape[1] == feature_count + 1:
            return contributions.reshape(1, feature_count + 1)
    if contributions.ndim == 3:
        if contributions.shape[0] == 1 and contributions.shape[2] == feature_count + 1:
            return contributions[0]
    raise RuntimeError("Unexpected pred_contrib shape from model output")


def recommend_with_explanations(payload: dict, top_n: int, top_features: int = 3) -> list[dict]:
    if _model is None or _scaler is None or _label_encoder is None:
        raise RuntimeError("Model is not loaded")

    missing = [name for name in _feature_names or [] if name not in payload]
    if missing:
        raise ValueError(f"Missing features: {missing}")

    features = np.array([[payload[name] for name in _feature_names]], dtype=float)
    scaled = _scaler.transform(features)
    probabilities = _model.predict(scaled)[0]

    class_count = len(probabilities)
    feature_count = len(_feature_names or [])
    top_n = min(top_n, class_count)
    top_indices = np.argsort(probabilities)[::-1][:top_n]

    pred_contrib = np.asarray(_model.predict(scaled, pred_contrib=True))
    contribution_blocks = _get_contribution_blocks(pred_contrib, class_count, feature_count)

    recommendations: list[dict] = []
    for idx in top_indices:
        row = contribution_blocks[idx]
        feature_rows = []
        for feature_idx, feature_name in enumerate(_feature_names or []):
            score = float(row[feature_idx])
            if score <= 0:
                continue
            feature_rows.append(
                {
                    "feature": feature_name,
                    "score": score,
                    "raw_value": float(payload[feature_name]),
                }
            )

        feature_rows.sort(key=lambda item: item["score"], reverse=True)

        recommendations.append(
            {
                "crop": str(_label_encoder.classes_[idx]),
                "probability": float(probabilities[idx] * 100),
                "contributions": feature_rows[:top_features],
            }
        )

    return recommendations
