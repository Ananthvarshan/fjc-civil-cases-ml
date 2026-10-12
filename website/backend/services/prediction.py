"""
Prediction service — applies the fitted preprocessing pipeline, runs the
requested sklearn model, and builds a model-specific reasoning trace.

When the model is not loaded (artifacts not yet generated), it falls back
to a mock prediction so the frontend can be developed independently.
"""
from __future__ import annotations
import random
from typing import Any

import numpy as np

from backend.core import registry
from backend.core.schemas import PredictResponse

CLASS_NAMES = None  # populated lazily from registry.DATASET


def _get_class_names() -> list[str]:
    global CLASS_NAMES
    if CLASS_NAMES is None:
        CLASS_NAMES = registry.DATASET.get(
            "class_names",
            ["Transfer", "Remand", "Voluntary Dismissal", "Judgment", "Other"],
        )
    return CLASS_NAMES


def run_predict(model_id: str, features: dict[str, Any]) -> PredictResponse:
    class_names = _get_class_names()
    pipeline = registry.MODELS.get(model_id)

    if pipeline is None:
        return _mock_predict(model_id, features, class_names)

    # ── Real prediction ──────────────────────────────────────────────────
    # Build feature array in the order the pipeline expects
    feature_order = [f["name"] for f in registry.DATASET.get("features", [])]
    row = np.array([[features.get(n, 0) for n in feature_order]])
    probas = pipeline.predict_proba(row)[0]
    label_idx = int(np.argmax(probas))
    proba_map = {cn: round(float(p), 4) for cn, p in zip(class_names, probas)}

    # ── Build reasoning trace ─────────────────────────────────────────────
    trace = _build_trace(model_id, pipeline, row, label_idx, probas)

    return PredictResponse(
        model=model_id,
        label=class_names[label_idx],
        label_index=label_idx,
        probabilities=proba_map,
        trace=trace,
    )


def _build_trace(model_id: str, pipeline: Any, row: np.ndarray, label_idx: int, probas: np.ndarray) -> dict:
    """Delegate to per-model trace builder in services/traces.py."""
    from backend.services import traces as T  # noqa: PLC0415
    builders = {
        "random_forest":     T.rf_trace,
        "adaboost":          T.adaboost_trace,
        "gradient_boosting": T.gb_trace,
        "bagging":           T.bagging_trace,
        "mlp":               T.mlp_trace,
    }
    builder = builders.get(model_id)
    if builder is None:
        return {}
    try:
        return builder(pipeline, row, label_idx, probas)
    except Exception:
        return {}


def _mock_predict(model_id: str, features: dict, class_names: list[str]) -> PredictResponse:
    random.seed(sum(hash(str(v)) for v in features.values()) % 2**31)
    raw = [random.random() for _ in class_names]
    total = sum(raw)
    probas = [r / total for r in raw]
    label_idx = probas.index(max(probas))
    proba_map = {cn: round(p, 4) for cn, p in zip(class_names, probas)}
    return PredictResponse(
        model=model_id,
        label=class_names[label_idx],
        label_index=label_idx,
        probabilities=proba_map,
        trace={"mock": True, "note": "Model artifacts not yet generated. Run make artifacts."},
    )
