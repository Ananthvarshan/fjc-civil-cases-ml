"""Build real, reproducible dashboard results from the prepared feature matrices."""
from pathlib import Path
import argparse
import json
import time
import warnings
from datetime import datetime, timezone

import joblib
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from sklearn.base import clone
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LogisticRegression, LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.naive_bayes import GaussianNB
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from sklearn.ensemble import (RandomForestClassifier, RandomForestRegressor,
    GradientBoostingClassifier, GradientBoostingRegressor, AdaBoostClassifier, BaggingClassifier)
from sklearn.neural_network import MLPClassifier
from sklearn.svm import SVC, SVR
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.decomposition import PCA
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, confusion_matrix, ConfusionMatrixDisplay,
    r2_score, mean_squared_error, mean_absolute_error, silhouette_score,
    davies_bouldin_score, calinski_harabasz_score)
from scipy.cluster.hierarchy import dendrogram, linkage
from threadpoolctl import threadpool_limits

ROOT = Path(__file__).resolve().parents[1]
SEED = 42

def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(value, indent=2, allow_nan=False), encoding='utf-8')
    temp.replace(path)

def finite(value):
    value = float(value)
    return value if np.isfinite(value) else None

def clf_scores(y, pred, proba, classes):
    return dict(accuracy=finite(accuracy_score(y,pred)),
        precision=finite(precision_score(y,pred,average='weighted',zero_division=0)),
        recall=finite(recall_score(y,pred,average='weighted',zero_division=0)),
        f1=finite(f1_score(y,pred,average='weighted',zero_division=0)),
        roc_auc=finite(roc_auc_score(y,proba,multi_class='ovr',average='weighted',labels=classes)))

def reg_scores(y, pred):
    return dict(r2=finite(r2_score(y,pred)), rmse=finite(np.sqrt(mean_squared_error(y,pred))),
                mae=finite(mean_absolute_error(y,pred)))

