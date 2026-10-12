from fastapi import APIRouter, HTTPException
from backend.core import registry
from backend.core.schemas import PredictRequest, PredictResponse, PredictAllResponse
from backend.services.prediction import run_predict
from backend.routers.meta import MODEL_CATALOG

router = APIRouter(prefix="/api/predict", tags=["predict"])
_MODEL_IDS = {m.id for m in MODEL_CATALOG}


@router.post("/all", response_model=PredictAllResponse)
async def predict_all(body: PredictRequest) -> PredictAllResponse:
    results = {}
    for mid in _MODEL_IDS:
        results[mid] = run_predict(mid, body.features)
    return PredictAllResponse(results=results)


@router.post("/{model_id}", response_model=PredictResponse)
async def predict_one(model_id: str, body: PredictRequest) -> PredictResponse:
    if model_id not in _MODEL_IDS:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")
    return run_predict(model_id, body.features)

