"""
export_artifacts.py
====================
Run this script ONCE after executing all four notebooks:
    preprocessing.ipynb
    classification.ipynb
    regression.ipynb
    clustering.ipynb

It reads the .pkl files those notebooks save and writes every artifact
that the FastAPI backend (and frontend) need into:
    website/backend/artifacts/

Usage:
    cd <repo-root>
    python notebooks/export_artifacts.py
"""

import json
import os
import shutil
import warnings
from pathlib import Path

import joblib
import matplotlib
matplotlib.use("Agg")          # headless — no GUI window
import matplotlib.pyplot as plt
import matplotlib.cm as cm
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve,
    r2_score, mean_squared_error, mean_absolute_error,
    silhouette_score, davies_bouldin_score, calinski_harabasz_score,
)
from sklearn.decomposition import PCA

warnings.filterwarnings("ignore")

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).resolve().parent.parent          # repo root
DATA_DIR    = ROOT / "data" / "processed"
MODELS_DIR  = ROOT / "models"
ARTIFACTS   = ROOT / "website" / "backend" / "artifacts"
PLOTS_DIR   = ARTIFACTS / "plots"
ART_MODELS  = ARTIFACTS / "models"
TRACES_DIR  = ARTIFACTS / "traces"
CLUSTERS_DIR= ARTIFACTS / "clusters"

