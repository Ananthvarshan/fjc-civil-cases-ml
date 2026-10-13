# FJC Integrated Database (IDB) — U.S. Federal Court Civil Cases Analysis

[![Python Version](https://img.shields.io/badge/python-3.9%2B-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Live website:** [fjc-civil-case-intelligence.streamlit.app](https://fjc-civil-case-intelligence.streamlit.app/)

An end-to-end Machine Learning research pipeline analyzing the **Federal Judicial Center (FJC) Integrated Database (IDB)** civil court litigation records. This project performs data extraction, encoding, litigation duration regression, and disposition classification.

---

## 📌 Dataset Overview

- **Dataset Name**: FJC Integrated Database (IDB) — U.S. Federal Court Civil Cases
- **Official Download URL**: [https://www.fjc.gov/sites/default/files/idb/datasets/cv23.sas7bdat](https://www.fjc.gov/sites/default/files/idb/datasets/cv23.sas7bdat)
- **Codebook Documentation**: `Civil Codebook 1988 Forward 10252023.pdf`
- **Machine Learning Overview Document**: `ML.pdf`

---

## 📂 Repository Structure

```
/ (root)
│── README.md                # Project overview, dataset information, setup instructions, and results
│── requirements.txt         # All Python dependencies with explicit versions
│── .gitignore               # Ignored binary files, checkpoints, and temporary caches
│── Civil Codebook 1988 Forward 10252023.pdf  # Official FJC Civil Codebook
│── ML.pdf                   # Machine Learning project overview & specification
│── data/
│   │── download_data.py     # Automated Python script to download raw cv23.sas7bdat dataset
│   │── README.md            # Dataset descriptions & processing pipeline details
│   └── processed/           # Directory storing model-ready dataset matrices (.pkl)
│── notebooks/
│   │── preprocessing.ipynb   # Data cleaning, missing value handling, categorical encoding, and feature engineering
│   │── regression.ipynb      # Machine Learning regression models for court case duration prediction
│   └── classification.ipynb  # Machine Learning classification models for case outcome/disposition prediction
└── models/
    │── README.md            # Model serialization & baseline summary documentation
    └── model_exporter.py    # Python utility to train & serialize baseline models (.pkl via joblib)
```

---

## 🚀 Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Ananthvarshan/fjc-civil-cases-ml.git
cd fjc-civil-cases-ml
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Download Dataset
Run the automated downloader script to fetch the raw dataset from FJC:
```bash
python data/download_data.py
```

---

## 📊 Machine Learning Pipeline

1. **Preprocessing (`notebooks/preprocessing.ipynb`)**:
   - Cleans raw SAS dataset (`cv23.sas7bdat`).
   - Handles missing values and performs feature selection based on FJC codebook definitions.
   - Saves clean matrix to `data/processed/model_ready_data.pkl`.

2. **Classification Models (`notebooks/classification.ipynb`)**:
   - Predicts case outcomes and judgment dispositions (`DISP`).
   - Implements Random Forest, Logistic Regression, and XGBoost classifiers.

3. **Regression Models (`notebooks/regression.ipynb`)**:
   - Models total case pending time and litigation duration.
   - Evaluates performance using RMSE, MAE, and $R^2$ metrics.

---

## 👤 Author & Maintainer
- **GitHub Username**: [Ananthvarshan](https://github.com/Ananthvarshan)

## 🖥️ FastAPI Dashboard

After restoring the Git LFS artifacts and installing the dependencies, generate the
dashboard data and launch the FastAPI web UI:

```bash
python notebooks/export_artifacts.py
python -m uvicorn website.backend.main:app --reload
```

Open `http://127.0.0.1:8000` in a browser. The dashboard provides separate Overview,
Classification, Regression, and Clustering pages. It displays model metrics,
comparison tables, diagnostic graphs, and the best model/configuration for each task.
Classification is ranked by weighted F1, regression by test R², and clustering by
silhouette score.
