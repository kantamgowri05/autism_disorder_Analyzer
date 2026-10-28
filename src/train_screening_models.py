import os
import sys
import json
import joblib
from pathlib import Path
import numpy as np
import pandas as pd

from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score, f1_score

sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path("D:/projects/asd-decision-client")
DATA_DIR = BASE_DIR / "data" / "raw"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 70)
print("  TRAINING CLINICAL SCREENING ENSEMBLES (LEAKAGE-FREE PROTOCOL)")
print("=" * 70)

cohort_configs = [
    {
        "cohort": "adult",
        "file": DATA_DIR / "uci_426_adult" / "uci_426_adult.csv",
        "label_col": "class",
        "leakage_cols": ["result", "age_desc", "relation", "id"]
    },
    {
        "cohort": "children",
        "file": DATA_DIR / "uci_419_children" / "uci_419_children.csv",
        "label_col": "class",
        "leakage_cols": ["result", "age_desc", "relation", "id"]
    },
    {
        "cohort": "adolescent",
        "file": DATA_DIR / "uci_420_adolescent" / "Autism-Adolescent-Data.csv",
        "label_col": "Class/ASD",
        "leakage_cols": ["result", "age_desc", "relation", "id"]
    },
    {
        "cohort": "toddler",
        "file": DATA_DIR / "kaggle_toddler" / "Toddler Autism dataset July 2018.csv",
        "label_col": "Class/ASD Traits ",
        "leakage_cols": ["Case_No", "Qchat-10-Score", "Who completed the test"]
    },
    {
        "cohort": "combined_multi_age",
        "file": BASE_DIR / "datasets" / "Autism_Screening_Data_Combined.csv",
        "label_col": "Class",
        "leakage_cols": []
    }
]

all_metrics = {}

for config in cohort_configs:
    cohort = config["cohort"]
    fpath = config["file"]
    label_col = config["label_col"]
    leakage = config["leakage_cols"]

    print(f"\n>>> Cohort: [{cohort.upper()}] <<<")
    if not fpath.exists():
        print(f"  File not found: {fpath}")
        continue

    df = pd.read_csv(fpath)
    # Strip spaces from column names
    df.columns = [c.strip() for c in df.columns]
    label_clean = label_col.strip()

    # Drop leakage columns
    drop_candidates = [c for c in leakage if c in df.columns]
    X_raw = df.drop(columns=[label_clean] + drop_candidates)
    
    # Clean binary label
    y_raw = df[label_clean].astype(str).str.strip().str.upper()
    y = y_raw.map(lambda v: 1 if v in ["YES", "1", "TRUE", "AUTISM"] else 0).values

    # Clean missing values markers
    X_raw = X_raw.replace(["?", "None", "unknown", "Unknown", ""], np.nan)

    # Distinguish numeric vs categorical
    num_cols = []
    cat_cols = []
    for c in X_raw.columns:
        # Check if column can be converted to float
        converted = pd.to_numeric(X_raw[c], errors="coerce")
        if converted.notnull().sum() > 0.8 * len(X_raw):
            X_raw[c] = converted
            num_cols.append(c)
        else:
            X_raw[c] = X_raw[c].astype(str)
            cat_cols.append(c)

    # Build preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", Pipeline([("imputer", SimpleImputer(strategy="median")), ("scaler", StandardScaler())]), num_cols),
            ("cat", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))]), cat_cols)
        ]
    )

    # Algorithms
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=4, random_state=42)
    et = ExtraTreesClassifier(n_estimators=100, max_depth=8, random_state=42)
    lr = LogisticRegression(max_iter=500, random_state=42)
    mlp = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=300, random_state=42)

    # Soft Voting Stacking Ensemble
    ensemble = VotingClassifier(
        estimators=[("rf", rf), ("gb", gb), ("et", et), ("lr", lr), ("mlp", mlp)],
        voting="soft"
    )

    full_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", ensemble)
    ])

    # 5-fold Stratified Cross-Validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = ["accuracy", "precision", "recall", "f1", "roc_auc"]
    cv_results = cross_validate(full_pipeline, X_raw, y, cv=cv, scoring=scoring, return_train_score=False)

    acc = cv_results["test_accuracy"].mean()
    prec = cv_results["test_precision"].mean()
    rec = cv_results["test_recall"].mean()
    f1 = cv_results["test_f1"].mean()
    auc = cv_results["test_roc_auc"].mean()

    print(f"  CV 5-Fold Accuracy : {acc * 100:.2f}% (± {cv_results['test_accuracy'].std() * 100:.2f}%)")
    print(f"  CV 5-Fold Precision: {prec * 100:.2f}%")
    print(f"  CV 5-Fold Recall   : {rec * 100:.2f}%")
    print(f"  CV 5-Fold F1-Score : {f1 * 100:.2f}%")
    print(f"  CV 5-Fold ROC-AUC  : {auc * 100:.2f}%")

    # Fit full model and persist
    full_pipeline.fit(X_raw, y)
    model_save_path = MODELS_DIR / f"asd_screening_model_{cohort}.joblib"
    joblib.dump(full_pipeline, model_save_path)
    print(f"  [SAVED] Model artifact -> {model_save_path.name}")

    all_metrics[cohort] = {
        "samples": len(df),
        "features_used": list(X_raw.columns),
        "cv_accuracy": round(float(acc), 4),
        "cv_precision": round(float(prec), 4),
        "cv_recall": round(float(rec), 4),
        "cv_f1": round(float(f1), 4),
        "cv_roc_auc": round(float(auc), 4),
        "model_file": model_save_path.name
    }

# Save metrics JSON
with open(MODELS_DIR / "tabular_metrics.json", "w", encoding="utf-8") as f:
    json.dump(all_metrics, f, indent=2)

print("\n" + "=" * 70)
print(f"All screening models successfully trained and stored in: {MODELS_DIR}")
print("=" * 70)
