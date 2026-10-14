"""Train the single-layer perceptron (37 PCA inputs -> 5 outcomes, no hidden layer) on the full split.

Same model and settings as section 11 of notebooks/classification.ipynb. Saves the model to
models/single_layer_perceptron.pkl and its full-test-set scores to
website/backend/artifacts/perceptron_results.json (merged into the leaderboard by
scripts/export_notebook_results.py).
"""
from pathlib import Path
import json
import time
import warnings

import joblib
import numpy as np
from sklearn.linear_model import Perceptron
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score

ROOT = Path(__file__).resolve().parents[1]


def softmax(scores):
    z = np.exp(scores - scores.max(axis=1, keepdims=True))
    return z/z.sum(axis=1, keepdims=True)


def main():
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        data = joblib.load(ROOT/'data/processed/model_ready_data.pkl')
    X, y = np.asarray(data['X_train_final'], float), np.asarray(data['y_clf_train'])
    T, yt = np.asarray(data['X_test_final'], float), np.asarray(data['y_clf_test'])
    start = time.perf_counter()
    model = Perceptron(max_iter=1000, tol=1e-3, early_stopping=True, random_state=data['RANDOM_STATE'], n_jobs=-1)
    model.fit(X, y)
    fit = time.perf_counter() - start
    pred, proba = model.predict(T), softmax(model.decision_function(T))
    scores = dict(name='Single-Layer Perceptron', accuracy=accuracy_score(yt, pred),
                  precision=precision_score(yt, pred, average='weighted', zero_division=0),
                  recall=recall_score(yt, pred, average='weighted', zero_division=0),
                  f1=f1_score(yt, pred, average='weighted', zero_division=0),
                  roc_auc=roc_auc_score(yt, proba, multi_class='ovr', average='weighted', labels=model.classes_),
                  fit_seconds=fit, epochs=int(model.n_iter_), inputs=int(X.shape[1]), outputs=len(model.classes_))
    joblib.dump(model, ROOT/'models/single_layer_perceptron.pkl')
    out = ROOT/'website/backend/artifacts/perceptron_results.json'
    out.write_text(json.dumps(scores, indent=1), encoding='utf-8')
    print({k: (round(v, 4) if isinstance(v, float) else v) for k, v in scores.items()})


if __name__ == '__main__':
    main()
