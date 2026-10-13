"""Copy everything the Streamlit app needs into streamlit_app/ so that folder can be deployed alone.

The app code lives in streamlit_app/. This script refreshes its copy of the scoring module and the
small artifacts (preprocessing, saved models under 100 MB, reports, plots), and builds case-segment
profiles for the notebook's K-Means model. Run after scripts/build_dashboard.py,
scripts/build_predictor.py and scripts/export_notebook_results.py.
"""
from pathlib import Path
import json
import shutil
import warnings

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT/'website/backend'
APP = ROOT/'streamlit_app'
OUT = APP/'artifacts'
LIMIT = 95*1024*1024  # GitHub rejects files over 100 MB


def copy(src, dst):
    if src.stat().st_size > LIMIT:
        raise SystemExit(f'{src} is too large for GitHub; leave it out of the bundle.')
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    copy(SRC/'predictor.py', APP/'predictor.py')
    report = json.loads((SRC/'artifacts/dashboard.json').read_text(encoding='utf-8'))
    run = report['meta']['run_id']
    for name in ['dashboard.json', 'notebook_results.json', 'predictor/preprocess.joblib']:
        copy(SRC/'artifacts'/name, OUT/name)
    saved = json.loads((SRC/'artifacts/predictor/notebook_models.json').read_text(encoding='utf-8'))
    for m in saved:
        copy(ROOT/m['path'], OUT/m['path'])
    (OUT/'predictor/notebook_models.json').write_text(json.dumps(saved, indent=1), encoding='utf-8')
    for task in ['classification', 'regression']:
        for m in report[task]['models']:
            copy(SRC/'artifacts/runs'/run/'models'/(m['id'] + '.joblib'), OUT/'runs'/run/'models'/(m['id'] + '.joblib'))
    for png in (SRC/'artifacts/runs'/run/'plots').glob('*.png'):
        copy(png, OUT/'runs'/run/'plots'/png.name)
    for png in (SRC/'artifacts/plots').glob('*.png'):
        copy(png, OUT/'plots'/png.name)
    segments()
    dashboard(report)
    total = sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())
    print(f'Bundled {sum(1 for p in OUT.rglob("*") if p.is_file())} files, {total/1e6:.1f} MB, into {OUT.relative_to(ROOT)}')


def dashboard(report):
    """Package the FastAPI dashboard's own frontend as a static Streamlit component.

    Every GET endpoint is saved as a JSON file under dashboard/data/api/; static/bridge.js routes the
    page's fetch calls to those files and sends POST /api/predict to Python (streamlit_app.py).
    """
    import sys
    sys.path.insert(0, str(ROOT))
    from website.backend import dashboard_app as api
    out = APP/'dashboard'
    if out.exists():
        shutil.rmtree(out)
    shutil.copytree(ROOT/'website/frontend', out, ignore=shutil.ignore_patterns('__pycache__'))
    data = out/'data'
    rel = lambda text: text.replace('"/results/', '"data/results/').replace('"/static/', '"static/')

    def save(path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(rel(json.dumps(value)), encoding='utf-8')

    save(data/'api/overview.json', api.overview())
    for task in ['classification', 'regression', 'clustering']:
        save(data/f'api/{task}.json', api.task_results(task))
        (data/'downloads').mkdir(parents=True, exist_ok=True)
        (data/f'downloads/{task}.csv').write_bytes(api.download(task).body)
    save(data/'api/predict/schema.json', api.predict_schema())
    run = report['meta']['run_id']
    for path in (SRC/'artifacts/runs'/run/'interactive').glob('*.json'):
        target = data/'api/explore'/path.name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(rel(path.read_text(encoding='utf-8')), encoding='utf-8')
    for png in (SRC/'artifacts/runs'/run/'plots').glob('*.png'):
        copy(png, data/'results'/run/'plots'/png.name)
    for tree in (out/'static/trees').rglob('*.json'):
        tree.write_text(rel(tree.read_text(encoding='utf-8')), encoding='utf-8')
    page = (out/'index.html').read_text(encoding='utf-8')
    page = page.replace('"/static/', '"static/').replace('<a href="/docs" target="_blank" rel="noopener">API documentation ↗</a>', '')
    page = page.replace('<script src="static/plotly.min.js">', '<script src="static/bridge.js?v=9"></script><script src="static/plotly.min.js">')
    (out/'index.html').write_text(page, encoding='utf-8')
    app = (out/'static/app.js').read_text(encoding='utf-8')
    (out/'static/app.js').write_text(app.replace('"/downloads/${page}.csv', '"data/downloads/${page}.csv'), encoding='utf-8')
    shutil.copy2(APP/'bridge.js', out/'static/bridge.js')


def segments():
    """Profile each K-Means segment with the real outcomes and durations of the training cases in it."""
    source = ROOT/'notebooks/executed/artifacts/kmeans_model.pkl'
    if not source.is_file():
        source = ROOT/'models/kmeans_model.pkl'
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        model = joblib.load(source)
        data = joblib.load(ROOT/'data/processed/model_ready_data.pkl')
    labels = model.predict(np.asarray(data['X_train_final'], dtype=float))
    frame = pd.DataFrame({'segment': labels, 'outcome': np.asarray(data['y_clf_train']),
                          'days': np.asarray(data['y_reg_train'], dtype=float)})
    profiles = []
    for seg, group in frame.groupby('segment'):
        share = group['outcome'].value_counts(normalize=True)
        profiles.append(dict(segment=int(seg), cases=int(len(group)), share=float(len(group)/len(frame)),
                             median_days=float(group['days'].median()), mean_days=float(group['days'].mean()),
                             outcomes={k: float(v) for k, v in share.items()}))
    copy(source, OUT/'models/kmeans_segments.pkl')
    (OUT/'segments.json').write_text(json.dumps(dict(k=int(model.n_clusters), source=str(source.relative_to(ROOT)).replace('\\', '/'),
                                     training_cases=int(len(frame)), profiles=profiles), indent=1), encoding='utf-8')


if __name__ == '__main__':
    main()
