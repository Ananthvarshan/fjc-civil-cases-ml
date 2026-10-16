"""Export the fitted scaler, encoder and PCA so the website can score new cases.

Reads data/processed/model_ready_data.pkl (from notebooks/preprocessing.ipynb) and writes a
small website/backend/artifacts/predictor/preprocess.joblib. No model is trained here.
Run with --verify to check that raw cases from data/cv23.sas7bdat reproduce X_test_final.
"""
from pathlib import Path
import argparse
import sys
import warnings

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT/'data/processed/model_ready_data.pkl'
TARGET = ROOT/'website/backend/artifacts/predictor/preprocess.joblib'


def export():
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        data = joblib.load(SOURCE)
    keep = {k: data[k] for k in ['scaler', 'encoder', 'pca', 'numeric_cols', 'categorical_cols', 'pc_columns']}
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(keep, TARGET)
    print(f'Wrote {TARGET.relative_to(ROOT)}')
    export_notebook_classifier(data)
    return data


def export_notebook_classifier(data):
    """Score the full-data classifiers saved from the notebook on the full test set.

    models/best_classifier.pkl (the notebook's winner) and models/single_layer_perceptron.pkl
    (scripts/train_perceptron.py). Each entry also records the network's layer sizes for the diagram.
    """
    import json
    from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
    out = TARGET.parent/'notebook_models.json'
    X = np.asarray(data['X_test_final'], dtype=float); y = np.asarray(data['y_clf_test'])
    entries = []
    for model_id, rel, label in [('classification_notebook', 'models/best_classifier.pkl', '(notebook, full data)'),
                                 ('classification_perceptron', 'models/single_layer_perceptron.pkl', '')]:
        path = ROOT/rel
        if not path.is_file():
            continue
        with path.open('rb') as stream:
            if stream.read(80).startswith(b'version https://git-lfs'):
                continue
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            model = joblib.load(path)
            pred = model.predict(X)
            proba = model.predict_proba(X) if hasattr(model, 'predict_proba') else softmax(model.decision_function(X))
        test = dict(accuracy=accuracy_score(y, pred), precision=precision_score(y, pred, average='weighted', zero_division=0),
                    recall=recall_score(y, pred, average='weighted', zero_division=0),
                    f1=f1_score(y, pred, average='weighted', zero_division=0),
                    roc_auc=roc_auc_score(y, proba, multi_class='ovr', average='weighted', labels=model.classes_))
        hidden = list(getattr(model, 'hidden_layer_sizes', ())) if hasattr(model, 'coefs_') else []
        name = 'Single-Layer Perceptron' if not hasattr(model, 'coefs_') else \
            type(model).__name__.replace('Classifier', ' Classifier') + ' ' + saved_label(label)
        entries.append(dict(id=model_id, name=name.strip(), path=rel, test=test, test_rows=len(y),
                            layers=[X.shape[1], *hidden, len(model.classes_)]))
        print(f'Scored {name.strip()} on {len(y)} test rows: accuracy {test["accuracy"]:.4f}, F1 {test["f1"]:.4f}')
    out.write_text(json.dumps(entries, indent=1))


def saved_label(default):
    """'(tuned, full data)' when the notebook's final pick (notebook_results.json) is a tuned model."""
    import json
    try:
        best = json.loads((TARGET.parent.parent/'notebook_results.json').read_text(encoding='utf-8'))['classification']['best']
    except (OSError, ValueError, KeyError):
        return default
    return '(tuned, full data)' if best.endswith('(Tuned)') else default


def softmax(scores):
    z = np.exp(scores - scores.max(axis=1, keepdims=True))
    return z/z.sum(axis=1, keepdims=True)


def verify(data, rows=2000):
    """Rebuild features from raw SAS rows exactly as the preprocessing notebook does."""
    import pandas as pd
    sys.path.insert(0, str(ROOT))
    from website.backend import predictor
    raw = pd.read_sas(ROOT/'data/cv23.sas7bdat', encoding='latin-1')
    expected = data['X_test_final'].iloc[:rows]
    df = raw.loc[expected.index]
    worst = 0.0
    for (_, r), (_, want) in zip(df.iterrows(), expected.iterrows()):
        case = dict(
            district=r['DISTRICT'], origin=int(r['ORIGIN']), juris=int(r['JURIS']),
            nos_group=_nos_group(r['NOS']), jury=r['JURY'], demanded=float(r['DEMANDED']),
            residenc=0 if r['RESIDENC'] == -8 else int(r['RESIDENC']),
            classact=int(r['CLASSACT'] == 1), prose=int(r['PROSE']),
            ifp=int(str(r['IFP']) == 'FP'), procprog=int(r['PROCPROG']),
            filing_month=int(pd.to_datetime(r['FILEDATE']).month))
        got = predictor.features(predictor.normalise(case))[0]
        worst = max(worst, float(np.abs(got - want.to_numpy()).max()))
    print(f'Verified {len(df)} test rows; largest feature difference {worst:.2e}')
    if worst > 1e-6:
        raise SystemExit('Website preprocessing does not reproduce the notebook features.')


def _nos_group(code):
    c = int(code)
    if 110 <= c <= 196: return 'Contract'
    if 310 <= c <= 368: return 'Torts - Personal Injury'
    if 440 <= c <= 448: return 'Civil Rights'
    if c in (450, 460, 462, 463, 465): return 'Immigration'
    if c in (510, 530, 535, 540, 550, 555, 560): return 'Prisoner Petitions'
    if c in (710, 720, 740, 751, 790, 791): return 'Labor'
    if c in (820, 830, 835, 840): return 'Intellectual Property'
    if 861 <= c <= 865: return 'Social Security'
    return 'Other'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify', action='store_true', help='compare against X_test_final using the raw SAS file')
    args = parser.parse_args()
    data = export()
    if args.verify:
        verify(data)
