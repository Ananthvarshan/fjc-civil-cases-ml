"""
Basic smoke tests for the predict endpoints.
Run with: pytest tests/test_predict.py -v
"""
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.core.loader import load_all

@pytest.fixture(scope="module")
def client():
    load_all()          # ensure registry is populated before requests
    with TestClient(app) as c:
        yield c

SAMPLE_FEATURES = {
    "CIRCUIT": 9,
    "DISTRICT": 50,
    "OFFICE": 1,
    "ORIGIN": 1,
    "NOS": 120,
    "JURY": 0,
    "CLASSACT": 0,
    "PROSE": 0,
    "TAPEYEAR": 2019,
}

MODEL_IDS = ["random_forest", "adaboost", "gradient_boosting", "bagging", "mlp"]


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_meta(client):
    r = client.get("/api/meta")
    assert r.status_code == 200
    data = r.json()
    assert "features" in data
    assert "class_names" in data
    assert len(data["class_names"]) > 0


@pytest.mark.parametrize("model_id", MODEL_IDS)
def test_predict_one(client, model_id):
    r = client.post(f"/api/predict/{model_id}", json={"features": SAMPLE_FEATURES})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "label" in data
    assert "probabilities" in data
    assert sum(data["probabilities"].values()) == pytest.approx(1.0, abs=0.01)


def test_predict_all(client):
    r = client.post("/api/predict/all", json={"features": SAMPLE_FEATURES})
    assert r.status_code == 200
    data = r.json()
    assert "results" in data
    for mid in MODEL_IDS:
        assert mid in data["results"]


def test_compare(client):
    r = client.get("/api/compare")
    assert r.status_code == 200
    data = r.json()
    assert "metrics" in data
    assert "roc_curves" in data


@pytest.mark.parametrize("algo,k", [("kmeans", 3), ("agglo", 4)])
def test_cluster(client, algo, k):
    r = client.get(f"/api/cluster/{algo}?k={k}")
    assert r.status_code == 200
    data = r.json()
    assert data["k"] == k
    assert len(data["points"]) > 0
    assert "silhouette" in data["metrics"]


def test_predict_404(client):
    r = client.post("/api/predict/nonexistent_model", json={"features": SAMPLE_FEATURES})
    assert r.status_code == 404
