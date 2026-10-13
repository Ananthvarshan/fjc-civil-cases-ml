"""
Preprocessing router — exposes dataset statistics, class distributions,
PCA info, and train/test split sizes collected during preprocessing.ipynb.
"""
from __future__ import annotations
from fastapi import APIRouter
from backend.core import registry

router = APIRouter(prefix="/api/preprocessing", tags=["preprocessing"])


@router.get("")
async def get_preprocessing_stats() -> dict:
    """
    Return all dataset-level stats from preprocessing.ipynb.
    Sourced from artifacts/dataset.json (written by export_artifacts.py).
    """
    ds = registry.DATASET
    return {
        "dataset_name":       ds.get("name", "FJC Civil Cases (IDB)"),
        "description":        ds.get("description", ""),
        "n_samples":          ds.get("n_samples", 0),
        "n_train":            ds.get("n_train", 0),
        "n_test":             ds.get("n_test", 0),
        "n_features_raw":     ds.get("n_features", 0),
        "n_pca_components":   ds.get("n_pca_components", 37),
        "variance_retained":  ds.get("variance_retained", 0.95),
        "class_names":        ds.get("class_names", []),
        "class_distribution": ds.get("class_distribution", {}),
        "outlier_cap_days":   ds.get("outlier_cap_days", 2158),
        "engineered_features":ds.get("engineered_features", {}),
        "features":           ds.get("features", []),
        # PCA points are large — served via /api/meta instead
    }
