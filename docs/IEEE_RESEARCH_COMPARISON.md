# Empirical Research Comparison & Audit Summary

## Title: De-biasing Autism Spectrum Screening: From Empirical Rule Recovery to Questionnaire Shortening, Adaptive Triage, and Conformal Abstention

---

## 1. Empirical Verification 1: Arithmetic Scoring Rule Agreement in 10-Item AQ Benchmarks

Our audit empirically verified the agreement between the arithmetic sum of items $\sum_{i=1}^{10} A_i \ge t$ and dataset screening labels across all published public benchmarks:

| Cohort | Dataset Source | Raw Sample Size | Established Cutoff | Exact Agreement with Rule |
| :--- | :--- | :--- | :--- | :--- |
| **Toddler** | Kaggle (Q-CHAT-10) | 1,054 | $\sum A_i \ge 4$ | **100.00%** (1,054 / 1,054) |
| **Child** | UCI 419 (AQ-Child) | 292 | $\sum A_i \ge 7$ | **100.00%** (292 / 292) |
| **Adolescent** | UCI 420 (AQ-Adolescent) | 104 | $\sum A_i \ge 7$ | **100.00%** (104 / 104) |
| **Adult** | UCI 426 (AQ-Adult) | 704 | $\sum A_i \ge 7$ | **100.00%** (704 / 704) |
| **Combined** | Multi-Age Aggregation | 6,075 | $\sum A_i \ge 7$ | **93.38%** (5,673 / 6,075) |

### Methodological Context:
In clinical screening practice, AQ-10 and Q-CHAT-10 scoring guidelines assign the screening outcome based on scoring $\ge 7$ (or $\ge 4$ for toddlers). Models evaluated on all 10 items recover this deterministic rule with ~99% accuracy. Publications reporting high machine learning performance on full 10-item vectors merely recover the scoring rubric.

---

## 2. Genuine Non-Trivial Experimental Formulations

### Experiment A: Demographics & Medical History Alone (Zero Questionnaire Items)
Can family history of ASD, neonatal jaundice, sex, and age alone predict screening outcome without any behavioral items?
* **Toddler**: Accuracy = 70.61% [95% CI: 70.07, 71.15] | Balanced Acc = 54.70% | ROC-AUC = 0.6540 [0.6432, 0.6648] (vs Majority Class: 69.07%)
* **Child**: Accuracy = 55.01% [95% CI: 53.69, 56.33] | Balanced Acc = 54.75% | ROC-AUC = 0.5557 [0.5388, 0.5726] (vs Majority Class: 51.71%)
* **Adolescent**: Accuracy = 66.18% [95% CI: 64.29, 68.07] | Balanced Acc = 61.45% | ROC-AUC = 0.6545 [0.6278, 0.6812] (vs Majority Class: 60.58%)
* **Adult**: Accuracy = 72.67% [95% CI: 72.22, 73.12] | Balanced Acc = 50.37% | ROC-AUC = 0.7249 [0.7161, 0.7337] (vs Majority Class: 73.15%)
* **Finding:** Demographic and medical history alone provide only **weak signal** that barely surpasses majority-class guessing when balanced accuracy is considered.

---

### Experiment B: Questionnaire Shortening (Nested Feature Selection)
*Task:* Predicting the full-questionnaire screening outcome from fewer items ($k=3, 5, 7$). Item ranking was conducted strictly within each training fold (5x5 repeated stratified CV) to prevent feature selection leakage:

| Cohort | Subset | Random Forest Acc (95% CI) | Random Forest AUC (95% CI) | Exact Bayesian Baseline AUC |
| :--- | :--- | :--- | :--- | :--- |
| **Adult** | $k=3$ | 88.10% [87.58, 88.62] | 0.9409 [0.9366, 0.9452] | 0.9415 [0.9372, 0.9458] |
| **Adult** | $k=5$ | 90.57% [90.11, 91.03] | **0.9655** [0.9626, 0.9684] | **0.9647** [0.9616, 0.9678] |
| **Toddler** | $k=3$ | 85.18% [84.66, 85.70] | 0.9290 [0.9248, 0.9332] | 0.9300 [0.9257, 0.9343] |
| **Toddler** | $k=5$ | 90.30% [89.84, 90.76] | **0.9636** [0.9609, 0.9663] | **0.9642** [0.9615, 0.9669] |

*Finding:* An exact Bayesian posterior baseline (using Poisson-Binomial convolutions over training marginals) performs virtually identically to the trained Random Forest, confirming that shortened questionnaire triage functions via statistical reconstruction of the sum.

---

### Experiment C: Adaptive Bayesian Questioning
Using greedy information-gain item ordering with Bayesian stopping criteria:
* **Adult**: Achieves **97.87% agreement** requiring only **4.62 questions on average** (53.8% burden reduction).
* **Child**: Achieves **99.66% agreement** requiring **6.86 questions on average** (31.4% burden reduction).
* **Adolescent**: Achieves **99.04% agreement** requiring **6.82 questions on average** (31.8% burden reduction).

---

### Experiment D: Conformal Prediction & Clinical Abstention
Using a 20% held-out calibration set with split conformal prediction (target coverage 95%, $\alpha=0.05$):
* **Adult**: Selective Accuracy = **89.34%** on retained cases, with a 13.48% abstention (referral) rate.
* **Toddler**: Selective Accuracy = **97.76%** on retained cases, with a 36.49% abstention rate.
* Ambiguous prediction sets ($\{0, 1\}$ or $\emptyset$) map directly to *"Please See a Specialist"* to prevent automated false classification.

---

## 3. Dataset Provenance & Vision Audit

1. **Facial Image Leakage Audit:**
   * MD5 hash audit confirmed 0 duplicate images between Train and Test sets.
   * However, **56 duplicate images** were detected between Validation and Test splits (70.0% of the validation split).
   * Perceptual hash (pHash, Hamming distance $\le 4$) confirmed 56 near-duplicates between valid and test, plus 11 internal duplicates in train.
2. **Combined Dataset Origin:**
   * The 6,075-row combined dataset contains an additional 3,921 rows beyond the 2,154 standard benchmark samples, including **847 duplicate rows (13.94%)**.
3. **Multimodal Fusion & Iris Telemetry Status:**
   * Because no public dataset contains paired facial images and clinical questionnaires for the *same individual*, multimodal fusion and webcam single-frame telemetry are classified as **unvalidated software prototypes**, excluded from empirical diagnostic claims.
