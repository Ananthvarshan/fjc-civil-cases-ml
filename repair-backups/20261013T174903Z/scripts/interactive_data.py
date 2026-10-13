"""Export interactive chart coordinates from the exact models in a completed run."""
from pathlib import Path
import json
import shutil
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.decomposition import PCA
from sklearn.metrics import roc_curve
from threadpoolctl import threadpool_limits

def export(root):
    import plotly
    base=root/'website/backend/artifacts'
    report=json.loads((base/'dashboard.json').read_text(encoding='utf-8'))
    meta=report['meta']; seed=meta['seed']; run=base/'runs'/meta['run_id']
    out=run/'interactive';out.mkdir(exist_ok=True)
    prep=joblib.load(root/'data/processed/model_ready_data.pkl')
    X=np.asarray(prep['X_train_final']); T=np.asarray(prep['X_test_final'])
    yc=np.asarray(prep['y_clf_test']); yr=np.asarray(prep['y_reg_test'])
    ix=np.arange(len(T))
    if meta['test_rows']<len(ix):
        ix,_=train_test_split(ix,train_size=meta['test_rows'],stratify=yc,random_state=seed)
    sample=np.random.default_rng(seed).choice(len(ix),min(2000,len(ix)),replace=False)
    def save(mid,obj):
        temp=out/(mid+'.tmp');temp.write_text(json.dumps(obj,allow_nan=False),encoding='utf-8');temp.replace(out/(mid+'.json'))
    for task in ['classification','regression']:
        for item in report[task]['models']:
            mid=item['id']; model=joblib.load(run/'models'/(mid+'.joblib'))
            result={'id':mid,'run_id':meta['run_id'],'name':item['name'],'task':task}
            if task=='classification':
                proba=model.predict_proba(T[ix]); classes=model.classes_
                pred=np.argmax(proba,axis=1); truth=np.array([np.where(classes==y)[0][0] for y in yc[ix]])
                curves=[]
                for k,label in enumerate(classes):
                    fpr,tpr,_=roc_curve(truth==k,proba[:,k])
                    keep=np.unique(np.linspace(0,len(fpr)-1,min(400,len(fpr))).astype(int))
                    curves.append(dict(name=str(label),fpr=np.round(fpr[keep],5).tolist(),tpr=np.round(tpr[keep],5).tolist()))
                result.update(classes=classes.tolist(),truth=truth.tolist(),predicted=pred.tolist(),
                    confidence=np.max(proba,axis=1).round(6).tolist(),roc=curves,
                    sample_note=f'Confidence controls use all {len(ix):,} evaluated test cases. ROC curves are downsampled to at most 400 vertices per class.')
            else:
                pred=model.predict(T[ix[sample]])
                result.update(actual=yr[ix[sample]].round(4).tolist(),predicted=pred.round(4).tolist(),
                    row=ix[sample].tolist(),sample_note=f'Displayed predictions: {len(sample):,} deterministic test rows. Leaderboard metrics use all {len(ix):,} test rows.')
            if hasattr(model,'feature_importances_'):
                result['importance']=[dict(name=f'PC{i+1}',value=float(v)) for i,v in enumerate(model.feature_importances_)]
            if hasattr(model,'loss_curve_'):result['loss']=model.loss_curve_
            save(mid,result);print('Interactive:',item['name'],flush=True)
    rng=np.random.default_rng(seed);cluster_idx=rng.choice(len(X),meta['cluster_rows'],replace=False)
    cx=X[cluster_idx]; coords=PCA(n_components=3,random_state=seed).fit_transform(cx).round(5).tolist()
    for item in report['clustering']['models']:
        model=joblib.load(run/'models'/(item['id']+'.joblib'))
        labels=np.asarray(model.labels_)
        if len(labels)!=len(coords):raise ValueError('Saved cluster labels do not match the build sample')
        save(item['id'],dict(id=item['id'],run_id=meta['run_id'],name=item['name'],task='clustering',
            coords=coords,labels=labels.tolist(),sample_note=f'All {len(cx):,} fitted cluster rows. Projection changes only the visualization; clustering used all {cx.shape[1]} features.'))
    static=root/'website/frontend/static'
    shutil.copy2(Path(plotly.__file__).parent/'package_data/plotly.min.js',static/'plotly.min.js')
    print('Interactive data complete; Plotly served locally.',flush=True)

if __name__=='__main__':
    with threadpool_limits(limits=2):export(Path(__file__).resolve().parents[1])
