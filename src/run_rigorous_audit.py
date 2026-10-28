import os
import re
import json
import hashlib
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score, accuracy_score

BASE = Path("D:/projects/asd-decision-client")
DATA_DIR = BASE / "data" / "raw"

# -------------------------------------------------------------
# 1. IMAGE HASH DUPLICATE AUDIT
# -------------------------------------------------------------
print("=" * 70)
print("  AUDIT 1: FACIAL IMAGE DATASET DUPLICATE HASH ANALYSIS")
print("=" * 70)
img_root = DATA_DIR / "facial_images" / "autism-image-dataset"
hashes = {"train": {}, "valid": {}, "test": {}}

for split in ["train", "valid", "test"]:
    s_dir = img_root / split
    if s_dir.exists():
        for f in s_dir.rglob("*.*"):
            if f.suffix.lower() in [".jpg", ".jpeg", ".png"]:
                with open(f, "rb") as fp:
                    h = hashlib.md5(fp.read()).hexdigest()
                hashes[split][h] = f.name

train_hashes = set(hashes["train"].keys())
valid_hashes = set(hashes["valid"].keys())
test_hashes = set(hashes["test"].keys())

train_test_overlap = len(train_hashes.intersection(test_hashes))
train_valid_overlap = len(train_hashes.intersection(valid_hashes))
valid_test_overlap = len(valid_hashes.intersection(test_hashes))

print(f"Total Unique Hashes: Train={len(train_hashes)}, Valid={len(valid_hashes)}, Test={len(test_hashes)}")
print(f"Exact Duplicate Leakage:")
print(f"  Train <-> Test Overlap : {train_test_overlap} images ({train_test_overlap / max(1, len(test_hashes))*100:.2f}% of test set)")
print(f"  Train <-> Valid Overlap: {train_valid_overlap} images")
print(f"  Valid <-> Test Overlap : {valid_test_overlap} images")

image_audit = {
    "train_count": len(train_hashes),
    "valid_count": len(valid_hashes),
    "test_count": len(test_hashes),
    "train_test_leakage_duplicates": train_test_overlap,
    "train_valid_leakage_duplicates": train_valid_overlap,
    "valid_test_leakage_duplicates": valid_test_overlap
}

# -------------------------------------------------------------
# 2. PROVENANCE & DUPLICATE CHECK FOR COMBINED DATASET (6,075 rows)
# -------------------------------------------------------------
print("\n" + "=" * 70)
print("  AUDIT 2: PROVENANCE & DUPLICATES IN COMBINED DATASET (N=6,075)")
print("=" * 70)
comb_path = BASE / "datasets" / "Autism_Screening_Data_Combined.csv"
if comb_path.exists():
    df_comb = pd.read_csv(comb_path)
    total_comb = len(df_comb)
    dup_comb = df_comb.duplicated().sum()
    print(f"Total Rows: {total_comb} | Duplicate Rows: {dup_comb} ({dup_comb/total_comb*100:.2f}%)")
    
    # Check overlap with UCI datasets
    adult_path = DATA_DIR / "uci_426_adult" / "uci_426_adult.csv"
    if adult_path.exists():
        df_adult = pd.read_csv(adult_path)
        print(f"Adult UCI rows: {len(df_adult)}")

# -------------------------------------------------------------
# 3. EXPERIMENT A: DEMOGRAPHICS ONLY (ZERO A-ITEMS)
# -------------------------------------------------------------
print("\n" + "=" * 70)
print("  EXPERIMENT A: DEMOGRAPHICS & CLINICAL HISTORY ONLY (NO A-ITEMS)")
print("=" * 70)

