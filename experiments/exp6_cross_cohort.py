import os
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, balanced_accuracy_score, roc_auc_score

DATA_DIR = r"D:\projects\asd-decision-client\datasets"
SCRATCH_RESULTS_DIR = r"C:\Users\Master\.gemini\antigravity-ide\scratch\results"
os.makedirs(SCRATCH_RESULTS_DIR, exist_ok=True)

cohorts_config = {
    "toddler": {"file": os.path.join(DATA_DIR, "Toddler Autism dataset July 2018.csv"), "t": 4, "age_col": "Age_Mons", "sex_col": "Sex", "eth_col": "Ethnicity"},
    "child": {"file": os.path.join(DATA_DIR, "Autism-Child-Data.csv"), "t": 7, "age_col": "age", "sex_col": "gender", "eth_col": "ethnicity"},
    "adolescent": {"file": os.path.join(DATA_DIR, "Autism-Adolescent-Data.csv"), "t": 7, "age_col": "age", "sex_col": "gender", "eth_col": "ethnicity"},
    "adult": {"file": os.path.join(DATA_DIR, "Autism-Adult-Data.csv"), "t": 7, "age_col": "age", "sex_col": "gender", "eth_col": "ethnicity"}
}

def load_data(cfg):
    df = pd.read_csv(cfg["file"])
    col_map = {c.strip().lower(): c for c in df.columns}
    
    a_cols = []
    for i in range(1, 11):
        for cand in [f"a{i}_score", f"a{i}"]:
            if cand in col_map:
                a_cols.append(col_map[cand]); break
                
    tgt_col = None
    target_candidates = ["class/asd traits ", "class/asd", "class/asd_traits_", "class/asd_traits", "class_asd", "class", "class/asd traits"]
    for c in df.columns:
        for tc in target_candidates:
            if c.strip().lower() == tc.lower():
                tgt_col = c; break
        if tgt_col: break
    if not tgt_col:
        for c in df.columns:
            if "class" in c.lower() or "asd" in c.lower():
                tgt_col = c; break
                
    def binarize(v):
        s = str(v).strip().lower()
        return 1 if s in ["yes", "y", "1", "true", "positive", "autism"] else 0
        
    X = df[a_cols].apply(pd.to_numeric, errors='coerce').fillna(0).astype(int).values
    y = df[tgt_col].apply(binarize).values
    return df, X, y, a_cols

def compute_ci(scores):
    mean_val = float(np.mean(scores))
    std_val = float(np.std(scores, ddof=1)) if len(scores) > 1 else 0.0
    se_val = std_val / np.sqrt(len(scores)) if len(scores) > 1 else 0.0
    ci_lower = float(mean_val - 1.96 * se_val)
    ci_upper = float(mean_val + 1.96 * se_val)
    return {
        "mean": round(mean_val, 4),
        "ci_95": [round(max(0.0, ci_lower), 4), round(min(1.0, ci_upper), 4)]
    }

loaded = {}
for c_name, cfg in cohorts_config.items():
    df, X, y, a_cols = load_data(cfg)
    loaded[c_name] = {"df": df, "X": X, "y": y, "t": cfg["t"], "cfg": cfg}

results = {
    "experiment": "Cross-Cohort Validation (Sanity Check Only)",
    "scientific_clarification": "High cross-cohort transfer is expected because the underlying target labels share one arithmetic sum scoring rule (t=7 across child/adolescent/adult, and t=4 for toddlers). This reflects rule overlap, NOT developmental conservation of the clinical phenotype.",
    "pairwise_transfer": [],
    "subgroup_analysis": {}
}

cohort_names = ["adult", "adolescent", "child", "toddler"]

