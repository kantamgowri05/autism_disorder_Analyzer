import numpy as np

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

def select_next_question(observed_dict, all_item_marginals, threshold_t):
    all_indices = set(range(10))
    unobs_indices = sorted(list(all_indices - set(observed_dict.keys())))
    if not unobs_indices:
        return None, compute_posterior(observed_dict, all_item_marginals, threshold_t), True
        
    curr_post = compute_posterior(observed_dict, all_item_marginals, threshold_t)
    
    # Deterministic stop conditions
    s_obs = sum(observed_dict.values())
    needed = threshold_t - s_obs
    max_unobs = len(unobs_indices)
    if needed <= 0 or needed > max_unobs:
        return None, curr_post, True
        
    # High confidence stop conditions (delta = 0.05 => 95% certainty)
    if curr_post >= 0.95 or curr_post <= 0.05:
        return None, curr_post, True
        
    curr_ent = compute_binary_entropy(curr_post)
    best_item = None
    max_ig = -1.0
    
    for j in unobs_indices:
        pj = all_item_marginals[j]
        d1 = dict(observed_dict)
        d1[j] = 1
        p1 = compute_posterior(d1, all_item_marginals, threshold_t)
        h1 = compute_binary_entropy(p1)
        
        d0 = dict(observed_dict)
        d0[j] = 0
        p0 = compute_posterior(d0, all_item_marginals, threshold_t)
        h0 = compute_binary_entropy(p0)
        
        exp_ent = pj * h1 + (1.0 - pj) * h0
        ig = curr_ent - exp_ent
        if ig > max_ig:
            max_ig = ig
            best_item = j
            
    return best_item, curr_post, False