for d in [PLOTS_DIR, ART_MODELS, TRACES_DIR, CLUSTERS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ── Helpers ───────────────────────────────────────────────────────────────────
def save_json(obj, path: Path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, default=_json_default)
    print(f"  [+] {path.relative_to(ROOT)}")


def is_lfs_pointer(path: Path) -> bool:
    """Return True when a Git LFS file was checked out as a pointer only."""
    try:
        return path.read_text(encoding="utf-8", errors="ignore").startswith(
            "version https://git-lfs.github.com/spec/v1"
        )
    except OSError:
        return False

def _json_default(obj):
    if isinstance(obj, (np.integer,)):  return int(obj)
    if isinstance(obj, (np.floating,)): return float(obj)
    if isinstance(obj, np.ndarray):     return obj.tolist()
    if isinstance(obj, pd.Series):      return obj.tolist()
    raise TypeError(f"Not serialisable: {type(obj)}")

def save_fig(fig, name: str):
    path = PLOTS_DIR / name
    fig.savefig(path, dpi=120, bbox_inches="tight")
    plt.close(fig)
    print(f"  [+] plots/{name}")

def section(title: str):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")

# ══════════════════════════════════════════════════════════════════════════════
#  A.  PREPROCESSING ARTIFACTS
# ══════════════════════════════════════════════════════════════════════════════
section("A. Preprocessing")

prep_path = DATA_DIR / "model_ready_data.pkl"
if not prep_path.exists() or is_lfs_pointer(prep_path):
    print(f"  [!] {prep_path} not found — skipping preprocessing artifacts.")
else:
    prep = joblib.load(prep_path)
    X_train_final  = prep["X_train_final"]
    X_test_final   = prep["X_test_final"]
    y_clf_train    = prep["y_clf_train"]
    y_clf_test     = prep["y_clf_test"]
    y_reg_train    = prep["y_reg_train"]
    y_reg_test     = prep["y_reg_test"]
    CLASS_LABELS   = prep.get("CLASS_LABELS",
                              ["Dismissed", "Settled", "Judgment", "Transferred", "Statistical"])
    RANDOM_STATE   = prep.get("RANDOM_STATE", 42)

    n_train = len(X_train_final)
    n_test  = len(X_test_final)
    n_total = n_train + n_test
    n_pca   = X_train_final.shape[1]

    # Class distribution
    class_dist = y_clf_train.value_counts(normalize=True)
    class_dist_dict = {}
    for idx, label in enumerate(CLASS_LABELS):
        class_dist_dict[label] = round(float(class_dist.get(label, class_dist.get(idx, 0.0))), 4)

    # PCA 3D scatter (sample 2000 from train)
    rng = np.random.RandomState(RANDOM_STATE)
    sample_idx = rng.choice(len(X_train_final), size=min(2000, len(X_train_final)), replace=False)
    X_sample = X_train_final.iloc[sample_idx].values
    y_sample = np.array(y_clf_train.iloc[sample_idx])

    pca3 = PCA(n_components=3, random_state=RANDOM_STATE)
    X_pca3 = pca3.fit_transform(X_sample)

    # Convert class labels to integer indices for JSON
    label_to_int = {lbl: i for i, lbl in enumerate(CLASS_LABELS)}
    pca_points = [
        {"x": round(float(X_pca3[i, 0]), 4),
         "y": round(float(X_pca3[i, 1]), 4),
         "z": round(float(X_pca3[i, 2]), 4),
         "label": int(label_to_int.get(y_sample[i], y_sample[i]))}
        for i in range(len(X_pca3))
    ]

    # Feature list (PC names)
    features = [
        {"name": f"PC{i+1}", "type": "numerical",
         "description": f"Principal component {i+1}",
         "min": float(X_train_final.iloc[:, i].min()),
         "max": float(X_train_final.iloc[:, i].max())}
        for i in range(n_pca)
    ]

    dataset_json = {
        "name": "FJC Civil Cases (IDB)",
        "description": "U.S. Federal court civil litigation records from the Federal Judicial Center Integrated Database.",
        "n_samples": n_total,
        "n_train":   n_train,
        "n_test":    n_test,
        "n_features": n_pca,
        "n_pca_components": n_pca,
        "variance_retained": 0.95,
        "class_names": CLASS_LABELS,
        "class_distribution": class_dist_dict,
        "task": "classification",
        "features": features,
        "presets": [
            {"label": "Quick Settlement", "values": {f"PC{i+1}": 0.0 for i in range(n_pca)}},
        ],
        "pca_points": pca_points,
    }
    save_json(dataset_json, ARTIFACTS / "dataset.json")

    # ── Plot: Class distribution bar chart ───────────────────────────────────
    fig, ax = plt.subplots(figsize=(8, 5))
    labels_sorted = CLASS_LABELS
    vals = [class_dist_dict.get(l, 0) * 100 for l in labels_sorted]
    colors = ["#4C72B0", "#55A868", "#C44E52", "#8172B2", "#CCB974"]
    ax.bar(labels_sorted, vals, color=colors)
    ax.set_title("Class Distribution — Case Outcome (Train Set)")
    ax.set_ylabel("Percentage (%)")
    ax.set_xlabel("Outcome")
    for i, v in enumerate(vals):
        ax.text(i, v + 0.3, f"{v:.1f}%", ha="center", fontsize=9)
    plt.tight_layout()
    save_fig(fig, "preprocessing_class_dist.png")

    # ── Plot: PCA 2D scatter ─────────────────────────────────────────────────
    pca2 = PCA(n_components=2, random_state=RANDOM_STATE)
    X_pca2 = pca2.fit_transform(X_sample)
    fig, ax = plt.subplots(figsize=(8, 6))
    cmap = plt.get_cmap("tab10")
    for idx, label in enumerate(CLASS_LABELS):
        mask = np.array([label_to_int.get(y, y) for y in y_sample]) == idx
        ax.scatter(X_pca2[mask, 0], X_pca2[mask, 1],
                   label=label, alpha=0.5, s=10, color=cmap(idx))
    ax.set_title("PCA 2D — Training Data by Class")
    ax.set_xlabel("PC1"); ax.set_ylabel("PC2")
    ax.legend(markerscale=2, fontsize=8)
    plt.tight_layout()
    save_fig(fig, "preprocessing_pca_2d.png")

    # ── Plot: Explained variance scree ───────────────────────────────────────
    pca_full = PCA(random_state=RANDOM_STATE)
    pca_full.fit(X_train_final)
    cum_var = np.cumsum(pca_full.explained_variance_ratio_) * 100
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(range(1, len(cum_var) + 1), cum_var, color="#4C72B0")
    ax.axhline(95, color="red", linestyle="--", label="95% threshold")
    ax.set_title("PCA — Cumulative Explained Variance")
    ax.set_xlabel("Number of Components"); ax.set_ylabel("Cumulative Variance (%)")
    ax.legend()
    plt.tight_layout()
    save_fig(fig, "preprocessing_pca_scree.png")

    print("  [✓] Preprocessing artifacts done.")

# ══════════════════════════════════════════════════════════════════════════════
#  B.  CLASSIFICATION ARTIFACTS
# ══════════════════════════════════════════════════════════════════════════════
section("B. Classification")

clf_path = DATA_DIR / "classification_final_results.pkl"
if not clf_path.exists() or is_lfs_pointer(clf_path):
    print(f"  [!] {clf_path} not found — skipping classification artifacts.")
else:
    from sklearn.model_selection import RandomizedSearchCV
    from sklearn.neural_network import MLPClassifier
    from sklearn.ensemble import (
        RandomForestClassifier, GradientBoostingClassifier,
        BaggingClassifier, AdaBoostClassifier,
    )
    from sklearn.tree import DecisionTreeClassifier

    clf_data = joblib.load(clf_path)
    fitted_models_clf  = clf_data["fitted_models_clf"]   # dict: name -> sklearn model
    CLASS_LABELS_clf   = clf_data.get("CLASS_LABELS", CLASS_LABELS)
    comparison_df      = clf_data.get("comparison_clf_df_full", pd.DataFrame())
    best_model_name    = clf_data.get("best_model_name", "MLP Classifier")

    # Map display names → artifact IDs
    MODEL_ID_MAP = {
        "Random Forest Classifier":    "random_forest",
        "AdaBoost Classifier":         "adaboost",
        "Gradient Boosting Classifier":"gradient_boosting",
        "Bagging Classifier":          "bagging",
        "MLP Classifier":              "mlp",
    }

    # Tuning grids for each model
    TUNING_GRIDS = {
        "MLP Classifier": (
            MLPClassifier(max_iter=300, early_stopping=True, random_state=RANDOM_STATE),
            {"hidden_layer_sizes": [(64, 32), (128, 64), (64, 32, 16)],
             "activation": ["relu", "tanh"],
             "alpha": [0.0001, 0.001, 0.01]},
        ),
        "Random Forest Classifier": (
            RandomForestClassifier(class_weight="balanced", random_state=RANDOM_STATE, n_jobs=-1),
            {"n_estimators": [150, 250], "max_depth": [10, 15, None],
             "min_samples_leaf": [1, 2, 5], "max_features": ["sqrt", 0.5]},
        ),
        "Gradient Boosting Classifier": (
            GradientBoostingClassifier(random_state=RANDOM_STATE),
            {"n_estimators": [100, 150], "max_depth": [2, 3, 4], "learning_rate": [0.05, 0.1, 0.2]},
        ),
        "Bagging Classifier": (
            BaggingClassifier(
                estimator=DecisionTreeClassifier(class_weight="balanced", random_state=RANDOM_STATE),
                random_state=RANDOM_STATE, n_jobs=-1),
            {"n_estimators": [30, 50, 80], "max_samples": [0.6, 0.8, 1.0]},
        ),
    }

    metrics_json = {}
    tuning_results = {}   # stores before/after for the best model

    for display_name, mid in MODEL_ID_MAP.items():
        model = fitted_models_clf.get(display_name)
        if model is None:
            print(f"  [!] Model '{display_name}' not found in pkl — skipping.")
            continue

        print(f"  Processing {display_name} ...")

        # ── Evaluate on test set ─────────────────────────────────────────────
        y_pred  = model.predict(X_test_final)
        y_proba = model.predict_proba(X_test_final)
        n_cls   = len(CLASS_LABELS_clf)

        acc       = float(accuracy_score(y_clf_test, y_pred))
        prec      = float(precision_score(y_clf_test, y_pred, average="weighted", zero_division=0))
        rec       = float(recall_score(y_clf_test, y_pred, average="weighted", zero_division=0))
        f1        = float(f1_score(y_clf_test, y_pred, average="weighted", zero_division=0))
        roc_auc   = float(roc_auc_score(y_clf_test, y_proba, multi_class="ovr", average="weighted"))

        # Fit time from comparison table
        train_time = 0.0
        if not comparison_df.empty and "Fit_Seconds" in comparison_df.columns:
            row = comparison_df[comparison_df["Model"] == display_name]
            if not row.empty:
                train_time = float(row["Fit_Seconds"].values[0])

        # Confusion matrix
        cm_arr = confusion_matrix(y_clf_test, y_pred, labels=CLASS_LABELS_clf).tolist()

        # ROC curve (macro OvR — one curve per class, then average)
        roc_pts = []
        for cls_idx in range(n_cls):
            y_bin = (np.array(y_clf_test) == CLASS_LABELS_clf[cls_idx]).astype(int)
            fpr, tpr, _ = roc_curve(y_bin, y_proba[:, cls_idx])
            for f, t in zip(fpr.tolist(), tpr.tolist()):
                roc_pts.append({"fpr": round(f, 4), "tpr": round(t, 4),
                                "class": CLASS_LABELS_clf[cls_idx]})

        # Average ROC curve (for overall display)
        avg_roc = []
        fpr_grid = np.linspace(0, 1, 50)
        tpr_sum  = np.zeros(50)
        for cls_idx in range(n_cls):
            y_bin = (np.array(y_clf_test) == CLASS_LABELS_clf[cls_idx]).astype(int)
            fpr, tpr, _ = roc_curve(y_bin, y_proba[:, cls_idx])
            tpr_sum += np.interp(fpr_grid, fpr, tpr)
        tpr_avg = tpr_sum / n_cls
        avg_roc = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)}
                   for f, t in zip(fpr_grid, tpr_avg)]

        metrics_json[mid] = {
            "accuracy":         round(acc, 4),
            "precision":        round(prec, 4),
            "recall":           round(rec, 4),
            "f1":               round(f1, 4),
            "roc_auc":          round(roc_auc, 4),
            "train_time_s":     round(train_time, 1),
            "confusion_matrix": cm_arr,
            "roc_points":       avg_roc,
        }

        # ── Save model joblib ────────────────────────────────────────────────
        joblib.dump(model, ART_MODELS / f"{mid}.joblib")
        print(f"    [+] models/{mid}.joblib")

        # ── Plot: Confusion matrix ───────────────────────────────────────────
        fig, ax = plt.subplots(figsize=(7, 6))
        im = ax.imshow(cm_arr, interpolation="nearest", cmap="Blues")
        plt.colorbar(im, ax=ax)
        ax.set_xticks(range(n_cls)); ax.set_yticks(range(n_cls))
        ax.set_xticklabels(CLASS_LABELS_clf, rotation=30, ha="right", fontsize=8)
        ax.set_yticklabels(CLASS_LABELS_clf, fontsize=8)
        for i in range(n_cls):
            for j in range(n_cls):
                ax.text(j, i, str(cm_arr[i][j]), ha="center", va="center",
                        color="white" if cm_arr[i][j] > max(max(r) for r in cm_arr) / 2 else "black",
                        fontsize=7)
        ax.set_title(f"{display_name} — Confusion Matrix")
        ax.set_ylabel("True"); ax.set_xlabel("Predicted")
        plt.tight_layout()
        save_fig(fig, f"clf_{mid}_confusion.png")

        # ── Plot: ROC curve ──────────────────────────────────────────────────
        fig, ax = plt.subplots(figsize=(7, 5))
        ax.plot([r["fpr"] for r in avg_roc], [r["tpr"] for r in avg_roc],
                color="#4C72B0", lw=2, label=f"Avg ROC (AUC={roc_auc:.3f})")
        ax.plot([0, 1], [0, 1], "k--", lw=1)
        ax.set_title(f"{display_name} — ROC Curve (OvR Weighted)")
        ax.set_xlabel("False Positive Rate"); ax.set_ylabel("True Positive Rate")
        ax.legend()
        plt.tight_layout()
        save_fig(fig, f"clf_{mid}_roc.png")

        # ── Traces ──────────────────────────────────────────────────────────
        trace = {}

        # Feature importances (RF, GB, Bagging)
        if hasattr(model, "feature_importances_"):
            imp = model.feature_importances_
            top_idx = np.argsort(imp)[::-1][:15]
            trace["feature_importances"] = [
                {"feature": X_train_final.columns[i], "importance": round(float(imp[i]), 6)}
                for i in top_idx
            ]
        # Bagging: average over estimators
        elif hasattr(model, "estimators_") and hasattr(model.estimators_[0], "feature_importances_"):
            imp_mat = np.array([e.feature_importances_ for e in model.estimators_])
            imp = imp_mat.mean(axis=0)
            top_idx = np.argsort(imp)[::-1][:15]
            trace["feature_importances"] = [
                {"feature": X_train_final.columns[i], "importance": round(float(imp[i]), 6)}
                for i in top_idx
            ]

        # AdaBoost: staged accuracy
        if hasattr(model, "staged_predict"):
            staged = [float(accuracy_score(y_clf_test, p))
                      for p in model.staged_predict(X_test_final)]
            trace["staged_accuracy"] = [round(v, 4) for v in staged]

        # Gradient Boosting: train deviance
        if hasattr(model, "train_score_"):
            trace["train_deviance"] = [round(float(v), 6) for v in model.train_score_]

        # MLP: loss curve
        if hasattr(model, "loss_curve_"):
            trace["loss_curve"] = [round(float(v), 6) for v in model.loss_curve_]

        trace["class_names"] = CLASS_LABELS_clf
        save_json(trace, TRACES_DIR / f"{mid}.json")

    # ── Tune the BEST model ──────────────────────────────────────────────────
    best_mid = MODEL_ID_MAP.get(best_model_name)
    baseline_model = fitted_models_clf.get(best_model_name)

    if best_mid and baseline_model and best_model_name in TUNING_GRIDS:
        print(f"\n  Tuning best model: {best_model_name} ...")

        # Before-tuning metrics (already computed above)
        before_metrics = metrics_json.get(best_mid, {})
        f1_before  = before_metrics.get("f1", 0)
        acc_before = before_metrics.get("accuracy", 0)

        # Run RandomizedSearchCV
        estimator, param_grid = TUNING_GRIDS[best_model_name]
        search = RandomizedSearchCV(
            estimator, param_grid, n_iter=10, cv=3,
            scoring="f1_weighted", n_jobs=-1,
            random_state=RANDOM_STATE, verbose=0
        )
        search.fit(X_train_final, y_clf_train)
        tuned_model = search.best_estimator_

        print(f"    Best params: {search.best_params_}")

        # After-tuning evaluation
        y_pred_t  = tuned_model.predict(X_test_final)
        y_proba_t = tuned_model.predict_proba(X_test_final)
        n_cls     = len(CLASS_LABELS_clf)

        acc_after  = float(accuracy_score(y_clf_test, y_pred_t))
        prec_after = float(precision_score(y_clf_test, y_pred_t, average="weighted", zero_division=0))
        rec_after  = float(recall_score(y_clf_test, y_pred_t, average="weighted", zero_division=0))
        f1_after   = float(f1_score(y_clf_test, y_pred_t, average="weighted", zero_division=0))
        auc_after  = float(roc_auc_score(y_clf_test, y_proba_t, multi_class="ovr", average="weighted"))

        cm_tuned   = confusion_matrix(y_clf_test, y_pred_t, labels=CLASS_LABELS_clf).tolist()

        # Average ROC curve for tuned model
        fpr_grid = np.linspace(0, 1, 50)
        tpr_sum  = np.zeros(50)
        for cls_idx in range(n_cls):
            y_bin = (np.array(y_clf_test) == CLASS_LABELS_clf[cls_idx]).astype(int)
            fpr, tpr, _ = roc_curve(y_bin, y_proba_t[:, cls_idx])
            tpr_sum += np.interp(fpr_grid, fpr, tpr)
        roc_tuned = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)}
                     for f, t in zip(fpr_grid, tpr_sum / n_cls)]

        print(f"    F1 before tuning: {f1_before:.4f}  →  after tuning: {f1_after:.4f}")

        # Store tuned model under {mid}_tuned key in metrics
        tuned_mid = f"{best_mid}_tuned"
        metrics_json[tuned_mid] = {
            "accuracy":         round(acc_after, 4),
            "precision":        round(prec_after, 4),
            "recall":           round(rec_after, 4),
            "f1":               round(f1_after, 4),
            "roc_auc":          round(auc_after, 4),
            "train_time_s":     round(search.refit_time_, 1),
            "confusion_matrix": cm_tuned,
            "roc_points":       roc_tuned,
            "is_tuned":         True,
            "tuned_from":       best_mid,
            "best_params":      {str(k): str(v) for k, v in search.best_params_.items()},
        }

        # Store before/after comparison for the trace
        tuning_results = {
            "model_name":   best_model_name,
            "model_id":     best_mid,
            "tuned_id":     tuned_mid,
            "before": {
                "f1":       round(f1_before, 4),
                "accuracy": round(acc_before, 4),
            },
            "after": {
                "f1":       round(f1_after, 4),
                "accuracy": round(acc_after, 4),
            },
            "improvement_f1":  round(f1_after - f1_before, 4),
            "best_params":     {str(k): str(v) for k, v in search.best_params_.items()},
        }

        # Save tuned model
        joblib.dump(tuned_model, ART_MODELS / f"{tuned_mid}.joblib")
        print(f"    [+] models/{tuned_mid}.joblib")

        # Save tuning results to a dedicated JSON
        save_json(tuning_results, ARTIFACTS / "clf_tuning_results.json")

        # ── Plot: Before vs After tuning comparison ──────────────────────────
        metrics_compare = ["F1", "Accuracy"]
        before_vals = [f1_before, acc_before]
        after_vals  = [f1_after,  acc_after]
        x = np.arange(len(metrics_compare))
        fig, ax = plt.subplots(figsize=(7, 5))
        ax.bar(x - 0.2, before_vals, 0.35, label=f"{best_model_name} (Before)", color="#4C72B0")
        ax.bar(x + 0.2, after_vals,  0.35, label=f"{best_model_name} (Tuned)",  color="#55A868")
        ax.set_xticks(x); ax.set_xticklabels(metrics_compare)
        ax.set_ylim(0, 1); ax.set_ylabel("Score")
        ax.set_title(f"Hyperparameter Tuning — {best_model_name}\nBefore vs After")
        ax.legend()
        for i, (b, a) in enumerate(zip(before_vals, after_vals)):
            ax.text(i - 0.2, b + 0.01, f"{b:.4f}", ha="center", fontsize=8)
            ax.text(i + 0.2, a + 0.01, f"{a:.4f}", ha="center", fontsize=8, color="#228B22")
        plt.tight_layout()
        save_fig(fig, "clf_tuning_before_after.png")

        # ── Plot: Confusion matrix — Tuned model ─────────────────────────────
        fig, ax = plt.subplots(figsize=(7, 6))
        im = ax.imshow(cm_tuned, interpolation="nearest", cmap="Greens")
        plt.colorbar(im, ax=ax)
        ax.set_xticks(range(n_cls)); ax.set_yticks(range(n_cls))
        ax.set_xticklabels(CLASS_LABELS_clf, rotation=30, ha="right", fontsize=8)
        ax.set_yticklabels(CLASS_LABELS_clf, fontsize=8)
        for ii in range(n_cls):
            for jj in range(n_cls):
                ax.text(jj, ii, str(cm_tuned[ii][jj]), ha="center", va="center",
                        color="white" if cm_tuned[ii][jj] > max(max(r) for r in cm_tuned) / 2 else "black",
                        fontsize=7)
        ax.set_title(f"{best_model_name} (Tuned) — Confusion Matrix")
        ax.set_ylabel("True"); ax.set_xlabel("Predicted")
        plt.tight_layout()
        save_fig(fig, f"clf_{tuned_mid}_confusion.png")

    else:
        print(f"  [!] Tuning skipped — '{best_model_name}' not in tuning grids or model missing.")

    save_json(metrics_json, ARTIFACTS / "metrics.json")

    # ── Plot: Classification comparison bar chart ────────────────────────────
    if metrics_json:
        # Only show 5 baseline models in comparison (not tuned variant)
        base_ids  = ["random_forest", "adaboost", "gradient_boosting", "bagging", "mlp"]
        disp_names = ["Random Forest", "AdaBoost", "Gradient Boosting", "Bagging", "MLP"]
        valid = [(mid, nm) for mid, nm in zip(base_ids, disp_names) if mid in metrics_json]
        ids   = [v[0] for v in valid]
        names = [v[1] for v in valid]
        f1s   = [metrics_json[i]["f1"] for i in ids]
        accs  = [metrics_json[i]["accuracy"] for i in ids]
        aucs  = [metrics_json[i]["roc_auc"] for i in ids]
        x     = np.arange(len(ids))
        w     = 0.25
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.bar(x - w, f1s,  w, label="F1",       color="#4C72B0")
        ax.bar(x,     accs, w, label="Accuracy",  color="#55A868")
        ax.bar(x + w, aucs, w, label="ROC-AUC",   color="#C44E52")
        ax.set_xticks(x); ax.set_xticklabels(names, rotation=15)
        ax.set_ylim(0, 1); ax.set_ylabel("Score")
        ax.set_title("Classification Models — Performance Comparison")
        ax.legend()
        plt.tight_layout()
        save_fig(fig, "clf_comparison_bar.png")

    print("  [✓] Classification artifacts done.")


