# Models Directory

This directory contains model serialization scripts (`model_exporter.py`) and saved model artifacts (`.pkl` via `joblib`) for the **FJC Integrated Database (IDB) — U.S. Federal Court Civil Cases** project.

## Directory Structure
- `model_exporter.py`: Python script to train and save baseline ML models.
- `classification_model.pkl`: Serialized Random Forest Classifier for case outcome disposition.

## Loading Models
```python
import joblib
model = joblib.load("models/classification_model.pkl")
```
