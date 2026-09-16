"""
FJC Integrated Database (IDB) - Dataset Downloader
Download script for U.S. Federal Court Civil Cases dataset (cv23.sas7bdat).
URL: https://www.fjc.gov/sites/default/files/idb/datasets/cv23.sas7bdat
"""

import os
import sys
import requests
from tqdm import tqdm

DATASET_URL = "https://www.fjc.gov/sites/default/files/idb/datasets/cv23.sas7bdat"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "cv23.sas7bdat")

def download_dataset():
    """Download civil cases dataset from FJC website with progress tracking."""
    if os.path.exists(OUTPUT_FILE):
        print(f"[+] Dataset already exists at: {OUTPUT_FILE}")
        print(f"    File size: {os.path.getsize(OUTPUT_FILE) / (1024 * 1024):.2f} MB")
        return OUTPUT_FILE

    print(f"[i] Downloading FJC IDB dataset from:\n    {DATASET_URL}")
    print(f"[i] Saving to:\n    {OUTPUT_FILE}")

    try:
        response = requests.get(DATASET_URL, stream=True, timeout=60)
        response.raise_for_status()
        total_size = int(response.headers.get('content-length', 0))

        block_size = 1024 * 1024
        progress_bar = tqdm(total=total_size, unit='iB', unit_scale=True, desc="Downloading cv23.sas7bdat")

        with open(OUTPUT_FILE, 'wb') as file:
            for data in response.iter_content(block_size):
                progress_bar.update(len(data))
                file.write(data)

        progress_bar.close()
        print(f"\n[+] Download complete: {os.path.getsize(OUTPUT_FILE) / (1024 * 1024):.2f} MB")
        return OUTPUT_FILE

    except Exception as e:
        print(f"[!] Download error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    download_dataset()
