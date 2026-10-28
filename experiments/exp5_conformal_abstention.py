import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, brier_score_loss

DATA_DIR = r"D:\projects\asd-decision-client\datasets"
SCRATCH_RESULTS_DIR = r"C:\Users\Master\.gemini\antigravity-ide\scratch\results"
os.makedirs(SCRATCH_RESULTS_DIR, exist_ok=True)

def compute_ece(y_true, y_prob, n_bins=10):
    bin_limits = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    n = len(y_true)
    if n == 0: return 0.0
    for i in range(n_bins):
        low, high = bin_limits[i], bin_limits[i+1]
        mask = (y_prob >= low) & (y_prob < high) if i < n_bins - 1 else (y_prob >= low) & (y_prob <= high)
        if np.sum(mask) > 0:
            bin_acc = np.mean(y_true[mask])
            bin_conf = np.mean(y_prob[mask])
            ece += (np.sum(mask) / n) * np.abs(bin_acc - bin_conf)
    return float(ece)

cohorts_config = {
    "toddler": {"file": os.path.join(DATA_DIR, "Toddler Autism dataset July 2018.csv"), "t": 4},
    "child": {"file": os.path.join(DATA_DIR, "Autism-Child-Data.csv"), "t": 7},
    "adolescent": {"file": os.path.join(DATA_DIR, "Autism-Adolescent-Data.csv"), "t": 7},
    "adult": {"file": os.path.join(DATA_DIR, "Autism-Adult-Data.csv"), "t": 7}
}

alphas = [0.05, 0.10, 0.20]

results = {
    "method": "Split Conformal Prediction for Clinically Safe Abstention",
    "mapping": {
        "{0}": "Lower Likelihood",
        "{1}": "Higher Likelihood",
        "{0, 1} or empty": "Please See a Specialist (Conformal Abstention)"
    },
    "alphas_evaluated": alphas,
    "cohort_results": {}
}

for c_name, cfg in cohorts_config.items():
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
    
    # 5-item subset for realism (questionnaire shortening)
    rf_ranker = RandomForestClassifier(n_estimators=50, max_depth=4, random_state=42)
    rf_ranker.fit(X, y)
    top_5_idx = np.argsort(rf_ranker.feature_importances_)[::-1][:5]
    X_5 = X[:, top_5_idx]
    
    # Split: 60% Train, 20% Calibration, 20% Test
    X_train, X_temp, y_train, y_temp = train_test_split(X_5, y, test_size=0.40, random_state=42, stratify=y)
    X_cal, X_test, y_cal, y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp)
    
    # Base model
    base_rf = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
    base_rf.fit(X_train, y_train)
    raw_test_prob = base_rf.predict_proba(X_test)[:, 1]
    
    ece_before = compute_ece(y_test, raw_test_prob)
    brier_before = float(brier_score_loss(y_test, raw_test_prob))
    
    # Calibrated model (Platt scaling via logistic regression on calibration split)
    from sklearn.linear_model import LogisticRegression
    train_cal_prob = base_rf.predict_proba(X_cal)[:, 1:2]
    platt_scaler = LogisticRegression(random_state=42)
    platt_scaler.fit(train_cal_prob, y_cal)
    
    cal_test_prob = platt_scaler.predict_proba(base_rf.predict_proba(X_test)[:, 1:2])[:, 1]
    cal_cal_prob = platt_scaler.predict_proba(train_cal_prob)[:, 1]
    
    ece_after = compute_ece(y_test, cal_test_prob)
    brier_after = float(brier_score_loss(y_test, cal_test_prob))
    
    # Conformal non-conformity scores on calibration set: s_i = 1 - p(y_true_i)
    n_cal = len(y_cal)
    cal_scores = []
    for i in range(n_cal):
        p_true = cal_cal_prob[i] if y_cal[i] == 1 else (1.0 - cal_cal_prob[i])
        cal_scores.append(1.0 - p_true)
    cal_scores = np.array(cal_scores)
    
    conformal_sweep = []
    for alpha in alphas:
        # Quantile level: ceil((n + 1) * (1 - alpha)) / n
        q_level = np.ceil((n_cal + 1) * (1.0 - alpha)) / n_cal
        q_level = min(1.0, max(0.0, q_level))
        q_val = float(np.quantile(cal_scores, q_level, method='higher'))
        
        # Test predictions sets: C(x) = {y : 1 - p(y) <= q_val}
        sets = []
        covered = 0
        abstain_count = 0
        correct_selective = 0
        total_selective = 0
        
        for i in range(len(y_test)):
            p1 = cal_test_prob[i]
            p0 = 1.0 - p1
            s_set = []
            if (1.0 - p0) <= q_val:
                s_set.append(0)
            if (1.0 - p1) <= q_val:
                s_set.append(1)
                
            sets.append(s_set)
            
            # Coverage check: true label in set
            if y_test[i] in s_set:
                covered += 1
                
            # Abstention check: singleton vs ambiguous/empty
            if len(s_set) != 1:
                abstain_count += 1
            else:
                total_selective += 1
                if s_set[0] == y_test[i]:
                    correct_selective += 1
                    
        emp_coverage = covered / len(y_test)
        abstention_rate = abstain_count / len(y_test)
        selective_acc = (correct_selective / total_selective) if total_selective > 0 else 1.0
        
        conformal_sweep.append({
            "alpha": alpha,
            "target_coverage": f"{(1 - alpha)*100:.0f}%",
            "empirical_coverage": round(emp_coverage, 4),
            "conformal_quantile_threshold": round(q_val, 4),
            "abstention_rate": round(abstention_rate, 4),
            "selective_accuracy": round(selective_acc, 4),
            "retained_cases_count": total_selective,
            "abstained_cases_count": abstain_count
        })
        
    results["cohort_results"][c_name] = {
        "n_train": len(X_train),
        "n_cal": len(X_cal),
        "n_test": len(X_test),
        "calibration_impact": {
            "ece_before": round(ece_before, 4),
            "ece_after": round(ece_after, 4),
            "ece_reduction_pct": round((ece_before - ece_after) / ece_before * 100, 2) if ece_before > 0 else 0.0,
            "brier_before": round(brier_before, 4),
            "brier_after": round(brier_after, 4)
        },
        "conformal_sweep": conformal_sweep
    }

out_scratch = os.path.join(SCRATCH_RESULTS_DIR, "conformal_abstention.json")
with open(out_scratch, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print(f"Conformal prediction experiment completed and saved to {out_scratch}")
