import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import RepeatedStratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, balanced_accuracy_score, roc_auc_score, brier_score_loss

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

def poisson_binomial_pmf(probs):
    pmf = np.array([1.0])
    for p in probs:
        p = float(np.clip(p, 1e-6, 1.0 - 1e-6))
        new_pmf = np.zeros(len(pmf) + 1)
        new_pmf[0] = pmf[0] * (1.0 - p)
        for k in range(1, len(pmf)):
            new_pmf[k] = pmf[k] * (1.0 - p) + pmf[k - 1] * p
        new_pmf[-1] = pmf[-1] * p
        pmf = new_pmf
    return pmf

def exact_bayesian_predict_proba(X_test_k, selected_indices, train_item_marginals, threshold_t):
    all_indices = set(range(10))
    unobserved_indices = sorted(list(all_indices - set(selected_indices)))
    unobserved_probs = [train_item_marginals[j] for j in unobserved_indices]
    pmf = poisson_binomial_pmf(unobserved_probs)
    max_unobs = len(unobserved_indices)
    
    probs = []
    for row in X_test_k:
        s_obs = int(np.sum(row))
        needed = threshold_t - s_obs
        if needed <= 0:
            p_ge_t = 1.0
        elif needed > max_unobs:
            p_ge_t = 0.0
        else:
            p_ge_t = float(np.sum(pmf[needed:]))
        probs.append(p_ge_t)
    return np.array(probs)

def compute_ci(scores):
    mean_val = float(np.mean(scores))
    std_val = float(np.std(scores, ddof=1)) if len(scores) > 1 else 0.0
    se_val = std_val / np.sqrt(len(scores)) if len(scores) > 1 else 0.0
    ci_lower = float(mean_val - 1.96 * se_val)
    ci_upper = float(mean_val + 1.96 * se_val)
    return {
        "mean": round(mean_val, 4),
        "std": round(std_val, 4),
        "ci_95": [round(max(0.0, ci_lower), 4), round(min(1.0, ci_upper), 4)]
    }

cohorts_config = {
    "toddler": {
        "file": os.path.join(DATA_DIR, "Toddler Autism dataset July 2018.csv"),
        "t": 4
    },
    "child": {
        "file": os.path.join(DATA_DIR, "Autism-Child-Data.csv"),
        "t": 7
    },
    "adolescent": {
        "file": os.path.join(DATA_DIR, "Autism-Adolescent-Data.csv"),
        "t": 7
    },
    "adult": {
        "file": os.path.join(DATA_DIR, "Autism-Adult-Data.csv"),
        "t": 7
    }
}

rskf = RepeatedStratifiedKFold(n_splits=5, n_repeats=5, random_state=42)
k_values = [3, 4, 5, 6, 7]

results = {
    "experiment": "Experiment B: Questionnaire Shortening (Nested Feature Selection Inside Each Fold)",
    "task_redefinition": "Predicting the full-questionnaire screening outcome from fewer items (NOT genuine clinical inference)",
    "protocol": "5x5 Repeated Stratified CV, feature ranking strictly on training fold only, zero full-dataset leakage",
    "evaluated_models": ["Random Forest", "Logistic Regression", "Exact Bayesian Posterior Baseline"],
    "k_values": k_values,
    "cohort_results": {}
}

