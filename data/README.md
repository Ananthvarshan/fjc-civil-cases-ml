# Data Directory Overview

This directory contains dataset tools and files for the **FJC Integrated Database (IDB) — U.S. Federal Court Civil Cases** project.

## Dataset Information
- **Title**: FJC Integrated Database (IDB) — U.S. Federal Court Civil Cases
- **Official URL**: https://www.fjc.gov/sites/default/files/idb/datasets/cv23.sas7bdat
- **Format**: SAS Dataset (`.sas7bdat`) / Processed Pickle (`.pkl`)

## Contents
- `download_data.py`: Automated Python script to download `cv23.sas7bdat` directly from FJC.
- `cv23.sas7bdat`: Raw SAS data file.
- `processed/model_ready_data.pkl`: Feature matrix ready for ML models.
