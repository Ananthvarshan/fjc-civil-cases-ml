"""
In-memory registry — loaded once at startup via loader.py.
All routers read from these dicts; nothing is queried from disk at request time.
"""
from typing import Any

# Populated by loader.load_all() at app lifespan startup
DATASET: dict[str, Any] = {}   # feature schema, ranges, class names, PCA sample
MODELS: dict[str, Any] = {}    # {model_id: loaded sklearn pipeline}
METRICS: dict[str, Any] = {}   # {model_id: {accuracy, precision, recall, f1, roc_auc, cm, roc_points, train_time}}
TRACES: dict[str, Any] = {}    # {model_id: step-by-step animation data}
CLUSTERS: dict[str, Any] = {}  # {kmeans: {...}, agglo: {...}}