def build(args):
    import sklearn
    run_id = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    base = ROOT/'website/backend/artifacts'
    out = base/'runs'/run_id
    plots = out/'plots'
    plots.mkdir(parents=True)
    models_dir=out/'models'
    models_dir.mkdir()
    source = ROOT/'data/processed/model_ready_data.pkl'
    with source.open('rb') as stream:
        if stream.read(80).startswith(b'version https://git-lfs'):
            raise RuntimeError('Prepared data is an unresolved Git LFS pointer.')
    data = joblib.load(source)
    X = np.asarray(data['X_train_final'],dtype=float)
    T = np.asarray(data['X_test_final'],dtype=float)
    yc=np.asarray(data['y_clf_train']); yt=np.asarray(data['y_clf_test'])
    yr=np.asarray(data['y_reg_train'],dtype=float); yrt=np.asarray(data['y_reg_test'],dtype=float)
    if not all(np.isfinite(a).all() for a in [X,T,yr,yrt]):
        raise ValueError('Prepared features/targets contain non-finite values.')
    idx=np.arange(len(X)); test_idx=np.arange(len(T))
    if args.train_rows and args.train_rows<len(idx):
        idx,_=train_test_split(idx,train_size=args.train_rows,stratify=yc,random_state=SEED)
    train,val=train_test_split(idx,test_size=.2,stratify=yc[idx],random_state=SEED)
    if args.test_rows and args.test_rows<len(test_idx):
        test_idx,_=train_test_split(test_idx,train_size=args.test_rows,stratify=yt,random_state=SEED)
    xtr,xv,xt=X[train],X[val],T[test_idx]
    meta=dict(run_id=run_id,created_utc=datetime.now(timezone.utc).isoformat(),seed=SEED,
        sklearn=sklearn.__version__,training_rows=len(train),validation_rows=len(val),
        test_rows=len(test_idx),available_training_rows=len(X),available_test_rows=len(T),features=X.shape[1],
        source='data/processed/model_ready_data.pkl',
        note='Fresh fit on prepared PCA features. Shared train/validation/test rows within each task. Preprocessing was supplied by the project and was not refitted for this validation split.',
        errors=[])
    def figure(fig, filename):
        fig.tight_layout(); fig.savefig(plots/filename,dpi=115,bbox_inches='tight'); plt.close(fig)
        return f'/results/{run_id}/plots/{filename}'
    def comparison(rows, task, key):
        fig,ax=plt.subplots(figsize=(10,6))
        valid=[r for r in rows if r.get('validation',{}).get(key) is not None]
        valid.sort(key=lambda r:r['validation'][key])
        ax.barh([r['name'] for r in valid],[r['validation'][key] for r in valid],color='#357b83')
        ax.set_xlabel('Validation '+key.upper()); ax.set_title(task+' — all models')
        return figure(fig,task.lower()+'_comparison.png')
    classifiers={
        'Logistic Regression':LogisticRegression(max_iter=1500,class_weight='balanced',random_state=SEED),
        'KNN Classifier':KNeighborsClassifier(n_neighbors=15,n_jobs=2),
        'Gaussian Naive Bayes':GaussianNB(),
        'Decision Tree Classifier':DecisionTreeClassifier(max_depth=15,min_samples_leaf=5,class_weight='balanced',random_state=SEED),
        'SVC':SVC(probability=True,class_weight='balanced',random_state=SEED),
        'Random Forest Classifier':RandomForestClassifier(n_estimators=100,max_depth=15,class_weight='balanced',n_jobs=2,random_state=SEED),
        'AdaBoost Classifier':AdaBoostClassifier(n_estimators=60,random_state=SEED),
        'Gradient Boosting Classifier':GradientBoostingClassifier(n_estimators=80,max_depth=2,random_state=SEED),
        'Bagging Classifier':BaggingClassifier(estimator=DecisionTreeClassifier(max_depth=15,class_weight='balanced'),n_estimators=40,n_jobs=2,random_state=SEED),
        'MLP Classifier':MLPClassifier(hidden_layer_sizes=(64,32),max_iter=300,early_stopping=True,random_state=SEED)}
    regressors={
        'Linear Regression':LinearRegression(), 'Ridge Regression':Ridge(alpha=10),
        'Lasso Regression':Lasso(alpha=.01,max_iter=3000),
        'ElasticNet Regression':ElasticNet(alpha=.1,max_iter=3000),
        'Polynomial Regression (degree 2)':make_pipeline(PolynomialFeatures(2,include_bias=False),Ridge(alpha=10)),
        'Decision Tree Regressor':DecisionTreeRegressor(max_depth=15,min_samples_leaf=5,random_state=SEED),
        'Random Forest Regressor':RandomForestRegressor(n_estimators=100,max_depth=15,min_samples_leaf=5,n_jobs=2,random_state=SEED),
        'Gradient Boosting Regressor':GradientBoostingRegressor(n_estimators=100,max_depth=3,random_state=SEED),
        'SVR':SVR(), 'KNN Regressor':KNeighborsRegressor(n_neighbors=15,n_jobs=2)}
    reports={}
    for task,candidates in [('classification',classifiers),('regression',regressors)]:
        rows=[]
        for i,(name,model) in enumerate(candidates.items()):
            print(f'{task}: {name}',flush=True)
            mid=f'{task}_{i}'
            try:
                start=time.perf_counter()
                with warnings.catch_warnings(record=True) as caught:
                    warnings.simplefilter('always')
                    model.fit(xtr,yc[train] if task=='classification' else yr[train])
                fit=time.perf_counter()-start
                vp=model.predict(xv); pred=model.predict(xt)
                row=dict(id=mid,name=name,fit_seconds=fit,plots=[],warnings=sorted(set(str(w.message) for w in caught)))
                if task=='classification':
                    classes=model.classes_; proba=model.predict_proba(xt)
                    row['validation']=clf_scores(yc[val],vp,model.predict_proba(xv),classes)
                    row['test']=clf_scores(yt[test_idx],pred,proba,classes)
                    fig,ax=plt.subplots(figsize=(7,6))
                    ConfusionMatrixDisplay.from_predictions(yt[test_idx],pred,labels=classes,ax=ax,xticks_rotation=35,colorbar=False)
                    ax.set_title(name+' — test confusion matrix')
                    row['plots'].append(figure(fig,mid+'_confusion.png'))
                    fig,ax=plt.subplots(figsize=(7,5))
                    for col,label in enumerate(classes):
                        fpr,tpr,_=roc_curve(yt[test_idx]==label,proba[:,col])
                        ax.plot(fpr,tpr,label=str(label))
                    ax.plot([0,1],[0,1],'k--'); ax.legend(fontsize=8)
                    ax.set(xlabel='False positive rate',ylabel='True positive rate',title=name+' — test ROC, one vs rest')
                    row['plots'].append(figure(fig,mid+'_roc.png'))
                    row['class_names']=classes.tolist()
                    row['confusion_matrix']=confusion_matrix(yt[test_idx],pred,labels=classes).tolist()
                else:
                    row['validation']=reg_scores(yr[val],vp); row['test']=reg_scores(yrt[test_idx],pred)
                    fig,axes=plt.subplots(1,2,figsize=(12,4))
                    actual=yrt[test_idx]; sub=np.random.default_rng(SEED).choice(len(pred),min(2000,len(pred)),replace=False)
                    axes[0].scatter(actual[sub],pred[sub],s=6,alpha=.3)
                    lo=min(actual[sub].min(),pred[sub].min()); hi=max(actual[sub].max(),pred[sub].max())
                    axes[0].plot([lo,hi],[lo,hi],'r--'); axes[0].set(xlabel='Actual days',ylabel='Predicted days',title=name)
                    axes[1].scatter(pred[sub],actual[sub]-pred[sub],s=6,alpha=.3)
                    axes[1].axhline(0,color='red',linestyle='--'); axes[1].set(xlabel='Predicted days',ylabel='Residual days',title='Test residuals')
                    row['plots'].append(figure(fig,mid+'_diagnostics.png'))
                if hasattr(model,'feature_importances_'):
                    imp=model.feature_importances_; order=np.argsort(imp)[-15:]
                    fig,ax=plt.subplots(figsize=(7,5)); ax.barh([f'PC{x+1}' for x in order],imp[order]); ax.set_title(name+' — component importance')
                    row['plots'].append(figure(fig,mid+'_importance.png'))
                if hasattr(model,'loss_curve_'):
                    fig,ax=plt.subplots(); ax.plot(model.loss_curve_); ax.set(title='MLP training loss',xlabel='Iteration',ylabel='Loss')
                    row['plots'].append(figure(fig,mid+'_loss.png'))
                joblib.dump(model,models_dir/(mid+'.joblib'))
                rows.append(row)
            except Exception as exc:
                meta['errors'].append(dict(task=task,model=name,error=str(exc)))
                print(f'FAILED {name}: {exc}',flush=True)
        if not rows: raise RuntimeError(f'No {task} models completed')
        key='f1' if task=='classification' else 'rmse'
        rows.sort(key=lambda r:r['validation'][key],reverse=task=='classification')
        reports[task]=dict(available=True,models=rows,best=rows[0],
            selection='Highest validation weighted F1' if task=='classification' else 'Lowest validation RMSE',
            plots=[comparison(rows,task,key)])
    rng=np.random.default_rng(SEED)
    cx=X[rng.choice(len(X),min(args.cluster_rows,len(X)),replace=False)]
    score_idx=rng.choice(len(cx),min(1500,len(cx)),replace=False)
    coords=PCA(2,random_state=SEED).fit_transform(cx)
    meta['cluster_rows']=len(cx); meta['cluster_scoring_rows']=len(score_idx)
    cluster_rows=[]
    for algorithm in ['K-Means','Agglomerative (Ward)']:
        for k in range(2,9):
            print(f'clustering: {algorithm} k={k}',flush=True)
            if algorithm=='K-Means': model=KMeans(n_clusters=k,n_init=10,random_state=SEED)
            else: model=AgglomerativeClustering(n_clusters=k,linkage='ward')
            start=time.perf_counter(); labels=model.fit_predict(cx)
            score_labels=labels[score_idx]
            scores=dict(silhouette=finite(silhouette_score(cx[score_idx],score_labels)),
                davies_bouldin=finite(davies_bouldin_score(cx[score_idx],score_labels)),
                calinski_harabasz=finite(calinski_harabasz_score(cx[score_idx],score_labels)))
            mid=f'cluster_{len(cluster_rows)}'
            fig,ax=plt.subplots(figsize=(7,5)); ax.scatter(coords[:,0],coords[:,1],c=labels,cmap='tab10',s=7,alpha=.5)
            ax.set(title=f'{algorithm}, k={k}',xlabel='Projection 1',ylabel='Projection 2')
            row=dict(id=mid,name=f'{algorithm} (k={k})',algorithm=algorithm,k=k,metrics=scores,
                fit_seconds=time.perf_counter()-start,cluster_sizes=np.bincount(labels).tolist(),
                plots=[figure(fig,mid+'.png')],inertia=finite(model.inertia_) if hasattr(model,'inertia_') else None)
            joblib.dump(model,models_dir/(mid+'.joblib')); cluster_rows.append(row)
    cluster_rows.sort(key=lambda r:(-r['metrics']['silhouette'],r['metrics']['davies_bouldin']))
    fig,ax=plt.subplots(figsize=(8,5))
    for algorithm in ['K-Means','Agglomerative (Ward)']:
        group=sorted([r for r in cluster_rows if r['algorithm']==algorithm],key=lambda r:r['k'])
        ax.plot([r['k'] for r in group],[r['metrics']['silhouette'] for r in group],marker='o',label=algorithm)
    ax.set(xlabel='k',ylabel='Silhouette score',title='Shared scoring sample'); ax.legend()
    cluster_plots=[figure(fig,'cluster_comparison.png')]
    fig,ax=plt.subplots(figsize=(8,5))
    for algorithm in ['K-Means']:
        group=sorted([r for r in cluster_rows if r['algorithm']==algorithm],key=lambda r:r['k'])
        ax.plot([r['k'] for r in group],[r['inertia'] for r in group],marker='o',label=algorithm)
    ax.set(xlabel='k',ylabel='Inertia',title='Elbow curves'); ax.legend(); cluster_plots.append(figure(fig,'cluster_elbow.png'))
    fig,ax=plt.subplots(figsize=(10,5)); dendrogram(linkage(cx[:min(500,len(cx))],method='ward'),truncate_mode='lastp',p=25,ax=ax)
    ax.set_title('Ward dendrogram — first 500 rows of cluster sample'); cluster_plots.append(figure(fig,'cluster_dendrogram.png'))
    reports['clustering']=dict(available=True,models=cluster_rows,best=cluster_rows[0],plots=cluster_plots,
        selection='Highest silhouette on the shared scoring sample; tie-break: lowest Davies–Bouldin. Internal separation, not predictive accuracy.')
    reports['meta']=meta
    save_json(out/'report.json',reports)
    # Only publish a complete run. A failed rebuild leaves the last successful run visible.
    save_json(base/'dashboard.json',reports)
    import runpy
    runpy.run_path(str(Path(__file__).with_name('interactive_data.py')),run_name='__main__')
    print(f'BUILD COMPLETE: {len(reports["classification"]["models"])} classifiers, {len(reports["regression"]["models"])} regressors, {len(cluster_rows)} cluster configurations',flush=True)
    print(json.dumps({t:reports[t]['best']['name'] for t in ['classification','regression','clustering']}),flush=True)
    if meta['errors']: raise RuntimeError('Build published with model errors; see dashboard metadata.')

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--train-rows',type=int,default=12000,help='0 uses all prepared training rows')
    parser.add_argument('--test-rows',type=int,default=10000,help='0 uses all prepared test rows')
    parser.add_argument('--cluster-rows',type=int,default=3000)
    args=parser.parse_args()
    with threadpool_limits(limits=2): build(args)
