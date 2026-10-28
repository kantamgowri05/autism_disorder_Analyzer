import os
import sys
import json
import zipfile
import io
import urllib.request
import pandas as pd
from pathlib import Path

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path("D:/projects/asd-decision-client")
DATA_DIR = BASE_DIR / "data" / "raw"
DATA_DIR.mkdir(parents=True, exist_ok=True)

def download_uci():
    print("[1/4] Downloading UCI Datasets (426, 419, 420)...")
    from ucimlrepo import fetch_ucirepo

    # UCI 426 (Adult)
    try:
        ds_426 = fetch_ucirepo(id=426)
        df_426 = pd.concat([ds_426.data.features, ds_426.data.targets], axis=1)
        out_dir = DATA_DIR / "uci_426_adult"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "uci_426_adult.csv"
        df_426.to_csv(out_path, index=False)
        print(f"  [OK] UCI 426 Adult downloaded: {df_426.shape}")
    except Exception as e:
        print(f"  [FAIL] UCI 426 Error: {e}")

    # UCI 419 (Children)
    try:
        ds_419 = fetch_ucirepo(id=419)
        df_419 = pd.concat([ds_419.data.features, ds_419.data.targets], axis=1)
        out_dir = DATA_DIR / "uci_419_children"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "uci_419_children.csv"
        df_419.to_csv(out_path, index=False)
        print(f"  [OK] UCI 419 Children downloaded: {df_419.shape}")
    except Exception as e:
        print(f"  [FAIL] UCI 419 Error: {e}")

    # UCI 420 (Adolescent)
    out_dir_420 = DATA_DIR / "uci_420_adolescent"
    out_dir_420.mkdir(parents=True, exist_ok=True)
    out_420 = out_dir_420 / "Autism-Adolescent-Data.csv"
    try:
        # Fallback to direct UCI public zip as 420 is not enabled on ucimlrepo API
        url_420 = "https://archive.ics.uci.edu/static/public/420/autistic+spectrum+disorder+screening+data+for+adolescent.zip"
        req = urllib.request.Request(url_420, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req)
        z = zipfile.ZipFile(io.BytesIO(resp.read()))
        # Extract and parse ARFF
        arff_content = z.read("Autism-Adolescent-Data.arff").decode("utf-8", errors="ignore")
        lines = arff_content.splitlines()
        cols, data, read_data = [], [], False
        for l in lines:
            l = l.strip()
            if not l or l.startswith("%"): continue
            if l.lower().startswith("@attribute"):
                cols.append(l.split()[1].strip("'\""))
            elif l.lower().startswith("@data"):
                read_data = True
            elif read_data:
                data.append([v.strip("'\"") for v in l.split(",")])
        df_420 = pd.DataFrame(data, columns=cols)
        df_420.to_csv(out_420, index=False)
        print(f"  [OK] UCI 420 Adolescent downloaded via UCI Archive: {df_420.shape}")
    except Exception as e:
        print(f"  [FAIL] UCI 420 Error: {e}")

def setup_kaggle():
    kaggle_home = Path.home() / ".kaggle"
    kaggle_json = kaggle_home / "kaggle.json"
    access_token = kaggle_home / "access_token"

    if kaggle_json.exists():
        print(f"  Found ~/.kaggle/kaggle.json")
    elif access_token.exists():
        token = access_token.read_text().strip()
        os.environ["KAGGLE_API_TOKEN"] = token
        print(f"  Read token from ~/.kaggle/access_token")
    else:
        print("  Warning: No Kaggle credentials file found in ~/.kaggle")

def download_kaggle_toddler():
    print("[2/4] Downloading Kaggle Toddler Dataset...")
    setup_kaggle()
    from kaggle.api.kaggle_api_extended import KaggleApi
    api = KaggleApi()
    api.authenticate()

    slug = "fabdelja/autism-screening-for-toddlers"
    target_dir = DATA_DIR / "kaggle_toddler"
    target_dir.mkdir(parents=True, exist_ok=True)

    try:
        api.dataset_download_files(slug, path=str(target_dir), unzip=True)
        print(f"  [OK] Downloaded Kaggle toddler dataset using slug: '{slug}'")
    except Exception as e:
        print(f"  Primary slug failed: {e}. Searching Kaggle for 'Autism Screening for Toddlers'...")
        results = api.dataset_list(search="Autism Screening for Toddlers")
        if results:
            real_slug = results[0].ref
            print(f"  Found matching slug: '{real_slug}'. Retrying download...")
            api.dataset_download_files(real_slug, path=str(target_dir), unzip=True)
            print(f"  [OK] Successfully downloaded using real slug: '{real_slug}'")
        else:
            print("  [FAIL] Could not find a matching toddler dataset on Kaggle.")

def copy_additional_multimodal():
    print("[3/4] Organizing Multimodal Datasets (Facial Images, Eye-tracking)...")
    import shutil
    src_facial = BASE_DIR / "datasets" / "facial_images"
    dest_facial = DATA_DIR / "facial_images"
    if src_facial.exists() and not dest_facial.exists():
        shutil.copytree(src_facial, dest_facial)
        print("  [OK] Facial images organized into data/raw/facial_images")
    elif dest_facial.exists():
        print("  [OK] Facial images already in data/raw/facial_images")

    src_eye = BASE_DIR / "datasets" / "eye_tracking"
    dest_eye = DATA_DIR / "eye_tracking"
    if src_eye.exists() and not dest_eye.exists():
        shutil.copytree(src_eye, dest_eye)
        print("  [OK] Eye-tracking data organized into data/raw/eye_tracking")
    elif dest_eye.exists():
        print("  [OK] Eye-tracking data already in data/raw/eye_tracking")

if __name__ == "__main__":
    download_uci()
    download_kaggle_toddler()
    copy_additional_multimodal()
    print("[DONE] Dataset download routine completed.")
