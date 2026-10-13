"""Export bounded-depth views of the actual fitted decision trees and forests."""
from pathlib import Path
import json
import joblib
import numpy as np

def export(root):
    base=root/'website/backend/artifacts'
    report=json.loads((base/'dashboard.json').read_text(encoding='utf-8'))
    run=report['meta']['run_id']
    for task in ['classification','regression']:
        for row in report[task]['models']:
            if not row['name'].startswith(('Decision Tree','Random Forest')):continue
            model=joblib.load(base/'runs'/run/'models'/(row['id']+'.joblib'))
            trees=model.estimators_ if hasattr(model,'estimators_') else [model]
            folder=root/'website/frontend/static/trees'/run/row['id']
            folder.mkdir(parents=True,exist_ok=True)
            classes=[str(c) for c in model.classes_] if task=='classification' else []
            for number,estimator in enumerate(trees):
                tree=estimator.tree_;nodes=[]
                def visit(i,depth):
                    value=tree.value[i].reshape(-1);leaf=tree.children_left[i]<0
                    probabilities=(value/value.sum()).tolist() if classes and value.sum() else []
                    nodes.append(dict(id=int(i),depth=depth,left=int(tree.children_left[i]),right=int(tree.children_right[i]),
                        feature=f'PC{tree.feature[i]+1}' if not leaf else None,threshold=float(tree.threshold[i]) if not leaf else None,
                        leaf=bool(leaf),samples=int(tree.n_node_samples[i]),weighted_samples=float(tree.weighted_n_node_samples[i]),
                        impurity=float(tree.impurity[i]),prediction=classes[int(np.argmax(value))] if classes else float(value[0]),probabilities=probabilities))
                    if not leaf and depth<6:
                        visit(tree.children_left[i],depth+1);visit(tree.children_right[i],depth+1)
                visit(0,0)
                (folder/f'{number}.json').write_text(json.dumps(dict(nodes=nodes,classes=classes,task=task,
                    tree_index=number,node_count=int(tree.node_count),max_depth=int(tree.max_depth),criterion=estimator.criterion),allow_nan=False),encoding='utf-8')
            path=base/'runs'/run/'interactive'/(row['id']+'.json')
            data=json.loads(path.read_text(encoding='utf-8'))
            data['tree_view']=dict(count=len(trees),max_display_depth=6,url=f'/static/trees/{run}/{row["id"]}/',forest=len(trees)>1)
            temp=path.with_suffix('.tmp');temp.write_text(json.dumps(data,allow_nan=False),encoding='utf-8');temp.replace(path)
            print(row['name'],len(trees),'tree views exported',flush=True)

if __name__=='__main__':export(Path(__file__).resolve().parents[1])
