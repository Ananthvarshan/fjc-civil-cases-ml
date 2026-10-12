import math, random
from fastapi import APIRouter, HTTPException, Query
from typing import Literal
from backend.core import registry
from backend.core.schemas import ClusterResponse, ClusterPoint

router = APIRouter(prefix="/api/cluster", tags=["cluster"])


@router.get("/{cluster_type}", response_model=ClusterResponse)
async def get_cluster(
    cluster_type: Literal["kmeans", "agglo"],
    k: int = Query(default=3, ge=2, le=15),
) -> ClusterResponse:
    data = registry.CLUSTERS.get(cluster_type, {})

    if data:
        # Real artifact — extract for requested k
        points_raw = data.get("points_by_k", {}).get(str(k), data.get("points", []))
        metrics = data.get("metrics_by_k", {}).get(str(k), data.get("metrics", {}))
        extra = {key: val for key, val in data.items() if key not in ("points_by_k", "metrics_by_k", "points", "metrics")}
    else:
        # Mock — generate synthetic cluster points
        random.seed(k * 7 + (1 if cluster_type == "agglo" else 0))
        points_raw = _mock_cluster_points(k)
        metrics = _mock_cluster_metrics(k)
        extra = {"elbow": _mock_elbow()} if cluster_type == "kmeans" else {"linkage_type": "ward"}

    points = [ClusterPoint(**p) for p in points_raw]
    return ClusterResponse(type=cluster_type, k=k, points=points, metrics=metrics, extra=extra)


# ── Mock helpers ────────────────────────────────────────────────────────────

def _mock_cluster_points(k: int) -> list[dict]:
    random.seed(k * 13)
    points = []
    for i in range(300):
        cluster = i % k
        angle = cluster * (2 * math.pi / k) + random.gauss(0, 0.3)
        r = random.gauss(2.0, 0.6)
        points.append({
            "x": round(r * math.cos(angle), 3),
            "y": round(random.gauss(0, 0.6), 3),
            "z": round(r * math.sin(angle), 3),
            "label": cluster,
        })
    return points


def _mock_cluster_metrics(k: int) -> dict:
    # Silhouette peaks around k=4-5, DB decreases, CH increases then plateaus
    silhouette = max(0.1, 0.72 - abs(k - 4) * 0.07 + random.gauss(0, 0.02))
    return {
        "silhouette": round(silhouette, 4),
        "davies_bouldin": round(1.8 / (silhouette + 0.3), 4),
        "calinski_harabasz": round(450 + k * 30 - k * k * 2 + random.gauss(0, 15), 2),
    }


def _mock_elbow() -> list[dict]:
    return [{"k": k, "inertia": round(5000 / k + random.gauss(0, 50), 1)} for k in range(2, 11)]
