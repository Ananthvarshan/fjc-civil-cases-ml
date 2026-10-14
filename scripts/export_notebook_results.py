"""Publish the full-data notebook leaderboards to the website.

Reads the results saved by executed copies of notebooks/classification.ipynb, regression.ipynb and
clustering.ipynb (default: notebooks/executed/artifacts) and writes
website/backend/artifacts/notebook_results.json. No model is trained here.
"""
from pathlib import Path
import argparse
import json
import warnings
from datetime import datetime, timezone

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT/'website/backend/artifacts/notebook_results.json'


def rows(frame, columns):
    return [{key: (float(r[col]) if isinstance(r[col], (float, np.floating, int, np.integer)) else str(r[col]))
             for key, col in columns.items()} for _, r in frame.iterrows()]


def main(source):
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        clf = joblib.load(source/'classification_final_results.pkl')
        reg = joblib.load(source/'regression_final_results.pkl')
        clu = joblib.load(source/'clustering_results.pkl')
        data = joblib.load(ROOT/'data/processed/model_ready_data.pkl')
    out = dict(created_utc=datetime.now(timezone.utc).isoformat(), source=str(source.relative_to(ROOT)).replace('\\', '/'),
               training_rows=len(data['X_train_final']), test_rows=len(data['X_test_final']))

    classifiers = rows(clf['comparison_clf_df_full'], dict(name='Model', accuracy='Accuracy', precision='Precision',
                       recall='Recall', f1='F1', roc_auc='ROC_AUC_OvR', fit_seconds='Fit_Seconds'))
    extra = ROOT/'website/backend/artifacts/perceptron_results.json'  # scripts/train_perceptron.py
    if extra.is_file() and not any(r['name'] == 'Single-Layer Perceptron' for r in classifiers):
        p = json.loads(extra.read_text(encoding='utf-8'))
        classifiers.append({k: p[k] for k in ['name', 'accuracy', 'precision', 'recall', 'f1', 'roc_auc', 'fit_seconds']})
        classifiers.sort(key=lambda r: -r['f1'])
    tuning = clf['tuning_result']
    out['classification'] = dict(models=classifiers, best=clf['best_model_name'], selection='Highest test weighted F1',
                                 tuning=dict(model=tuning['model_name'], params=tuning['best_params'],
                                             before=tuning['before'], after=tuning['after']))

    regressors = rows(reg['comparison_df'], dict(name='Model', r2='R2', rmse='RMSE', mae='MAE', fit_seconds='Fit_Seconds'))
    best = reg['best_model_name']
    tuned = None
    if best in reg['fitted_models'] and best not in {r['name'] for r in regressors}:
        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
        y = data['y_reg_test']; p = reg['fitted_models'][best].predict(data['X_test_final'])
        tuned = dict(name=best, r2=float(r2_score(y, p)), rmse=float(mean_squared_error(y, p)**.5),
                     mae=float(mean_absolute_error(y, p)))
    out['regression'] = dict(models=regressors, best=best, tuned=tuned, selection='Highest test R², then tuning')

    kmeans = rows(clu['results_df'], dict(name='model', silhouette='silhouette', davies_bouldin='davies_bouldin',
                  calinski_harabasz='calinski_harabasz'))
    k5 = rows(clu['cluster_metrics_df'], dict(name='Algorithm', silhouette='Silhouette', davies_bouldin='Davies-Bouldin',
              calinski_harabasz='Calinski-Harabasz'))
    out['clustering'] = dict(models=kmeans, k5_comparison=k5, best=clu['best_name'], selection='Highest silhouette',
                             sample_rows=len(clu['X_cluster_sample']))
    TARGET.write_text(json.dumps(out, indent=1), encoding='utf-8')
    print(f'Wrote {TARGET.relative_to(ROOT)}: best {out["classification"]["best"]} / {best} / {clu["best_name"]}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', default=str(ROOT/'notebooks/executed/artifacts'))
    main(Path(parser.parse_args().source).resolve())