# ══════════════════════════════════════════════════════════════════════════════
#  C.  REGRESSION ARTIFACTS
# ══════════════════════════════════════════════════════════════════════════════
section("C. Regression")

reg_path = DATA_DIR / "regression_final_results.pkl"
if not reg_path.exists() or is_lfs_pointer(reg_path):
    print(f"  [!] {reg_path} not found — skipping regression artifacts.")
else:
    reg_data = joblib.load(reg_path)
    fitted_models_reg = reg_data["fitted_models"]        # dict: name -> model/dict
    comparison_reg_df = reg_data.get("comparison_df", pd.DataFrame())
    best_reg_name     = reg_data.get("best_model_name", "")

    REG_ID_MAP = {
        "Linear Regression":               "linear_regression",
        "Ridge Regression":                "ridge",
        "Ridge Regression (Tuned)":        "ridge_tuned",
        "Lasso Regression":                "lasso",
        "Lasso Regression (Tuned)":        "lasso_tuned",
        "Polynomial Regression":           "polynomial",
        "Decision Tree Regressor":         "decision_tree",
        "Random Forest Regressor":         "random_forest",
        "Random Forest Regressor (Tuned)": "random_forest_tuned",
        "Gradient Boosting Regressor":     "gradient_boosting",
        "SVR":                             "svr",
        "KNN Regressor":                   "knn",
    }

    reg_metrics_json = {}

    for display_name, mid in REG_ID_MAP.items():
        model_obj = fitted_models_reg.get(display_name)
        if model_obj is None:
            continue

        print(f"  Processing {display_name} ...")

        # Polynomial is stored as dict {"poly": ..., "model": ...}
        if isinstance(model_obj, dict):
            poly_tfm = model_obj.get("poly")
            reg_model = model_obj.get("model")
            X_te = poly_tfm.transform(X_test_final) if poly_tfm else X_test_final
        else:
            reg_model = model_obj
            X_te = X_test_final

        try:
            y_pred_reg = reg_model.predict(X_te)
        except Exception as e:
            print(f"    [!] Prediction failed: {e}")
            continue

        r2   = float(r2_score(y_reg_test, y_pred_reg))
        rmse = float(np.sqrt(mean_squared_error(y_reg_test, y_pred_reg)))
        mae  = float(mean_absolute_error(y_reg_test, y_pred_reg))

        fit_time = 0.0
        if not comparison_reg_df.empty and "Fit_Seconds" in comparison_reg_df.columns:
            row = comparison_reg_df[comparison_reg_df["Model"] == display_name]
            if not row.empty:
                fit_time = float(row["Fit_Seconds"].values[0])

        reg_metrics_json[mid] = {
            "r2":          round(r2, 4),
            "rmse":        round(rmse, 2),
            "mae":         round(mae, 2),
            "fit_time_s":  round(fit_time, 1),
            "display_name": display_name,
        }

        # Save best model for live prediction
        if display_name == best_reg_name:
            joblib.dump(model_obj, ART_MODELS / "regression_best.joblib")
            print(f"    [+] models/regression_best.joblib  (best: {display_name})")
            reg_metrics_json[mid]["is_best"] = True

        # Feature importances for tree models
        if hasattr(reg_model, "feature_importances_"):
            imp = reg_model.feature_importances_
            top_idx = np.argsort(imp)[::-1][:15]
            reg_metrics_json[mid]["feature_importances"] = [
                {"feature": X_train_final.columns[i], "importance": round(float(imp[i]), 6)}
                for i in top_idx
            ]

        # ── Plot: Predicted vs Actual (best model only) ──────────────────────
        if display_name == best_reg_name:
            fig, axes = plt.subplots(1, 2, figsize=(14, 5))

            sample = rng.choice(len(y_reg_test), size=min(3000, len(y_reg_test)), replace=False)
            y_s  = np.array(y_reg_test)[sample]
            yp_s = y_pred_reg[sample]

            axes[0].scatter(y_s, yp_s, alpha=0.15, s=8, color="#4C72B0")
            lim = [0, max(y_s.max(), yp_s.max())]
            axes[0].plot(lim, lim, "r--", lw=1.5, label="Perfect")
            axes[0].set_title(f"{display_name}\nPredicted vs Actual")
            axes[0].set_xlabel("Actual days"); axes[0].set_ylabel("Predicted days")
            axes[0].legend()

            residuals = y_s - yp_s
            axes[1].scatter(yp_s, residuals, alpha=0.15, s=8, color="#C44E52")
            axes[1].axhline(0, color="black", lw=1)
            axes[1].set_title("Residuals vs Predicted")
            axes[1].set_xlabel("Predicted days"); axes[1].set_ylabel("Residual")
            plt.tight_layout()
            save_fig(fig, "reg_pred_vs_actual.png")

    save_json(reg_metrics_json, ARTIFACTS / "regression_metrics.json")

    # ── Plot: Regression comparison bar chart ────────────────────────────────
    if reg_metrics_json:
        # Show only baseline models (no tuned duplicates) sorted by R²
        base_ids = ["linear_regression", "ridge", "lasso", "polynomial",
                    "decision_tree", "random_forest", "gradient_boosting", "svr", "knn"]
        plot_ids   = [i for i in base_ids if i in reg_metrics_json]
        plot_names = [reg_metrics_json[i]["display_name"].replace(" Regressor", "").replace(" Regression", "") for i in plot_ids]
        r2s        = [reg_metrics_json[i]["r2"] for i in plot_ids]

        fig, ax = plt.subplots(figsize=(10, 5))
        colors = ["#55A868" if i == "random_forest" else "#4C72B0" for i in plot_ids]
        ax.barh(plot_names, r2s, color=colors)
        ax.set_xlabel("R² Score (Test)")
        ax.set_title("Regression Models — R² Comparison")
        ax.axvline(0, color="black", lw=0.5)
        for i, v in enumerate(r2s):
            ax.text(max(v, 0) + 0.005, i, f"{v:.3f}", va="center", fontsize=8)
        plt.tight_layout()
        save_fig(fig, "reg_comparison_bar.png")

    print("  [✓] Regression artifacts done.")

