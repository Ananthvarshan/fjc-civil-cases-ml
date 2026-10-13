"""
Regression router — serves model comparison metrics and live prediction
of case resolution time (RESOLUTION_DAYS) using the best saved model.
"""
from __future__ import annotations
import random
from fastapi import APIRouter, HTTPException
from backend.core import registry
from backend.core.schemas import (
    RegressionModelDetail,
    RegressionListResponse,
    RegressionPredictRequest,
    RegressionPredictResponse,
)

router = APIRouter(prefix="/api/regression", tags=["regression"])

# Display order for the comparison table
_ORDER = [
    "random_forest_tuned",
    "random_forest",
    "polynomial",
    "decision_tree",
    "gradient_boosting",
    "knn",
    "ridge_tuned",
    "lasso_tuned",
    "ridge",
    "lasso",
    "linear_regression",
    "svr",
]


@router.get("", response_model=RegressionListResponse)
async def list_regression_models() -> RegressionListResponse:
    """Return metrics for all regression models, sorted best → worst by R²."""
    raw = registry.REGRESSION
    models = []
    seen = set()
    # First pass: respect preferred order
    for mid in _ORDER:
        if mid in raw:
            m = raw[mid]
            models.append(_to_detail(mid, m))
            seen.add(mid)
    # Second pass: any remaining models not in the order list
    for mid, m in raw.items():
        if mid not in seen:
            models.append(_to_detail(mid, m))
    return RegressionListResponse(models=models)


@router.get("/{model_id}", response_model=RegressionModelDetail)
async def get_regression_model(model_id: str) -> RegressionModelDetail:
    """Return metrics for a single regression model."""
    raw = registry.REGRESSION
    if model_id not in raw:
        raise HTTPException(status_code=404, detail=f"Regression model '{model_id}' not found")
    return _to_detail(model_id, raw[model_id])


@router.post("/predict", response_model=RegressionPredictResponse)
async def regression_predict(body: RegressionPredictRequest) -> RegressionPredictResponse:
    """
    Predict case resolution time in days given input features.
    Uses the best saved regression model (Random Forest Tuned).
    Falls back to a mock if the model artifact is not yet generated.
    """
    best_model = registry.REGRESSION_MODEL.get("best")

    # Find the best model name from registry
    best_name = "random_forest_tuned"
    for mid, m in registry.REGRESSION.items():
        if m.get("is_best"):
            best_name = mid
            break

    if best_model is None:
        # Mock prediction — average case takes ~383 days based on notebook stats
        import math
        seed = sum(hash(str(v)) for v in body.features.values()) % 2**31
        random.seed(seed)
        days = round(random.gauss(383, 120), 1)
        days = max(1.0, days)
        return RegressionPredictResponse(
            predicted_days=days,
            predicted_years=round(days / 365.25, 2),
            model_used=best_name,
            is_mock=True,
        )

    # Real prediction — features are PCA components (PC1, PC2, ...)
    import numpy as np
    feature_order = [f["name"] for f in registry.DATASET.get("features", [])]
    row = [[float(body.features.get(n, 0)) for n in feature_order]]

    # Handle Polynomial model stored as dict
    if isinstance(best_model, dict):
        poly = best_model.get("poly")
        model = best_model.get("model")
        import numpy as np
        X = np.array(row)
        if poly:
            X = poly.transform(X)
        days = float(model.predict(X)[0])
    else:
        days = float(best_model.predict(row)[0])

    days = max(0.0, round(days, 1))
    return RegressionPredictResponse(
        predicted_days=days,
        predicted_years=round(days / 365.25, 2),
        model_used=best_name,
        is_mock=False,
    )


# ── Helper ─────────────────────────────────────────────────────────────────────

def _to_detail(mid: str, m: dict) -> RegressionModelDetail:
    return RegressionModelDetail(
        id=mid,
        display_name=m.get("display_name", mid),
        r2=m.get("r2", 0.0),
        rmse=m.get("rmse", 0.0),
        mae=m.get("mae", 0.0),
        fit_time_s=m.get("fit_time_s", 0.0),
        is_best=m.get("is_best", False),
        feature_importances=m.get("feature_importances"),
    )
