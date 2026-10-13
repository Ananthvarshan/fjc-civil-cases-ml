# Run the dashboard

From this project folder, run `python -m uvicorn website.backend.main:app --host 127.0.0.1 --port 8000`, then open http://127.0.0.1:8000.
Alternatively double-click `start_dashboard.cmd`. Stop an existing server before starting another on the same port.

The web server needs only `python -m pip install -r requirements-web.txt`. The result pages read the saved JSON report and PNG graphs; only the Predict page loads saved models, and nothing is trained by the server.

## Rebuild real results

Install `python -m pip install -r requirements-build.txt`, then run `python scripts/build_dashboard.py`.
The old `python notebooks/export_artifacts.py` command now runs the same builder.
This does not require classification_final_results.pkl or regression_final_results.pkl.
It needs the real local `data/processed/model_ready_data.pkl` supplied by preprocessing.

The default build draws 12,000 stratified rows from prepared training data, splits them into 9,600 training and 2,400 validation rows, and evaluates all supervised models on the same 10,000 held-out test rows.
Clustering compares K-Means and Ward agglomerative clustering for k=2..8 on 3,000 rows, using a shared 1,500-row scoring subset.
These sample sizes and the seed are displayed on the website. Full supervised data can be requested with `python scripts/build_dashboard.py --train-rows 0 --test-rows 0`; this may take much longer, especially SVC and polynomial regression.

All 10 classifiers and 10 regressors are freshly fitted with recorded settings; this build does not perform hyperparameter searches. Classifiers rank by validation weighted F1; regressors by validation RMSE. Test results are reported separately. Clusters rank by silhouette, then Davies–Bouldin. These are best within this run, not universal best models.
The source PCA/scaler/encoder were supplied in prepared data; preprocessing is not refitted inside the validation split, so this is not a fully independent validation of preprocessing. Results describe the capped/transformed target prepared by the existing notebook.

Each build saves models, all-model metrics and diagnostic PNGs under `website/backend/artifacts/runs/<UTC timestamp>/`. The report is published atomically to `dashboard.json` at completion; interrupted builds do not replace the last completed dashboard. Model warnings and failures are reported. There is no fabricated fallback data.
The original notebooks and raw data are preserved for research. Older `.pkl` placeholders are no longer consumed by the dashboard. Do not interpret historical notebook outputs as measurements of this new run.

Decision-tree and random-forest models include interactive tree views (display depths 1–6). Forests have a selector for all fitted trees. PC splits are on prepared components, not original case variables.

## Predict page

The Predict page scores a case you describe (district, filing month, origin, jurisdiction, nature of suit, class action, party citizenship, amount demanded, jury demand, pro se, IFP, procedural progress) with any saved classifier (case outcome) or regressor (days to resolution) from the current run. It shows the prediction, class probabilities, every model's answer for the same case, and which inputs moved the prediction compared with the most common case in the data.
Inputs are rebuilt with the notebook's own scaler, one-hot encoder and PCA, exported by `python scripts/build_predictor.py` to `website/backend/artifacts/predictor/preprocess.joblib`. Re-run that script if `notebooks/preprocessing.ipynb` is re-run. `--verify` checks the export against `X_test_final` using the raw `data/cv23.sas7bdat`.

## Full-data notebook results

Overview, Classification, Regression and Clustering show a "full data" leaderboard above the sampled-run explorer. It comes from `website/backend/artifacts/notebook_results.json`, written by `python scripts/export_notebook_results.py` from the results saved by executed copies of the notebooks (default `notebooks/executed/artifacts`). Re-run the notebooks and this script to refresh it; the server needs a restart to pick it up.
