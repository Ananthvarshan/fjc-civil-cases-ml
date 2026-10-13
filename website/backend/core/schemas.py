"""
Pydantic schemas — the data contract between backend and frontend.
TypeScript types in src/api/types.ts must mirror these exactly.
"""
from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field


# ── Shared ──────────────────────────────────────────────────────────────────

class FeatureSchema(BaseModel):
    name: str
    type: Literal["numerical", "categorical"]
    description: str
    min: float | None = None
    max: float | None = None
    categories: list[int | str] | None = None


class PcaPoint(BaseModel):
    x: float
    y: float
    z: float
    label: int


# ── /api/meta ───────────────────────────────────────────────────────────────

class MetaResponse(BaseModel):
    name: str
    description: str
    n_samples: int
    n_features: int
    class_names: list[str]
    task: str
    features: list[FeatureSchema]
    presets: list[dict[str, Any]]
    pca_points: list[PcaPoint]
    model_ids: list[str]


# ── /api/models ──────────────────────────────────────────────────────────────

class ModelMeta(BaseModel):
    id: str
    name: str
    short_description: str
    accent_color: str


class ModelListResponse(BaseModel):
    models: list[ModelMeta]


class MetricDetail(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float
    train_time_s: float
    confusion_matrix: list[list[int]]
    roc_points: list[dict[str, float]]


class ModelDetailResponse(BaseModel):
    id: str
    name: str
    short_description: str
    accent_color: str
    metrics: MetricDetail
    trace: dict[str, Any]


# ── /api/predict ─────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    features: dict[str, float | int | str] = Field(
        ..., description="Feature name → value mapping"
    )


class PredictResponse(BaseModel):
    model: str
    label: str
    label_index: int
    probabilities: dict[str, float]
    trace: dict[str, Any]  # model-specific reasoning trace


class PredictAllResponse(BaseModel):
    results: dict[str, PredictResponse]


# ── /api/compare ─────────────────────────────────────────────────────────────

class CompareResponse(BaseModel):
    metrics: dict[str, MetricDetail]
    roc_curves: dict[str, list[dict[str, float]]]


# ── /api/cluster ─────────────────────────────────────────────────────────────

class ClusterPoint(BaseModel):
    x: float
    y: float
    z: float
    label: int


class ClusterResponse(BaseModel):
    type: Literal["kmeans", "agglo"]
    k: int
    points: list[ClusterPoint]
    metrics: dict[str, float]   # silhouette, davies_bouldin, calinski_harabasz
    extra: dict[str, Any]       # elbow data, centroid trajectory, linkage matrix…


# ── /api/regression ───────────────────────────────────────────────────────────

class RegressionModelDetail(BaseModel):
    id: str
    display_name: str
    r2: float
    rmse: float
    mae: float
    fit_time_s: float
    is_best: bool = False
    feature_importances: list[dict[str, Any]] | None = None


class RegressionListResponse(BaseModel):
    models: list[RegressionModelDetail]


# ── /api/regression/predict ───────────────────────────────────────────────────

class RegressionPredictRequest(BaseModel):
    features: dict[str, float | int | str] = Field(
        ..., description="Feature name → value mapping (same features as classification)"
    )


class RegressionPredictResponse(BaseModel):
    predicted_days: float
    predicted_years: float
    model_used: str
    is_mock: bool = False


# ── /api/plots ────────────────────────────────────────────────────────────────

class PlotListResponse(BaseModel):
    plots: list[str]   # list of available plot filenames

