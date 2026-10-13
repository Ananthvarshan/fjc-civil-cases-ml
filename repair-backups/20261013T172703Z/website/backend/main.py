"""FastAPI server for the FJC civil-cases ML dashboard."""

from pathlib import Path
import json

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS = ROOT / "website" / "backend" / "artifacts"
PLOTS = ARTIFACTS / "plots"
FRONTEND = ROOT / "website" / "frontend"
STATIC = FRONTEND / "static"

app = FastAPI(title="FJC Civil Cases ML API", version="1.0.0")

if PLOTS.exists():
    app.mount("/plots", StaticFiles(directory=PLOTS), name="plots")
if STATIC.exists():
    app.mount("/static", StaticFiles(directory=STATIC), name="static")


def is_lfs_pointer(path: Path) -> bool:
    try:
        return path.read_text(encoding="utf-8", errors="ignore").startswith(
            "version https://git-lfs.github.com/spec/v1"
        )
    except OSError:
        return False


def load_json(path: Path):
    if not path.exists() or is_lfs_pointer(path):
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def plot_url(filename: str):
    path = PLOTS / filename
    return f"/plots/{filename}" if path.exists() and not is_lfs_pointer(path) else None


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(FRONTEND / "index.html")


@app.get("/api/health")
def health():
    return {"status": "ok", "artifacts_directory": str(ARTIFACTS)}


@app.get("/api/overview")
def overview():
    dataset = load_json(ARTIFACTS / "dataset.json") or {}
    classification = load_json(ARTIFACTS / "metrics.json") or {}
    regression = load_json(ARTIFACTS / "regression_metrics.json") or {}
    kmeans = load_json(ARTIFACTS / "clusters" / "kmeans.json") or {}
    return {
        "dataset": dataset,
        "counts": {
            "classifiers": len(classification),
            "regressors": len(regression),
            "kmeans_configurations": len(kmeans.get("metrics_by_k", {})),
        },
        "plots": {
            "class_distribution": plot_url("preprocessing_class_dist.png"),
            "pca": plot_url("preprocessing_pca_2d.png"),
            "pca_scree": plot_url("preprocessing_pca_scree.png"),
        },
    }


@app.get("/api/classification")
def classification():
    metrics = load_json(ARTIFACTS / "metrics.json")
    if not metrics:
        return {"available": False, "models": [], "best": None, "plots": {}}
    models = [{"id": model_id, **values} for model_id, values in metrics.items()]
    models = [m for m in models if m.get("f1") is not None]
    best = max(models, key=lambda m: (m.get("f1", 0), m.get("accuracy", 0), m.get("roc_auc", 0)))
    best_id = best["id"]
    return {
        "available": True,
        "models": models,
        "best": best,
        "plots": {
            "comparison": plot_url("clf_comparison_bar.png"),
            "tuning": plot_url("clf_tuning_before_after.png"),
            "confusion": plot_url(f"clf_{best_id}_confusion.png"),
            "roc": plot_url(f"clf_{best_id}_roc.png"),
        },
    }


@app.get("/api/regression")
def regression():
    metrics = load_json(ARTIFACTS / "regression_metrics.json")
    if not metrics:
        return {"available": False, "models": [], "best": None, "plots": {}}
    models = [{"id": model_id, **values} for model_id, values in metrics.items()]
    models = [m for m in models if m.get("r2") is not None]
    best = max(models, key=lambda m: (m.get("r2", float("-inf")), -m.get("rmse", float("inf"))))
    return {
        "available": True,
        "models": models,
        "best": best,
        "plots": {
            "comparison": plot_url("reg_comparison_bar.png"),
            "diagnostics": plot_url("reg_pred_vs_actual.png"),
        },
    }


@app.get("/api/clustering")
def clustering():
    sources = [
        ("K-Means", load_json(ARTIFACTS / "clusters" / "kmeans.json")),
        ("Agglomerative", load_json(ARTIFACTS / "clusters" / "agglo.json")),
    ]
    models = []
    for algorithm, data in sources:
        if not data:
            continue
        for k, values in data.get("metrics_by_k", {}).items():
            models.append({"algorithm": algorithm, "k": int(k), **values})
    if not models:
        return {"available": False, "models": [], "best": None, "plots": {}}
    best = max(models, key=lambda m: (m.get("silhouette", 0), -m.get("davies_bouldin", float("inf"))))
    return {
        "available": True,
        "models": models,
        "best": best,
        "plots": {
            "elbow": plot_url("cluster_elbow.png"),
            "silhouette": plot_url("cluster_silhouette.png"),
            "pca": plot_url("cluster_pca2d.png"),
            "dendrogram": plot_url("cluster_dendrogram.png"),
        },
    }