# ══════════════════════════════════════════════════════════════════════════════
#  D.  CLUSTERING ARTIFACTS
# ══════════════════════════════════════════════════════════════════════════════
section("D. Clustering")

clus_path = DATA_DIR / "clustering_results.pkl"
if not clus_path.exists() or is_lfs_pointer(clus_path):
    print(f"  [!] {clus_path} not found — skipping clustering artifacts.")
else:
    from sklearn.cluster import KMeans, AgglomerativeClustering
    from scipy.cluster.hierarchy import dendrogram, linkage as scipy_linkage

    clus_data    = joblib.load(clus_path)
    cluster_metrics_df = clus_data.get("cluster_metrics_df", [])
    K_CHOSEN     = int(clus_data.get("K_CHOSEN", 5))
    LINKAGE_CHOSEN = clus_data.get("LINKAGE_CHOSEN", "ward")

    # Re-load cluster sample from model_ready_data (same seed as notebook)
    CLUSTER_SAMPLE_SIZE = 15000
    sample_idx_c = np.random.RandomState(RANDOM_STATE).choice(
        len(X_train_final), size=CLUSTER_SAMPLE_SIZE, replace=False)
    X_cluster = X_train_final.iloc[sample_idx_c]

    # ── K-Means across k=2..10 ───────────────────────────────────────────────
    print("  Running K-Means for k=2..10 ...")
    k_range  = range(2, 11)
    inertias = []
    kmeans_by_k = {}
    metrics_by_k_km = {}

    for k in k_range:
        km = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10)
        labels = km.fit_predict(X_cluster)
        inertias.append(float(km.inertia_))
        kmeans_by_k[k] = labels
        sil = float(silhouette_score(X_cluster, labels, sample_size=3000, random_state=RANDOM_STATE))
        db  = float(davies_bouldin_score(X_cluster, labels))
        ch  = float(calinski_harabasz_score(X_cluster, labels))
        metrics_by_k_km[str(k)] = {
            "silhouette": round(sil, 4),
            "davies_bouldin": round(db, 4),
            "calinski_harabasz": round(ch, 2),
        }
        print(f"    k={k}  sil={sil:.3f}  db={db:.3f}")

    # PCA 3D for final k (K_CHOSEN)
    pca3c = PCA(n_components=3, random_state=RANDOM_STATE)
    X_c3  = pca3c.fit_transform(X_cluster)

    points_by_k_km = {}
    for k in k_range:
        pts = [{"x": round(float(X_c3[i, 0]), 4),
                "y": round(float(X_c3[i, 1]), 4),
                "z": round(float(X_c3[i, 2]), 4),
                "label": int(kmeans_by_k[k][i])}
               for i in range(len(X_c3))]
        points_by_k_km[str(k)] = pts

    # Load saved K-Means model if available; otherwise use the K_CHOSEN one
    km_model_path = MODELS_DIR / "kmeans_model.pkl"
    if km_model_path.exists():
        shutil.copy(km_model_path, ART_MODELS / "kmeans_model.joblib")
        print(f"  [+] models/kmeans_model.joblib  (copied from models/)")

    kmeans_json = {
        "k_chosen": K_CHOSEN,
        "elbow": [{"k": int(k), "inertia": round(v, 1)}
                  for k, v in zip(k_range, inertias)],
        "cluster_sizes": [int(np.sum(kmeans_by_k[K_CHOSEN] == c)) for c in range(K_CHOSEN)],
        "points_by_k": points_by_k_km,
        "metrics_by_k": metrics_by_k_km,
    }
    save_json(kmeans_json, CLUSTERS_DIR / "kmeans.json")

    # ── Agglomerative across k=2..10 ─────────────────────────────────────────
    print("  Running Agglomerative Clustering for k=2..10 ...")
    agglo_by_k = {}
    metrics_by_k_ag = {}

    for k in k_range:
        ag = AgglomerativeClustering(n_clusters=k, linkage=LINKAGE_CHOSEN)
        labels = ag.fit_predict(X_cluster)
        agglo_by_k[k] = labels
        sil = float(silhouette_score(X_cluster, labels, sample_size=3000, random_state=RANDOM_STATE))
        db  = float(davies_bouldin_score(X_cluster, labels))
        ch  = float(calinski_harabasz_score(X_cluster, labels))
        metrics_by_k_ag[str(k)] = {
            "silhouette": round(sil, 4),
            "davies_bouldin": round(db, 4),
            "calinski_harabasz": round(ch, 2),
        }
        print(f"    k={k}  sil={sil:.3f}  db={db:.3f}")

    points_by_k_ag = {}
    for k in k_range:
        pts = [{"x": round(float(X_c3[i, 0]), 4),
                "y": round(float(X_c3[i, 1]), 4),
                "z": round(float(X_c3[i, 2]), 4),
                "label": int(agglo_by_k[k][i])}
               for i in range(len(X_c3))]
        points_by_k_ag[str(k)] = pts

    agglo_json = {
        "k_chosen": K_CHOSEN,
        "linkage_type": LINKAGE_CHOSEN,
        "cluster_sizes": [int(np.sum(agglo_by_k[K_CHOSEN] == c)) for c in range(K_CHOSEN)],
        "points_by_k": points_by_k_ag,
        "metrics_by_k": metrics_by_k_ag,
    }
    save_json(agglo_json, CLUSTERS_DIR / "agglo.json")

    # ── Plot: Elbow curve ────────────────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(list(k_range), inertias, marker="o", color="#4C72B0")
    ax.set_title("K-Means — Elbow Curve")
    ax.set_xlabel("k (number of clusters)"); ax.set_ylabel("Inertia")
    plt.tight_layout()
    save_fig(fig, "cluster_elbow.png")

    # ── Plot: Dendrogram ─────────────────────────────────────────────────────
    DENDRO_N = 500
    dendro_idx = np.random.RandomState(RANDOM_STATE).choice(len(X_cluster), DENDRO_N, replace=False)
    X_dendro   = X_cluster.iloc[dendro_idx].values
    fig, axes = plt.subplots(1, 3, figsize=(20, 6))
    for ax, method in zip(axes, ["ward", "complete", "average"]):
        Z = scipy_linkage(X_dendro, method=method)
        dendrogram(Z, ax=ax, no_labels=True, color_threshold=0)
        ax.set_title(f"Dendrogram — {method.capitalize()} linkage")
    plt.tight_layout()
    save_fig(fig, "cluster_dendrogram.png")

    # ── Plot: PCA 2D scatter K-Means vs Agglo ───────────────────────────────
    pca2c = PCA(n_components=2, random_state=RANDOM_STATE)
    X_c2  = pca2c.fit_transform(X_cluster)
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    cmap = plt.get_cmap("tab10")
    for j, (title, labels) in enumerate([
            ("K-Means",       kmeans_by_k[K_CHOSEN]),
            ("Agglomerative", agglo_by_k[K_CHOSEN])]):
        for c in range(K_CHOSEN):
            mask = labels == c
            axes[j].scatter(X_c2[mask, 0], X_c2[mask, 1],
                            label=f"Cluster {c}", alpha=0.5, s=10, color=cmap(c))
        axes[j].set_title(f"{title} (k={K_CHOSEN})")
        axes[j].set_xlabel("PC1"); axes[j].set_ylabel("PC2")
        axes[j].legend(markerscale=2, fontsize=7)
    plt.tight_layout()
    save_fig(fig, "cluster_pca2d.png")

    # ── Plot: Metrics comparison (Silhouette) ───────────────────────────────
    ks = list(k_range)
    sil_km = [metrics_by_k_km[str(k)]["silhouette"] for k in ks]
    sil_ag = [metrics_by_k_ag[str(k)]["silhouette"] for k in ks]
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(ks, sil_km, marker="o", label="K-Means",       color="#4C72B0")
    ax.plot(ks, sil_ag, marker="s", label="Agglomerative", color="#C44E52")
    ax.set_title("Silhouette Score vs k")
    ax.set_xlabel("k"); ax.set_ylabel("Silhouette Score")
    ax.legend()
    plt.tight_layout()
    save_fig(fig, "cluster_silhouette.png")

    print("  [✓] Clustering artifacts done.")

# ══════════════════════════════════════════════════════════════════════════════
#  DONE
# ══════════════════════════════════════════════════════════════════════════════
section("ALL DONE")
print(f"\n  Artifacts written to: {ARTIFACTS}\n")
print("  You can now start the backend:  cd website && uvicorn backend.main:app --reload\n")