for src in cohort_names:
    for tgt in cohort_names:
        if src == tgt: continue
        
        X_train, y_train = loaded[src]["X"], loaded[src]["y"]
        X_test, y_test = loaded[tgt]["X"], loaded[tgt]["y"]
        
        # Fit Random Forest on source
        rf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
        rf.fit(X_train, y_train)
        
        y_prob = rf.predict_proba(X_test)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)
        
        acc = float(accuracy_score(y_test, y_pred))
        bal_acc = float(balanced_accuracy_score(y_test, y_pred))
        auc = float(roc_auc_score(y_test, y_prob)) if len(np.unique(y_test)) > 1 else 0.5
        
        rule_mismatch = (loaded[src]["t"] != loaded[tgt]["t"])
        mismatch_note = f"Source uses t={loaded[src]['t']}, Target uses t={loaded[tgt]['t']}." if rule_mismatch else "Matching threshold t=7."
        
        results["pairwise_transfer"].append({
            "source_cohort": src,
            "target_cohort": tgt,
            "source_threshold": loaded[src]["t"],
            "target_threshold": loaded[tgt]["t"],
            "threshold_mismatch": rule_mismatch,
            "accuracy": round(acc, 4),
            "balanced_accuracy": round(bal_acc, 4),
            "roc_auc": round(auc, 4),
            "notes": mismatch_note
        })

# Subgroup tables on Adult dataset (n=704, adequate sample size)
df_adult = loaded["adult"]["df"]
X_adult = loaded["adult"]["X"]
y_adult = loaded["adult"]["y"]

from sklearn.model_selection import StratifiedKFold
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
rf_sub = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)

# Out-of-fold predictions
oof_preds = np.zeros(len(y_adult))
oof_probs = np.zeros(len(y_adult))

for tr, te in skf.split(X_adult, y_adult):
    rf_sub.fit(X_adult[tr], y_adult[tr])
    oof_probs[te] = rf_sub.predict_proba(X_adult[te])[:, 1]
    oof_preds[te] = (oof_probs[te] >= 0.5).astype(int)

# 1. By Sex
sex_col = [c for c in df_adult.columns if "gender" in c.lower() or "sex" in c.lower()][0]
sex_groups = {}
for s_val in df_adult[sex_col].dropna().unique():
    mask = (df_adult[sex_col] == s_val).values
    if np.sum(mask) >= 30:
        y_sub = y_adult[mask]
        pred_sub = oof_preds[mask]
        prob_sub = oof_probs[mask]
        
        # Bootstrap CI for subgroup
        boot_accs = [accuracy_score(y_sub, pred_sub[np.random.choice(len(y_sub), len(y_sub), replace=True)]) for _ in range(100)]
        boot_aucs = [roc_auc_score(y_sub, prob_sub[np.random.choice(len(y_sub), len(y_sub), replace=True)]) if len(np.unique(y_sub))>1 else 0.5 for _ in range(100)]
        
        sex_groups[str(s_val)] = {
            "n": int(np.sum(mask)),
            "accuracy": compute_ci(boot_accs),
            "roc_auc": compute_ci(boot_aucs)
        }
results["subgroup_analysis"]["by_sex"] = sex_groups

# 2. By Ethnicity (where n >= 30)
eth_col = [c for c in df_adult.columns if "ethnicity" in c.lower()][0]
eth_groups = {}
for e_val in df_adult[eth_col].dropna().unique():
    mask = (df_adult[eth_col] == e_val).values
    if np.sum(mask) >= 30:
        y_sub = y_adult[mask]
        pred_sub = oof_preds[mask]
        prob_sub = oof_probs[mask]
        
        boot_accs = [accuracy_score(y_sub, pred_sub[np.random.choice(len(y_sub), len(y_sub), replace=True)]) for _ in range(100)]
        boot_aucs = [roc_auc_score(y_sub, prob_sub[np.random.choice(len(y_sub), len(y_sub), replace=True)]) if len(np.unique(y_sub))>1 else 0.5 for _ in range(100)]
        
        eth_groups[str(e_val)] = {
            "n": int(np.sum(mask)),
            "accuracy": compute_ci(boot_accs),
            "roc_auc": compute_ci(boot_aucs)
        }
results["subgroup_analysis"]["by_ethnicity"] = eth_groups

out_scratch = os.path.join(SCRATCH_RESULTS_DIR, "cross_cohort_validation.json")
with open(out_scratch, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print(f"Cross-cohort validation completed and saved to {out_scratch}")
