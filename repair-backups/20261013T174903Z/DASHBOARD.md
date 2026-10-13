# Run the dashboard

From this project folder, run `python -m uvicorn website.backend.main:app --host 127.0.0.1 --port 8000`, then open http://127.0.0.1:8000.
Alternatively double-click `start_dashboard.cmd`. Stop an existing server before starting another on the same port.

The web server needs only `python -m pip install -r requirements-web.txt`. It reads the saved JSON report and PNG graphs without loading pickle files or training models.

## Rebuild real results

Install `python -m pip install -r requirements-build.txt`, then run `python scripts/build_dashboard.py`.
The old `python notebooks/export_artifacts.py` command now runs the same builder.
This does not require classification_final_results.pkl or regression_final_results.pkl.
It needs the real local `data/processed/model_ready_data.pkl` supplied by preprocessing.

The default build draws 12,000 stratified rows from prepared training data, splits them into 9,600 training and 2,400 validation rows, and evaluates all supervised models on the same 10,000 held-out test rows.
Clustering compares K-Means, MiniBatch K-Means and Ward agglomerative clustering for k=2..8 on 3,000 rows, using a shared 1,500-row scoring subset.
These sample sizes and the seed are displayed on the website. Full supervised data can be requested with `python scripts/build_dashboard.py --train-rows 0 --test-rows 0`; this may take much longer, especially SVC and polynomial regression.

All 10 classifiers and 10 regressors are freshly fitted with recorded settings; this build does not perform hyperparameter searches. Classifiers rank by validation weighted F1; regressors by validation RMSE. Test results are reported separately. Clusters rank by silhouette, then Davies–Bouldin. These are best within this run, not universal best models.
The source PCA/scaler/encoder were supplied in prepared data; preprocessing is not refitted inside the validation split, so this is not a fully independent validation of preprocessing. Results describe the capped/transformed target prepared by the existing notebook.

Each build saves models, all-model metrics and diagnostic PNGs under `website/backend/artifacts/runs/<UTC timestamp>/`. The report is published atomically to `dashboard.json` at completion; interrupted builds do not replace the last completed dashboard. Model warnings and failures are reported. There is no fabricated fallback data.
The original notebooks and raw data are preserved for research. Older `.pkl` placeholders are no longer consumed by the dashboard. Do not interpret historical notebook outputs as measurements of this new run.