cohort_demos = {
    "toddler": {
        "file": DATA_DIR / "kaggle_toddler" / "Toddler Autism dataset July 2018.csv",
        "demo_cols": ["Age_Mons", "Sex", "Ethnicity", "Jaundice", "Family_mem_with_ASD"],
        "label_col": "Class/ASD Traits "
    },
    "children": {
        "file": DATA_DIR / "uci_419_children" / "uci_419_children.csv",
        "demo_cols": ["age", "gender", "ethnicity", "jaundice", "autism"],
        "label_col": "class"
    },
    "adolescent": {
        "file": DATA_DIR / "uci_420_adolescent" / "Autism-Adolescent-Data.csv",
        "demo_cols": ["age", "gender", "ethnicity", "jundice", "austim"],
        "label_col": "Class/ASD"
    },
    "adult": {
        "file": DATA_DIR / "uci_426_adult" / "uci_426_adult.csv",
        "demo_cols": ["age", "gender", "ethnicity", "jaundice", "family_pdd"],
        "label_col": "class"
    }
}

demo_results = {}
for name, cfg in cohort_demos.items():
    df = pd.read_csv(cfg["file"])
    df.columns = [c.strip() for c in df.columns]
    y_raw = df[cfg["label_col"].strip()].astype(str).str.strip().str.upper()
    y = y_raw.isin(["YES", "1"]).astype(int).values
    
    X = df[[c for c in cfg["demo_cols"] if c in df.columns]].copy()
    X = X.replace(["?", "None", "unknown", "Unknown", ""], np.nan)
    
    num_cols = [c for c in X.columns if pd.to_numeric(X[c], errors="coerce").notnull().sum() > 0.8 * len(X)]
    for c in num_cols: X[c] = pd.to_numeric(X[c], errors="coerce")
    cat_cols = [c for c in X.columns if c not in num_cols]
    
    pre = ColumnTransformer([
        ("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("scl", StandardScaler())]), num_cols),
        ("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")), ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False))]), cat_cols)
    ])
    clf = Pipeline([("pre", pre), ("rf", RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42))])
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_validate(clf, X, y, cv=cv, scoring=["accuracy", "roc_auc", "f1", "precision", "recall"])
    
    acc = scores["test_accuracy"].mean()
    auc = scores["test_roc_auc"].mean()
    f1 = scores["test_f1"].mean()
    print(f"[{name.upper()}] Demographics Only: Accuracy = {acc*100:.2f}%, ROC-AUC = {auc*100:.2f}%, F1 = {f1*100:.2f}%")
    demo_results[name] = {"accuracy": round(float(acc), 4), "roc_auc": round(float(auc), 4), "f1": round(float(f1), 4)}

# -------------------------------------------------------------
# 4. EXPERIMENT B: REDUCED-ITEM SUBSETS (3 ITEMS & 5 ITEMS)
# -------------------------------------------------------------
print("\n" + "=" * 70)
print("  EXPERIMENT B: RAPID SCREENING (REDUCED 3-ITEM & 5-ITEM SUBSETS)")
print("=" * 70)

reduced_results = {}
for name, cfg in cohort_demos.items():
    df = pd.read_csv(cfg["file"])
    df.columns = [c.strip() for c in df.columns]
    A_cols = [c for c in df.columns if re.fullmatch(r"A\d+(_Score)?", c, re.IGNORECASE)]
    y_raw = df[cfg["label_col"].strip()].astype(str).str.strip().str.upper()
    y = y_raw.isin(["YES", "1"]).astype(int).values
    
    X_A = df[A_cols].apply(pd.to_numeric, errors="coerce").fillna(0)
    
    # Feature importance using Random Forest
    rf_feat = RandomForestClassifier(n_estimators=100, random_state=42).fit(X_A, y)
    importances = pd.Series(rf_feat.feature_importances_, index=A_cols).sort_values(ascending=False)
    
    top3 = importances.head(3).index.tolist()
    top5 = importances.head(5).index.tolist()
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    # Top 3
    s3 = cross_validate(RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42), X_A[top3], y, cv=cv, scoring=["accuracy", "roc_auc", "f1"])
    # Top 5
    s5 = cross_validate(RandomForestClassifier(n_estimators=100, max_depth=4, random_state=42), X_A[top5], y, cv=cv, scoring=["accuracy", "roc_auc", "f1"])
    
    print(f"[{name.upper()}] Top-3 Items ({top3}): Acc = {s3['test_accuracy'].mean()*100:.2f}%, AUC = {s3['test_roc_auc'].mean()*100:.2f}%")
    print(f"[{name.upper()}] Top-5 Items ({top5}): Acc = {s5['test_accuracy'].mean()*100:.2f}%, AUC = {s5['test_roc_auc'].mean()*100:.2f}%")
    
    reduced_results[name] = {
        "top3_items": top3,
        "top3_acc": round(float(s3["test_accuracy"].mean()), 4),
        "top3_auc": round(float(s3["test_roc_auc"].mean()), 4),
        "top5_items": top5,
        "top5_acc": round(float(s5["test_accuracy"].mean()), 4),
        "top5_auc": round(float(s5["test_roc_auc"].mean()), 4)
    }

