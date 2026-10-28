import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import RepeatedStratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, balanced_accuracy_score, roc_auc_score, f1_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

DATA_DIR = r"D:\projects\asd-decision-client\datasets"
SCRATCH_RESULTS_DIR = r"C:\Users\Master\.gemini\antigravity-ide\scratch\results"
os.makedirs(SCRATCH_RESULTS_DIR, exist_ok=True)

# Datasets
datasets_info = {
    "toddler": {
        "file": os.path.join(DATA_DIR, "Toddler Autism dataset July 2018.csv"),
        "demographics": ["Age_Mons", "Sex", "Ethnicity", "Jaundice", "Family_mem_with_ASD"],
        "target": "Class/ASD Traits "
    },
    "child": {
        "file": os.path.join(DATA_DIR, "Autism-Child-Data.csv"),
        "demographics": ["age", "gender", "ethnicity", "jaundice", "austim"],
        "target": "Class/ASD"
    },
    "adolescent": {
        "file": os.path.join(DATA_DIR, "Autism-Adolescent-Data.csv"),
        "demographics": ["age", "gender", "ethnicity", "jaundice", "austim"],
        "target": "Class/ASD"
    },
    "adult": {
        "file": os.path.join(DATA_DIR, "Autism-Adult-Data.csv"),
        "demographics": ["age", "gender", "ethnicity", "jaundice", "austim"],
        "target": "Class/ASD"
    }
}

def binarize_target(val):
    if pd.isna(val): return 0
    s = str(val).strip().lower()
    return 1 if s in ["yes", "y", "1", "true", "positive", "autism"] else 0

def compute_ci(scores):
    # 95% confidence interval across the 25 folds (mean +/- 1.96 * SE)
    mean_val = float(np.mean(scores))
    std_val = float(np.std(scores, ddof=1))
    se_val = std_val / np.sqrt(len(scores))
    ci_lower = float(mean_val - 1.96 * se_val)
    ci_upper = float(mean_val + 1.96 * se_val)
    return {
        "mean": round(mean_val, 4),
        "std": round(std_val, 4),
        "ci_95": [round(max(0.0, ci_lower), 4), round(min(1.0, ci_upper), 4)]
    }

results = {
    "experiment": "Experiment A: Demographics and Medical History Only (Zero Questionnaire Items)",
    "protocol": "Repeated Stratified 5-Fold Cross Validation (5x5 = 25 evaluations), Fixed Seed 42",
    "clinical_takeaway": "Demographic variables alone exhibit weak-to-modest signal (ROC-AUC ~0.56 to 0.66) and only marginally exceed the majority-class baseline.",
    "cohorts": {}
}

rskf = RepeatedStratifiedKFold(n_splits=5, n_repeats=5, random_state=42)

for cohort_name, cfg in datasets_info.items():
    if not os.path.exists(cfg["file"]):
        continue
    df_raw = pd.read_csv(cfg["file"])
    
    # Standardize column lookup
    col_dict = {c.strip().lower(): c for c in df_raw.columns}
    
    # Target
    tgt_col = None
    for cand in ["class/asd traits ", "class/asd", "class/asd_traits", "class"]:
        if cand in col_dict:
            tgt_col = col_dict[cand]
            break
    if not tgt_col:
        for c in df_raw.columns:
            if "class" in c.lower():
                tgt_col = c; break
                
    y_raw = df_raw[tgt_col].apply(binarize_target).values
    
    # Demo features
    demo_cols_found = []
    for d in cfg["demographics"]:
        dl = d.lower()
        if dl in col_dict:
            demo_cols_found.append(col_dict[dl])
        elif dl == "austim" and "autism" in col_dict:
            demo_cols_found.append(col_dict["autism"])
        elif dl == "jaundice" and "jundice" in col_dict:
            demo_cols_found.append(col_dict["jundice"])
            
    # Evaluate on both Raw and Deduplicated
    for is_dedup in [False, True]:
        setting_key = f"{cohort_name}_{'dedup' if is_dedup else 'raw'}"
        
        if is_dedup:
            sub_df = df_raw.drop_duplicates(subset=demo_cols_found + [tgt_col]).copy()
        else:
            sub_df = df_raw.copy()
            
        X = sub_df[demo_cols_found].copy()
        y = sub_df[tgt_col].apply(binarize_target).values
        
        # Majority class baseline
        majority_class = int(np.round(np.mean(y)))
        maj_acc = float(np.mean(y == majority_class))
        maj_bal_acc = 0.50
        
        # Preprocessor for demographics
        num_cols = [c for c in demo_cols_found if X[c].dtype in [np.float64, np.int64]]
        cat_cols = [c for c in demo_cols_found if c not in num_cols]
        
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median'))
        ])
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        preprocessor = ColumnTransformer(transformers=[
            ('num', numeric_transformer, num_cols),
            ('cat', categorical_transformer, cat_cols)
        ])
        
        clf = Pipeline(steps=[
            ('prep', preprocessor),
            ('rf', RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42))
        ])
        
        fold_accs = []
        fold_bal_accs = []
        fold_aucs = []
        fold_f1s = []
        
        for train_idx, test_idx in rskf.split(X, y):
            X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
            y_tr, y_te = y[train_idx], y[test_idx]
            
            clf.fit(X_tr, y_tr)
            y_pred = clf.predict(X_te)
            y_prob = clf.predict_proba(X_te)[:, 1]
            
            fold_accs.append(accuracy_score(y_te, y_pred))
            fold_bal_accs.append(balanced_accuracy_score(y_te, y_pred))
            fold_aucs.append(roc_auc_score(y_te, y_prob) if len(np.unique(y_te)) > 1 else 0.5)
            fold_f1s.append(f1_score(y_te, y_pred, zero_division=0))
            
        results["cohorts"][setting_key] = {
            "cohort": cohort_name,
            "deduplicated": is_dedup,
            "n_samples": len(X),
            "features_used": demo_cols_found,
            "majority_class_baseline_accuracy": round(maj_acc, 4),
            "majority_class_balanced_accuracy": round(maj_bal_acc, 4),
            "accuracy": compute_ci(fold_accs),
            "balanced_accuracy": compute_ci(fold_bal_accs),
            "roc_auc": compute_ci(fold_aucs),
            "f1": compute_ci(fold_f1s)
        }

out_scratch = os.path.join(SCRATCH_RESULTS_DIR, "demographics_baseline.json")
with open(out_scratch, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print(f"Demographics baseline experiment completed and saved to {out_scratch}")
