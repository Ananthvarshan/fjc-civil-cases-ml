from fastapi import APIRouter
from backend.core import registry
from backend.core.schemas import CompareResponse, MetricDetail
from backend.routers.meta import MODEL_CATALOG

router = APIRouter(prefix="/api", tags=["compare"])
_MODEL_IDS = [m.id for m in MODEL_CATALOG]


@router.get("/compare", response_model=CompareResponse)
async def compare() -> CompareResponse:
    metrics: dict = {}
    roc_curves: dict = {}
    for mid in _MODEL_IDS:
        raw = registry.METRICS.get(mid, {})
        metrics[mid] = MetricDetail(
            accuracy=raw.get("accuracy", 0),
            precision=raw.get("precision", 0),
            recall=raw.get("recall", 0),
            f1=raw.get("f1", 0),
            roc_auc=raw.get("roc_auc", 0),
            train_time_s=raw.get("train_time_s", 0),
            confusion_matrix=raw.get("confusion_matrix", []),
            roc_points=raw.get("roc_points", []),
        )
        roc_curves[mid] = raw.get("roc_points", [])
    return CompareResponse(metrics=metrics, roc_curves=roc_curves)
