"""
Artifact loader — reads JSON and joblib files from ARTIFACT_DIR into the
in-memory registry at application startup.

If a file is missing (e.g. before `make artifacts` has been run), a warning
is printed and a sensible empty/mock value is used so the server still starts.
"""
from __future__ import annotations
import json
import logging
from pathlib import Path
from typing import Any

from backend.config import ARTIFACT_DIR
from backend.core import registry

log = logging.getLogger(__name__)


def _load_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        log.warning("Artifact not found, using default: %s", path)
        return default if default is not None else {}
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _load_joblib(path: Path) -> Any | None:
    if not path.exists():
        log.warning("Model joblib not found: %s", path)
        return None
    try:
        import joblib  # noqa: PLC0415
        return joblib.load(path)
    except Exception as exc:  # pragma: no cover
        log.error("Failed to load %s: %s", path, exc)
        return None


MODEL_IDS = ["random_forest", "adaboost", "gradient_boosting", "bagging", "mlp"]
CLUSTER_IDS = ["kmeans", "agglo"]


def load_all() -> None:
    """Called once during FastAPI lifespan startup."""
    log.info("Loading artifacts from %s", ARTIFACT_DIR)

    # ── Dataset schema ──────────────────────────────────────────────────────
    registry.DATASET.update(
        _load_json(ARTIFACT_DIR / "dataset.json", default=_mock_dataset())
    )

    # ── Metrics ─────────────────────────────────────────────────────────────
    registry.METRICS.update(
        _load_json(ARTIFACT_DIR / "metrics.json", default=_mock_metrics())
    )

    # ── Per-model pipelines + traces ────────────────────────────────────────
    models_dir = ARTIFACT_DIR / "models"
    traces_dir = ARTIFACT_DIR / "traces"
    for mid in MODEL_IDS:
        pipeline = _load_joblib(models_dir / f"{mid}.joblib")
        if pipeline is not None:
            registry.MODELS[mid] = pipeline
        registry.TRACES[mid] = _load_json(
            traces_dir / f"{mid}.json", default={}
        )

    # ── Cluster data ────────────────────────────────────────────────────────
    clusters_dir = ARTIFACT_DIR / "clusters"
    for cid in CLUSTER_IDS:
        registry.CLUSTERS[cid] = _load_json(
            clusters_dir / f"{cid}.json", default={}
        )

    log.info(
        "Registry loaded — models: %d, metrics: %d, clusters: %d",
        len(registry.MODELS),
        len(registry.METRICS),
        len(registry.CLUSTERS),
    )


# ── Mock data (used when artifacts haven't been generated yet) ──────────────

def _mock_dataset() -> dict:
    import random, math
    random.seed(42)
    features = [
        {"name": "CIRCUIT", "type": "categorical", "categories": list(range(1, 12)), "description": "Circuit court number"},
        {"name": "DISTRICT", "type": "categorical", "categories": list(range(1, 95)), "description": "District code"},
        {"name": "OFFICE", "type": "categorical", "categories": list(range(1, 10)), "description": "Office code"},
        {"name": "ORIGIN", "type": "categorical", "categories": [1,2,3,4,5,6], "description": "Case origin"},
        {"name": "NOS", "type": "numerical", "min": 1, "max": 890, "description": "Nature of suit"},
        {"name": "JURY", "type": "categorical", "categories": [0, 1], "description": "Jury demand"},
        {"name": "CLASSACT", "type": "categorical", "categories": [0, 1], "description": "Class action"},
        {"name": "PROSE", "type": "categorical", "categories": [0, 1], "description": "Pro se litigant"},
        {"name": "TAPEYEAR", "type": "numerical", "min": 1988, "max": 2023, "description": "Year filed"},
    ]
    class_names = ["Transfer", "Remand", "Voluntary Dismissal", "Judgment", "Other"]
    # Generate 300 mock PCA-3D points
    pca_points = []
    for i in range(300):
        label = i % len(class_names)
        angle = label * (2 * math.pi / len(class_names)) + random.gauss(0, 0.4)
        r = random.gauss(2.5, 0.8)
        pca_points.append({
            "x": r * math.cos(angle),
            "y": random.gauss(0, 0.8),
            "z": r * math.sin(angle),
            "label": label,
        })
    return {
        "name": "FJC Civil Cases (IDB)",
        "description": "U.S. Federal court civil litigation records from the Federal Judicial Center Integrated Database.",
        "n_samples": 487_842,
        "n_features": len(features),
        "class_names": class_names,
        "task": "classification",
        "features": features,
        "presets": [
            {"label": "Quick Settlement", "values": {"CIRCUIT": 9, "DISTRICT": 50, "OFFICE": 1, "ORIGIN": 1, "NOS": 120, "JURY": 0, "CLASSACT": 0, "PROSE": 0, "TAPEYEAR": 2019}},
            {"label": "Jury Trial", "values": {"CIRCUIT": 5, "DISTRICT": 22, "OFFICE": 2, "ORIGIN": 2, "NOS": 440, "JURY": 1, "CLASSACT": 0, "PROSE": 0, "TAPEYEAR": 2021}},
        ],
        "pca_points": pca_points,
    }


def _mock_metrics() -> dict:
    base = {
        "random_forest":      {"accuracy": 0.847, "precision": 0.831, "recall": 0.847, "f1": 0.836, "roc_auc": 0.943, "train_time_s": 12.4},
        "adaboost":           {"accuracy": 0.791, "precision": 0.778, "recall": 0.791, "f1": 0.782, "roc_auc": 0.901, "train_time_s": 6.1},
        "gradient_boosting":  {"accuracy": 0.863, "precision": 0.852, "recall": 0.863, "f1": 0.855, "roc_auc": 0.951, "train_time_s": 38.7},
        "bagging":            {"accuracy": 0.832, "precision": 0.819, "recall": 0.832, "f1": 0.824, "roc_auc": 0.931, "train_time_s": 9.8},
        "mlp":                {"accuracy": 0.821, "precision": 0.809, "recall": 0.821, "f1": 0.813, "roc_auc": 0.921, "train_time_s": 45.2},
    }
    # Add mock confusion matrices and ROC curves
    import math, random; random.seed(99)
    for mid, m in base.items():
        n_classes = 5
        cm = [[random.randint(10, 300) if i == j else random.randint(0, 40) for j in range(n_classes)] for i in range(n_classes)]
        roc = [{"fpr": 0, "tpr": 0}]
        for t in range(1, 20):
            fpr = t / 20
            tpr = min(1.0, fpr + m["roc_auc"] * 0.4 + random.gauss(0, 0.03))
            roc.append({"fpr": round(fpr, 3), "tpr": round(tpr, 3)})
        roc.append({"fpr": 1, "tpr": 1})
        m["confusion_matrix"] = cm
        m["roc_points"] = roc
    return base