# -------------------------------------------------------------
# 5. EXPERIMENT C: CROSS-COHORT GENERALIZATION
# -------------------------------------------------------------
print("\n" + "=" * 70)
print("  EXPERIMENT C: CROSS-COHORT GENERALIZATION / TRANSFER TEST")
print("=" * 70)
# Adult model -> Test on Adolescent, and Test on Child
# All share A1_Score to A10_Score
df_adult = pd.read_csv(DATA_DIR / "uci_426_adult" / "uci_426_adult.csv")
df_ado = pd.read_csv(DATA_DIR / "uci_420_adolescent" / "Autism-Adolescent-Data.csv")
df_child = pd.read_csv(DATA_DIR / "uci_419_children" / "uci_419_children.csv")

for df_tmp in [df_adult, df_ado, df_child]:
    df_tmp.columns = [c.strip() for c in df_tmp.columns]

A10 = [f"A{i}_Score" for i in range(1, 11)]
X_adult = df_adult[A10].apply(pd.to_numeric, errors="coerce").fillna(0)
y_adult = df_adult["class"].astype(str).str.strip().str.upper().isin(["YES", "1"]).astype(int)

X_ado = df_ado[A10].apply(pd.to_numeric, errors="coerce").fillna(0)
y_ado = df_ado["Class/ASD"].astype(str).str.strip().str.upper().isin(["YES", "1"]).astype(int)

X_child = df_child[A10].apply(pd.to_numeric, errors="coerce").fillna(0)
y_child = df_child["class"].astype(str).str.strip().str.upper().isin(["YES", "1"]).astype(int)

clf_adult = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42).fit(X_adult, y_adult)

pred_ado = clf_adult.predict(X_ado)
acc_ado_transfer = accuracy_score(y_ado, pred_ado)
auc_ado_transfer = roc_auc_score(y_ado, clf_adult.predict_proba(X_ado)[:, 1])

pred_child = clf_adult.predict(X_child)
acc_child_transfer = accuracy_score(y_child, pred_child)
auc_child_transfer = roc_auc_score(y_child, clf_adult.predict_proba(X_child)[:, 1])

print(f"Train on ADULT (N=704) -> Zero-Shot Test on ADOLESCENT (N=104): Acc = {acc_ado_transfer*100:.2f}%, AUC = {auc_ado_transfer*100:.2f}%")
print(f"Train on ADULT (N=704) -> Zero-Shot Test on CHILD (N=292):      Acc = {acc_child_transfer*100:.2f}%, AUC = {auc_child_transfer*100:.2f}%")

cross_cohort_results = {
    "adult_to_adolescent": {"accuracy": round(float(acc_ado_transfer), 4), "auc": round(float(auc_ado_transfer), 4)},
    "adult_to_child": {"accuracy": round(float(acc_child_transfer), 4), "auc": round(float(auc_child_transfer), 4)}
}

# Save all empirical findings
all_honest_audit = {
    "image_duplicate_audit": image_audit,
    "combined_dataset_duplicates": int(dup_comb),
    "demographics_only_experiment": demo_results,
    "reduced_items_experiment": reduced_results,
    "cross_cohort_transfer_experiment": cross_cohort_results
}

with open(BASE / "data/rigorous_research_audit.json", "w", encoding="utf-8") as f:
    json.dump(all_honest_audit, f, indent=2)

print("\n" + "=" * 70)
print("Complete rigorous research audit saved to: data/rigorous_research_audit.json")
print("=" * 70)
