"""
Per-model reasoning trace builders.
Each function receives the fitted pipeline, the input row, the predicted label
index, and the probability array, and returns a JSON-serialisable dict that
the frontend uses to drive animations.

These are best-effort: if the model doesn't expose the needed internals,
return an empty dict and the frontend will skip the reasoning panel.
"""
from __future__ import annotations
from typing import Any
import numpy as np


def rf_trace(pipeline: Any, row: np.ndarray, label_idx: int, probas: np.ndarray) -> dict:
    """Random Forest: per-tree vote breakdown."""
    try:
        clf = pipeline.named_steps.get("clf") or pipeline  # handle bare model or Pipeline
        if hasattr(clf, "estimators_"):
            votes = [int(t.predict(row)[0]) for t in clf.estimators_[:25]]  # first 25 trees
            return {"votes": votes, "n_estimators": clf.n_estimators, "shown": 25}
    except Exception:
        pass
    return {}


def adaboost_trace(pipeline: Any, row: np.ndarray, label_idx: int, probas: np.ndarray) -> dict:
    """AdaBoost: staged confidence build-up."""
    try:
        clf = pipeline.named_steps.get("clf") or pipeline
        staged = list(clf.staged_predict_proba(row))
        stage_confidences = [
            {str(i): round(float(p), 4) for i, p in enumerate(s[0])}
            for s in staged[::max(1, len(staged) // 20)]  # sample ~20 stages
        ]
        return {"stage_confidences": stage_confidences, "n_estimators": clf.n_estimators}
    except Exception:
        return {}


def gb_trace(pipeline: Any, row: np.ndarray, label_idx: int, probas: np.ndarray) -> dict:
    """Gradient Boosting: residual shrink per stage."""
    try:
        clf = pipeline.named_steps.get("clf") or pipeline
        staged = list(clf.staged_predict_proba(row))
        # Sample evenly
        step = max(1, len(staged) // 20)
        sampled = staged[::step]
        return {
            "stage_probas": [[round(float(p), 4) for p in s[0]] for s in sampled],
            "n_estimators": clf.n_estimators,
        }
    except Exception:
        return {}


def bagging_trace(pipeline: Any, row: np.ndarray, label_idx: int, probas: np.ndarray) -> dict:
    """Bagging: per-estimator prediction."""
    try:
        clf = pipeline.named_steps.get("clf") or pipeline
        preds = [int(e.predict(row)[0]) for e in clf.estimators_[:10]]
        return {"estimator_predictions": preds, "n_estimators": clf.n_estimators}
    except Exception:
        return {}


def mlp_trace(pipeline: Any, row: np.ndarray, label_idx: int, probas: np.ndarray) -> dict:
    """MLP: per-layer activations (forward pass)."""
    try:
        clf = pipeline.named_steps.get("clf") or pipeline
        # Run manual forward pass to collect activations
        import numpy as _np
        from sklearn.neural_network._base import ACTIVATIONS  # noqa: PLC0415

        X = row.copy()
        # Apply preprocessing in pipeline if present
        if hasattr(pipeline, "named_steps") and "preprocessor" in pipeline.named_steps:
            X = pipeline.named_steps["preprocessor"].transform(X)

        activations_list = []
        hidden = X
        for i, (W, b) in enumerate(zip(clf.coefs_, clf.intercepts_)):
            hidden = hidden @ W + b
            if i < len(clf.coefs_) - 1:
                fn = ACTIVATIONS[clf.activation]
                fn(hidden)
            else:
                ACTIVATIONS["softmax"](hidden)
            activations_list.append(hidden[0].tolist())

        return {
            "layer_sizes": [X.shape[1]] + list(clf.hidden_layer_sizes) + [len(probas)],
            "activations": [[round(a, 4) for a in layer] for layer in activations_list],
        }
    except Exception:
        return {}