for cohort_name, cfg in cohorts_config.items():
    print(f"Processing {cohort_name}...")
    df = pd.read_csv(cfg["file"])
    col_map = {c.strip().lower(): c for c in df.columns}
    
    a_cols = []
    for i in range(1, 11):
        for cand in [f"a{i}_score", f"a{i}"]:
            if cand in col_map:
                a_cols.append(col_map[cand])
                break
    
    tgt_col = None
    target_candidates = ["class/asd traits ", "class/asd", "class/asd_traits_", "class/asd_traits", "class_asd", "class", "class/asd traits"]
    for c in df.columns:
        for tc in target_candidates:
            if c.strip().lower() == tc.lower():
                tgt_col = c
                break
        if tgt_col: break
    if not tgt_col:
        for c in df.columns:
            if "class" in c.lower() or "asd" in c.lower():
                tgt_col = c; break
            
    def binarize(v):
        s = str(v).strip().lower()
        return 1 if s in ["yes", "y", "1", "true", "positive", "autism"] else 0
        
    X_all = df[a_cols].apply(pd.to_numeric, errors='coerce').fillna(0).astype(int).values
    y_all = df[tgt_col].apply(binarize).values
    threshold_t = cfg["t"]
    
    cohort_dict = {
        "sample_size": len(df),
        "cutoff_threshold": threshold_t,
        "k_comparisons": {f"k_{k}": {
            "random_forest": {"acc": [], "bal_acc": [], "auc": [], "ece": [], "brier": []},
            "logistic_regression": {"acc": [], "bal_acc": [], "auc": [], "ece": [], "brier": []},
            "exact_bayesian": {"acc": [], "bal_acc": [], "auc": [], "ece": [], "brier": []}
        } for k in k_values}
    }
    
    # Run repeated CV
    for train_idx, test_idx in rskf.split(X_all, y_all):
        X_tr, X_te = X_all[train_idx], X_all[test_idx]
        y_tr, y_te = y_all[train_idx], y_all[test_idx]
        
        # 1. Fit selector ONCE per fold
        rf_selector = RandomForestClassifier(n_estimators=50, max_depth=4, random_state=42, n_jobs=-1)
        rf_selector.fit(X_tr, y_tr)
        ranked_indices = np.argsort(rf_selector.feature_importances_)[::-1]
        
        train_item_marginals = np.mean(X_tr, axis=0)
        
        # Evaluate each k
        for k in k_values:
            top_k = ranked_indices[:k]
            X_tr_k = X_tr[:, top_k]
            X_te_k = X_te[:, top_k]
            
            k_key = f"k_{k}"
            
            # (a) Random Forest
            rf = RandomForestClassifier(n_estimators=50, max_depth=4, random_state=42, n_jobs=-1)
            rf.fit(X_tr_k, y_tr)
            rf_prob = rf.predict_proba(X_te_k)[:, 1]
            rf_pred = (rf_prob >= 0.5).astype(int)
            
            cohort_dict["k_comparisons"][k_key]["random_forest"]["acc"].append(accuracy_score(y_te, rf_pred))
            cohort_dict["k_comparisons"][k_key]["random_forest"]["bal_acc"].append(balanced_accuracy_score(y_te, rf_pred))
            cohort_dict["k_comparisons"][k_key]["random_forest"]["auc"].append(roc_auc_score(y_te, rf_prob) if len(np.unique(y_te)) > 1 else 0.5)
            cohort_dict["k_comparisons"][k_key]["random_forest"]["ece"].append(compute_ece(y_te, rf_prob))
            cohort_dict["k_comparisons"][k_key]["random_forest"]["brier"].append(brier_score_loss(y_te, rf_prob))
            
            # (b) Logistic Regression
            lr = LogisticRegression(max_iter=200, random_state=42)
            lr.fit(X_tr_k, y_tr)
            lr_prob = lr.predict_proba(X_te_k)[:, 1]
            lr_pred = (lr_prob >= 0.5).astype(int)
            
            cohort_dict["k_comparisons"][k_key]["logistic_regression"]["acc"].append(accuracy_score(y_te, lr_pred))
            cohort_dict["k_comparisons"][k_key]["logistic_regression"]["bal_acc"].append(balanced_accuracy_score(y_te, lr_pred))
            cohort_dict["k_comparisons"][k_key]["logistic_regression"]["auc"].append(roc_auc_score(y_te, lr_prob) if len(np.unique(y_te)) > 1 else 0.5)
            cohort_dict["k_comparisons"][k_key]["logistic_regression"]["ece"].append(compute_ece(y_te, lr_prob))
            cohort_dict["k_comparisons"][k_key]["logistic_regression"]["brier"].append(brier_score_loss(y_te, lr_prob))
            
            # (c) EXACT Bayesian Posterior Baseline
            bayes_prob = exact_bayesian_predict_proba(X_te_k, top_k, train_item_marginals, threshold_t)
            bayes_pred = (bayes_prob >= 0.5).astype(int)
            
            cohort_dict["k_comparisons"][k_key]["exact_bayesian"]["acc"].append(accuracy_score(y_te, bayes_pred))
            cohort_dict["k_comparisons"][k_key]["exact_bayesian"]["bal_acc"].append(balanced_accuracy_score(y_te, bayes_pred))
            cohort_dict["k_comparisons"][k_key]["exact_bayesian"]["auc"].append(roc_auc_score(y_te, bayes_prob) if len(np.unique(y_te)) > 1 else 0.5)
            cohort_dict["k_comparisons"][k_key]["exact_bayesian"]["ece"].append(compute_ece(y_te, bayes_prob))
            cohort_dict["k_comparisons"][k_key]["exact_bayesian"]["brier"].append(brier_score_loss(y_te, bayes_prob))
            
    # Compute CI for all
    final_k_comp = {}
    for k_key, models_dict in cohort_dict["k_comparisons"].items():
        final_k_comp[k_key] = {}
        for m_name, metrics_dict in models_dict.items():
            final_k_comp[k_key][m_name] = {
                metric: compute_ci(scores)
                for metric, scores in metrics_dict.items()
            }
    cohort_dict["k_comparisons"] = final_k_comp
    results["cohort_results"][cohort_name] = cohort_dict

out_scratch = os.path.join(SCRATCH_RESULTS_DIR, "questionnaire_shortening.json")
with open(out_scratch, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2)

print(f"Questionnaire shortening experiment completed and saved to {out_scratch}")
