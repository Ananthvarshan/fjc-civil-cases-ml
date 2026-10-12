from fastapi import APIRouter
from backend.core import registry
from backend.core.schemas import MetaResponse, ModelMeta, ModelListResponse

router = APIRouter(prefix="/api", tags=["meta"])

MODEL_CATALOG: list[ModelMeta] = [
    ModelMeta(id="random_forest",     name="Random Forest",       short_description="An ensemble of decision trees that vote on the outcome.", accent_color="#10b981"),
    ModelMeta(id="adaboost",          name="AdaBoost",            short_description="Boosts weak stumps by focusing on hard examples.", accent_color="#f59e0b"),
    ModelMeta(id="gradient_boosting", name="Gradient Boosting",   short_description="Corrects residual errors stage by stage.", accent_color="#8b5cf6"),
    ModelMeta(id="bagging",           name="Bagging",             short_description="Trains independent models on random data subsets.", accent_color="#38bdf8"),
    ModelMeta(id="mlp",               name="Neural Network (MLP)",short_description="A multi-layer perceptron that learns layered representations.", accent_color="#f43f5e"),
]


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "models_loaded": len(registry.MODELS)}


@router.get("/meta", response_model=MetaResponse)
async def meta() -> MetaResponse:
    data = dict(registry.DATASET)
    data["model_ids"] = [m.id for m in MODEL_CATALOG]
    return MetaResponse(**data)


@router.get("/models", response_model=ModelListResponse)
async def list_models() -> ModelListResponse:
    return ModelListResponse(models=MODEL_CATALOG)
