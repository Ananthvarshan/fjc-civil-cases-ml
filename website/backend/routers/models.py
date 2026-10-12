from fastapi import APIRouter, HTTPException
from backend.core import registry
from backend.core.schemas import ModelDetailResponse, MetricDetail
from backend.routers.meta import MODEL_CATALOG

router = APIRouter(prefix="/api/models", tags=["models"])

_CATALOG_MAP = {m.id: m for m in MODEL_CATALOG}


@router.get("/{model_id}", response_model=ModelDetailResponse)
async def get_model(model_id: str) -> ModelDetailResponse:
    if model_id not in _CATALOG_MAP:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")
    meta = _CATALOG_MAP[model_id]
    raw_metrics = registry.METRICS.get(model_id, {})
    metrics = MetricDetail(
        accuracy=raw_metrics.get("accuracy", 0),
        precision=raw_metrics.get("precision", 0),
        recall=raw_metrics.get("recall", 0),
        f1=raw_metrics.get("f1", 0),
        roc_auc=raw_metrics.get("roc_auc", 0),
        train_time_s=raw_metrics.get("train_time_s", 0),
        confusion_matrix=raw_metrics.get("confusion_matrix", []),
        roc_points=raw_metrics.get("roc_points", []),
    )
    return ModelDetailResponse(
        id=meta.id,
        name=meta.name,
        short_description=meta.short_description,
        accent_color=meta.accent_color,
        metrics=metrics,
        trace=registry.TRACES.get(model_id, {}),
    )
