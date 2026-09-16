"""
Model Exporter & Serialization Utility
Trains baseline models on processed dataset and exports trained model objects (.pkl via joblib).
"""

import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "data", "processed", "model_ready_data.pkl")
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

def train_and_export():
    """Train baseline machine learning models and save to disk via joblib."""
    if not os.path.exists(DATA_PATH):
        print(f"[!] Processed data file not found at: {DATA_PATH}")
        return

    print(f"[i] Loading processed data from {DATA_PATH}...")
    df = pd.read_pickle(DATA_PATH)

    features = [c for c in df.columns if c not in ['DISP', 'PROC', 'TERMINAT', 'FILED', 'PENDING']]
    X = df[features].fillna(0)

    if 'DISP' in df.columns:
        print("[i] Training baseline RandomForestClassifier for Disposition (DISP)...")
        y_clf = df['DISP'].fillna(0).astype(int)
        X_train, X_test, y_train, y_test = train_test_split(X, y_clf, test_size=0.2, random_state=42)
        
        clf = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
        clf.fit(X_train, y_train)
        
        clf_path = os.path.join(MODEL_DIR, "classification_model.pkl")
        joblib.dump(clf, clf_path)
        print(f"[+] Saved Classification Model to: {clf_path}")

if __name__ == "__main__":
    train_and_export()
