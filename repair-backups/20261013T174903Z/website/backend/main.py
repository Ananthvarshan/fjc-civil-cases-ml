"""Read-only FastAPI dashboard; training is an explicit CLI build step."""
from pathlib import Path
import csv
import io
import json
import math
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

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
        'winners':{t:{'best':data[t]['best'],'selection':data[t]['selection']} for t in ['classification','regression','clustering']}}

@app.get('/api/{task}')
def task_results(task:str):
    if task not in ('classification','regression','clustering'): raise HTTPException(404,'Unknown task')
    data=report()
    return {**data[task],'meta':data['meta']}

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
