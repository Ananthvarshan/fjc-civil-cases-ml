"""Read-only FastAPI dashboard; training is an explicit CLI build step."""
from pathlib import Path
import csv
import io
import json
import math
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
import re
from pydantic import BaseModel

ROOT=Path(__file__).resolve().parents[2]
ARTIFACTS=ROOT/'website/backend/artifacts'
FRONTEND=ROOT/'website/frontend'
app=FastAPI(title='FJC Model Observatory',version='2.0.0')
app.mount('/static',StaticFiles(directory=FRONTEND/'static'),name='static')

def report():
    path=ARTIFACTS/'dashboard.json'
    if not path.exists():
        raise HTTPException(503,'Results have not been built. Run python scripts/build_dashboard.py.')
    try:
        value=json.loads(path.read_text(encoding='utf-8'),parse_constant=lambda _:None)
        if not isinstance(value,dict) or not all(t in value for t in ['meta','classification','regression','clustering']):
            raise ValueError('Incomplete result report')
        return value
    except (ValueError,OSError) as exc:
        raise HTTPException(503,'The result report is invalid; rebuild results.') from exc

def full_results():
    path=ARTIFACTS/'notebook_results.json'
    try: return json.loads(path.read_text(encoding='utf-8')) if path.is_file() else None
    except (ValueError,OSError): return None

@app.get('/',include_in_schema=False)
def home(): return FileResponse(FRONTEND/'index.html')

@app.get('/api/health')
def health():
    try:
        data=report()
        return {'status':'ok','results_ready':True,'run_id':data['meta']['run_id']}
    except HTTPException:
        return {'status':'ok','results_ready':False}

@app.get('/api/overview')
def overview():
    data=report()
    return {'meta':data['meta'],'counts':{t:len(data[t]['models']) for t in ['classification','regression','clustering']},
        'winners':{t:{'best':data[t]['best'],'selection':data[t]['selection']} for t in ['classification','regression','clustering']},
        'full':full_results()}

@app.get('/api/predict/schema')
def predict_schema():
    from . import predictor
    data=report()
    models={t:{'best':data[t]['best']['id'],'models':[{'id':m['id'],'name':m['name'],'test':m.get('test',{})} for m in data[t]['models']]}
        for t in ('classification','regression')}
    saved=predictor.notebook_models()
    if saved:
        models['classification']['models']=saved+models['classification']['models']
        models['classification']['best']=saved[0]['id']
    return {**predictor.schema(),'models':models,'classes':data['classification']['best'].get('class_names',[]),'run_id':data['meta']['run_id']}

class PredictRequest(BaseModel):
    task:str
    model_id:str
    inputs:dict

@app.post('/api/predict')
def predict(body:PredictRequest):
    from . import predictor
    if body.task not in ('classification','regression'): raise HTTPException(404,'Unknown task')
    data=report()
    models=data[body.task]['models']
    if body.task=='classification': models=predictor.notebook_models()+models
    if not any(m['id']==body.model_id for m in models): raise HTTPException(404,'Unknown model')
    try:
        return predictor.predict(body.task,data['meta']['run_id'],models,body.model_id,body.inputs)
    except ValueError as exc:
        raise HTTPException(422,str(exc)) from exc
    except (FileNotFoundError,ImportError) as exc:
        raise HTTPException(503,str(exc)) from exc

@app.get('/api/{task}')
def task_results(task:str):
    if task not in ('classification','regression','clustering'): raise HTTPException(404,'Unknown task')
    data=report()
    full=full_results()
    return {**data[task],'meta':data['meta'],'full':{**full[task],'training_rows':full['training_rows'],'test_rows':full['test_rows']} if full else None}

@app.get('/api/explore/{model_id}')
def explore(model_id:str):
    if not re.fullmatch(r'(classification|regression|cluster)_\d+',model_id):
        raise HTTPException(404,'Unknown model')
    data=report()
    if not any(model_id==m['id'] for t in ('classification','regression','clustering') for m in data[t]['models']):
        raise HTTPException(404,'Unknown model')
    path=ARTIFACTS/'runs'/data['meta']['run_id']/'interactive'/(model_id+'.json')
    if not path.is_file():raise HTTPException(503,'Interactive data is being prepared. Refresh shortly.')
    return FileResponse(path,media_type='application/json',headers={'Cache-Control':'no-cache'})

@app.get('/downloads/{task}.csv')
def download(task:str):
    if task not in ('classification','regression','clustering'): raise HTTPException(404,'Unknown task')
    rows=[]
    for model in report()[task]['models']:
        row={'model':model['name'],'fit_seconds':model['fit_seconds']}
        for group in ['validation','test','metrics']:
            row.update({f'{group}_{key}':value for key,value in model.get(group,{}).items()})
        rows.append(row)
    stream=io.StringIO(); writer=csv.DictWriter(stream,fieldnames=list(rows[0]) if rows else ['model'])
    writer.writeheader(); writer.writerows(rows)
    return Response(stream.getvalue(),media_type='text/csv',headers={'Content-Disposition':f'attachment; filename="{task}.csv"'})

@app.get('/results/{run_id}/plots/{filename}',include_in_schema=False)
def plot(run_id:str,filename:str):
    base=(ARTIFACTS/'runs').resolve()
    path=(base/run_id/'plots'/filename).resolve()
    if not path.is_relative_to(base) or path.suffix.lower()!='.png' or path.parent.name!='plots' or not path.is_file():
        raise HTTPException(404,'Plot not found')
    return FileResponse(path)
