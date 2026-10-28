import os
import json
import numpy as np
import pandas as pd

DATA_DIR = r"D:\projects\asd-decision-client\datasets"
SCRATCH_RESULTS_DIR = r"C:\Users\Master\.gemini\antigravity-ide\scratch\results"
os.makedirs(SCRATCH_RESULTS_DIR, exist_ok=True)

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

def compute_binary_entropy(p):
    p = np.clip(p, 1e-8, 1.0 - 1e-8)
    return - (p * np.log2(p) + (1.0 - p) * np.log2(1.0 - p))

def compute_posterior(observed_dict, all_item_marginals, threshold_t):
    all_indices = set(range(10))
    obs_indices = set(observed_dict.keys())
    unobs_indices = sorted(list(all_indices - obs_indices))
    
    s_obs = sum(observed_dict.values())
    needed = threshold_t - s_obs
    max_unobs = len(unobs_indices)
    
    if needed <= 0:
        return 1.0
    if needed > max_unobs:
        return 0.0
        
    unobs_probs = [all_item_marginals[j] for j in unobs_indices]
    pmf = poisson_binomial_pmf(unobs_probs)
    return float(np.sum(pmf[needed:]))

def select_next_best_item(observed_dict, all_item_marginals, threshold_t):
    all_indices = set(range(10))
    unobs_indices = sorted(list(all_indices - set(observed_dict.keys())))
    if not unobs_indices:
        return None
        
    curr_post = compute_posterior(observed_dict, all_item_marginals, threshold_t)
    curr_ent = compute_binary_entropy(curr_post)
    
    best_item = None
    max_ig = -1.0
    
    for j in unobs_indices:
        pj = all_item_marginals[j]
        # Scenario 1: Aj = 1
        d1 = dict(observed_dict)
        d1[j] = 1
        p1 = compute_posterior(d1, all_item_marginals, threshold_t)
        h1 = compute_binary_entropy(p1)
        
        # Scenario 2: Aj = 0
        d0 = dict(observed_dict)
        d0[j] = 0
        p0 = compute_posterior(d0, all_item_marginals, threshold_t)
        h0 = compute_binary_entropy(p0)
        
        exp_ent = pj * h1 + (1.0 - pj) * h0
        ig = curr_ent - exp_ent
        if ig > max_ig:
            max_ig = ig
            best_item = j
            
    return best_item

cohorts_config = {
    "toddler": {"file": os.path.join(DATA_DIR, "Toddler Autism dataset July 2018.csv"), "t": 4},
    "child": {"file": os.path.join(DATA_DIR, "Autism-Child-Data.csv"), "t": 7},
    "adolescent": {"file": os.path.join(DATA_DIR, "Autism-Adolescent-Data.csv"), "t": 7},
    "adult": {"file": os.path.join(DATA_DIR, "Autism-Adult-Data.csv"), "t": 7}
}

confidence_thresholds = [0.01, 0.05, 0.10, 0.15, 0.20]

adaptive_results = {
    "module": "Adaptive Bayesian Information-Gain Questionnaire Screener",
    "stopping_criteria": "Stop when P(sum >= t | observed) >= 1 - delta OR <= delta, or when deterministic ceiling/floor reached",
    "evaluations": {}
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
    for cand in ["class/asd traits ", "class/asd", "class/asd_traits", "class"]:
        if cand in col_map: tgt_col = col_map[cand]; break
    if not tgt_col:
        for c in df.columns:
            if "class" in c.lower() or "asd" in c.lower():
                tgt_col = c; break
                
    def binarize(v):
        s = str(v).strip().lower()
        return 1 if s in ["yes", "y", "1", "true", "positive", "autism"] else 0
        
    X_mat = df[a_cols].apply(pd.to_numeric, errors='coerce').fillna(0).astype(int).values
    y_true = df[tgt_col].apply(binarize).values
    t_val = cfg["t"]
    
    marginals = np.mean(X_mat, axis=0)
    
    cohort_eval = {
        "cutoff_threshold": t_val,
        "n_samples": len(df),
        "confidence_threshold_sweep": []
    }
    
    for delta in confidence_thresholds:
        questions_asked_list = []
        predictions_list = []
        
        for idx in range(len(X_mat)):
            row = X_mat[idx]
            observed = {}
            
            # Adaptive questioning loop
            while len(observed) < 10:
                p_current = compute_posterior(observed, marginals, t_val)
                # Check stop condition
                if p_current >= (1.0 - delta) or p_current <= delta:
                    break
                next_item = select_next_best_item(observed, marginals, t_val)
                if next_item is None:
                    break
                observed[next_item] = int(row[next_item])
                
            final_prob = compute_posterior(observed, marginals, t_val)
            pred = 1 if final_prob >= 0.5 else 0
            
            questions_asked_list.append(len(observed))
            predictions_list.append(pred)
            
        acc = float(np.mean(np.array(predictions_list) == y_true))
        mean_q = float(np.mean(questions_asked_list))
        median_q = float(np.median(questions_asked_list))
        min_q = int(np.min(questions_asked_list))
        max_q = int(np.max(questions_asked_list))
        
        cohort_eval["confidence_threshold_sweep"].append({
            "delta": delta,
            "confidence_target": f"{(1 - delta)*100:.0f}% certainty",
            "accuracy": round(acc, 4),
            "mean_questions_asked": round(mean_q, 2),
            "median_questions_asked": median_q,
            "min_questions": min_q,
            "max_questions": max_q,
            "question_reduction_pct": round((10.0 - mean_q) / 10.0 * 100, 2)
        })
        
    adaptive_results["evaluations"][c_name] = cohort_eval

out_scratch = os.path.join(SCRATCH_RESULTS_DIR, "adaptive_questionnaire.json")
with open(out_scratch, "w", encoding="utf-8") as f:
    json.dump(adaptive_results, f, indent=2)

print(f"Adaptive questionnaire experiment completed and saved to {out_scratch}")
