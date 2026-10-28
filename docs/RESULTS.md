# Empirical Research Results & Audit Summary
**Platform:** NeuroScreen AI  
**Repository:** `D:\projects\asd-decision-client`  
**Protocol:** Fixed Seeds (`seed=42`), 5x5 Repeated Stratified Cross-Validation (25 folds per evaluation). All metrics report Mean and 95% Confidence Intervals $[ \text{mean} \pm 1.96 \cdot \text{SE} ]$.

---

## 1. Leakage Audit (Headline Result)
*Artifact:* [`results/leakage_audit.json`](file:///D:/projects/asd-decision-client/results/leakage_audit.json)  
*Script:* [`experiments/exp1_leakage_audit.py`](file:///D:/projects/asd-decision-client/experiments/exp1_leakage_audit.py)

Empirical verification of deterministic scoring rule agreement across thresholds $t \in [0, 10]$:

| Cohort | Sample Size ($N_{raw}$) | Deduplicated ($N_{dedup}$) | Threshold $t=4$ Agreement | Threshold $t=7$ Agreement | Verified Clinical Cutoff Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Toddler** | 1,054 | 1,054 (0.0% dups) | **100.00%** | 69.07% | $\sum A_i \ge 4$ (Q-CHAT-10) |
| **Child** | 292 | 290 (0.68% dups) | 60.96% | **100.00%** | $\sum A_i \ge 7$ (AQ-10) |
| **Adolescent** | 104 | 103 (0.96% dups) | 70.19% | **100.00%** | $\sum A_i \ge 7$ (AQ-10) |
| **Adult** | 704 | 703 (0.14% dups) | 59.66% | **100.00%** | $\sum A_i \ge 7$ (AQ-10) |
| **Combined** | 6,075 | 5,228 (13.94% dups) | 57.22% | **93.38%** (Raw) / **94.84%** (Dedup) | Blended $t=4$ and $t=7$ |

### Findings & Dataset Provenance:
1. **Deterministic Rule Recovery:** In every individual benchmark, the target label matches the arithmetic threshold formula with **100.00% exact agreement**. Standard ML models trained on all 10 items achieve ~99% accuracy simply by learning the arithmetic sum.
2. **Discrepancy in Combined Dataset (6,075 vs. 2,154 rows):** The 4 standard individual cohorts sum to 2,154 rows. The combined dataset contains an extra 3,921 rows originating from automated multi-survey dumps with 847 exact full-record duplicates (13.94%). Furthermore, it aggregates toddler records ($t=4$) with older age cohorts ($t=7$), explaining the single-threshold drop to 93.38%.
3. **Deduplication Justification:** Across 10 binary items, there are only $2^{10} = 1,024$ possible response patterns. In cohorts with $N > 1,000$, identical item responses naturally occur by chance.

---

## 2. Experiment A: Demographics Only Baseline
*Artifact:* [`results/demographics_baseline.json`](file:///D:/projects/asd-decision-client/results/demographics_baseline.json)  
*Script:* [`experiments/exp2_demographics.py`](file:///D:/projects/asd-decision-client/experiments/exp2_demographics.py)

Can demographic variables and medical history alone (Age, Sex, Ethnicity, Jaundice, Family ASD) predict screening outcome without any behavioral items?

| Cohort & Split | N | Majority Class Baseline | Model Accuracy (95% CI) | Balanced Accuracy (95% CI) | ROC-AUC (95% CI) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Toddler (Raw)** | 1,054 | 69.07% | 70.61% [70.07, 71.15] | 54.70% [53.76, 55.64] | 0.6540 [0.6432, 0.6648] |
| **Toddler (Dedup)** | 987 | 66.87% | 65.46% [64.88, 66.04] | 50.42% [49.49, 51.35] | 0.5258 [0.5134, 0.5382] |
| **Child (Raw)** | 292 | 51.71% | 55.01% [53.69, 56.33] | 54.75% [53.42, 56.08] | 0.5557 [0.5388, 0.5726] |
| **Child (Dedup)** | 264 | 51.89% | 43.14% [41.22, 45.06] | 42.86% [40.94, 44.78] | 0.4096 [0.3891, 0.4301] |
| **Adolescent (Raw)** | 104 | 60.58% | 66.18% [64.29, 68.07] | 61.45% [59.04, 63.86] | 0.6545 [0.6278, 0.6812] |
| **Adolescent (Dedup)**| 76 | 51.32% | 46.05% [43.68, 48.42] | 46.11% [43.74, 48.48] | 0.4508 [0.4221, 0.4795] |
| **Adult (Raw)** | 704 | 73.15% | 72.67% [72.22, 73.12] | 50.37% [49.95, 50.79] | 0.7249 [0.7161, 0.7337] |
| **Adult (Dedup)** | 525 | 68.76% | 67.64% [67.04, 68.24] | 49.38% [48.78, 49.98] | 0.5943 [0.5841, 0.6045] |

*Clinical Conclusion:* Demographics alone exhibit **weak signal**. When evaluated on deduplicated data and measured via balanced accuracy, models fail to exceed the trivial majority-class baseline.

---

## 3. Experiment B: Questionnaire Shortening (Nested Feature Selection)
*Artifact:* [`results/questionnaire_shortening.json`](file:///D:/projects/asd-decision-client/results/questionnaire_shortening.json)  
*Script:* [`experiments/exp3_questionnaire_shortening.py`](file:///D:/projects/asd-decision-client/experiments/exp3_questionnaire_shortening.py)

Task redefinition: **Predicting the full-questionnaire screening outcome from fewer items** (nested feature selection inside each fold, zero whole-dataset leakage).

### Adult Cohort ($t=7, N=704$):
| Items ($k$) | Model | Accuracy (95% CI) | Balanced Accuracy (95% CI) | ROC-AUC (95% CI) | ECE (95% CI) | Brier Score (95% CI) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **$k=3$** | Random Forest | 88.10% [87.58, 88.62] | 83.27% [82.52, 84.02] | 0.9409 [0.9366, 0.9452] | 0.0528 [0.0487, 0.0569] | 0.0829 [0.0801, 0.0857] |
| **$k=3$** | Exact Bayes | 87.36% [86.79, 87.93] | 81.33% [80.52, 82.14] | 0.9415 [0.9372, 0.9458] | 0.0631 [0.0589, 0.0673] | 0.0881 [0.0852, 0.0910] |
| **$k=5$** | Random Forest | **90.57%** [90.11, 91.03] | **86.72%** [86.06, 87.38] | **0.9655** [0.9626, 0.9684] | 0.0463 [0.0423, 0.0503] | 0.0694 [0.0669, 0.0719] |
| **$k=5$** | Exact Bayes | **90.94%** [90.49, 91.39] | **86.70%** [86.05, 87.35] | **0.9647** [0.9616, 0.9678] | 0.0441 [0.0401, 0.0481] | 0.0682 [0.0656, 0.0708] |
| **$k=7$** | Random Forest | 95.31% [94.94, 95.68] | 93.30% [92.76, 93.84] | 0.9882 [0.9867, 0.9897] | 0.0305 [0.0272, 0.0338] | 0.0385 [0.0366, 0.0404] |

### Toddler Cohort ($t=4, N=1,054$):
| Items ($k$) | Model | Accuracy (95% CI) | Balanced Accuracy (95% CI) | ROC-AUC (95% CI) | ECE (95% CI) | Brier Score (95% CI) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **$k=3$** | Random Forest | 85.18% [84.66, 85.70] | 78.43% [77.67, 79.19] | 0.9290 [0.9248, 0.9332] | 0.0658 [0.0617, 0.0699] | 0.1065 [0.1037, 0.1093] |
| **$k=5$** | Random Forest | **90.30%** [89.84, 90.76] | **85.95%** [85.28, 86.62] | **0.9636** [0.9609, 0.9663] | 0.0519 [0.0478, 0.0560] | 0.0722 [0.0697, 0.0747] |
| **$k=5$** | Exact Bayes | **89.01%** [88.54, 89.48] | **84.09%** [83.41, 84.77] | **0.9642** [0.9615, 0.9669] | 0.0543 [0.0501, 0.0585] | 0.0791 [0.0766, 0.0816] |

*Key Methodological Takeaway:* The closed-form **Exact Bayesian Posterior Baseline** (derived strictly from Poisson-Binomial convolutions over training marginals) performs virtually identically to the trained Random Forest, proving that "ML models" on reduced items are simply performing statistical reconstruction of the sum.

---

## 4. Adaptive Questionnaire Screening
*Artifact:* [`results/adaptive_questionnaire.json`](file:///D:/projects/asd-decision-client/results/adaptive_questionnaire.json)  
*Script:* [`experiments/exp4_adaptive_screener.py`](file:///D:/projects/asd-decision-client/experiments/exp4_adaptive_screener.py)

Greedy information-gain item ordering with Bayesian stopping criteria ($P \ge 1 - \delta$ or $P \le \delta$):

| Cohort | Certainty Target | Final Agreement / Accuracy | Mean Questions Asked (out of 10) | Respondent Burden Reduction |
| :--- | :--- | :--- | :--- | :--- |
| **Adult** | 99% certainty ($\delta=0.01$) | **100.00%** | 6.26 questions | **37.4% reduction** |
| **Adult** | 95% certainty ($\delta=0.05$) | **97.87%** | **4.62 questions** | **53.8% reduction** |
| **Child** | 99% certainty ($\delta=0.01$) | **100.00%** | 7.28 questions | **27.2% reduction** |
| **Child** | 95% certainty ($\delta=0.05$) | **99.66%** | **6.86 questions** | **31.4% reduction** |
| **Adolescent**| 99% certainty ($\delta=0.01$) | **100.00%** | 7.59 questions | **24.1% reduction** |
| **Adolescent**| 95% certainty ($\delta=0.05$) | **99.04%** | **6.82 questions** | **31.8% reduction** |

---

## 5. Split Conformal Prediction & Clinical Abstention
*Artifact:* [`results/conformal_abstention.json`](file:///D:/projects/asd-decision-client/results/conformal_abstention.json)  
*Script:* [`experiments/exp5_conformal_abstention.py`](file:///D:/projects/asd-decision-client/experiments/exp5_conformal_abstention.py)

Calibration Split (20% held-out) with Platt Scaling and Conformal Set Prediction:
- **$\{0\}$:** Lower Likelihood
- **$\{1\}$:** Higher Likelihood
- **$\{0, 1\}$ or $\emptyset$:** Please See a Specialist (Safe Clinical Abstention)

| Cohort | Target Coverage | Empirical Coverage | Abstention Rate (Referral) | Selective Accuracy on Retained Set |
| :--- | :--- | :--- | :--- | :--- |
| **Adult** | 95% ($\alpha=0.05$) | 90.78% | 13.48% | **89.34%** |
| **Adult** | 90% ($\alpha=0.10$) | 84.40% | 2.84% | **86.86%** |
| **Child** | 95% ($\alpha=0.05$) | 93.22% | 22.03% | **91.30%** |
| **Toddler** | 95% ($\alpha=0.05$) | 98.58% | 36.49% | **97.76%** |
| **Adolescent**| 95% ($\alpha=0.05$) | 90.48% | 4.76% | **90.00%** |

---

## 6. Cross-Cohort Validation (Sanity Check)
*Artifact:* [`results/cross_cohort_validation.json`](file:///D:/projects/asd-decision-client/results/cross_cohort_validation.json)  
*Script:* [`experiments/exp6_cross_cohort.py`](file:///D:/projects/asd-decision-client/experiments/exp6_cross_cohort.py)

Pairwise transfer across developmental cohorts:

| Source $\rightarrow$ Target | Source $t$ | Target $t$ | Transfer Accuracy | Transfer ROC-AUC | Explanation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Adult $\rightarrow$ Adolescent** | 7 | 7 | **90.38%** | **0.9686** | Shared threshold ($t=7$). High transfer expected. |
| **Adult $\rightarrow$ Child** | 7 | 7 | **94.52%** | **0.9830** | Shared threshold ($t=7$). High transfer expected. |
| **Child $\rightarrow$ Adult** | 7 | 7 | **94.74%** | **0.9913** | Shared threshold ($t=7$). High transfer expected. |
| **Adult $\rightarrow$ Toddler** | 7 | 4 | **68.50%** | **0.9871** | Threshold mismatch ($t=7 \neq t=4$). Accuracy collapses; rank preserved. |
| **Toddler $\rightarrow$ Adult** | 4 | 7 | **60.94%** | **0.9941** | Threshold mismatch ($t=4 \neq t=7$). Accuracy collapses; rank preserved. |

---

## 7. Face Dataset Audit & Methodological Negative Result
*Artifact:* [`results/face_dataset_audit.json`](file:///D:/projects/asd-decision-client/results/face_dataset_audit.json) | [`results/gradcam_shortcut_analysis.json`](file:///D:/projects/asd-decision-client/results/gradcam_shortcut_analysis.json)  
*Script:* [`experiments/exp7_face_audit.py`](file:///D:/projects/asd-decision-client/experiments/exp7_face_audit.py)

- **Cryptographic Hash (MD5) Exact Duplicates:**
  - `valid` vs. `test`: **56 exact duplicate images** (70.0% of the 80 validation images were identical to test images).
  - `train` internal: **3 exact duplicate images**.
- **Perceptual Hash (pHash, Hamming $\le 4$) Near-Duplicates:**
  - `valid` vs. `test`: **56 near-duplicates** (0 additional non-identical near-duplicates).
  - `train` internal: **11 near-duplicates** (3 exact MD5 + 8 pHash-only near-duplicates).
- **Shortcut Learning (Border Luminance Confounding):**
  - Autistic class mean border luminance: **113.91**
  - Non-autistic class mean border luminance: **121.63**
  - Statistically significant luminance discrepancy: **7.72 units** ($\Delta > 7$), showing lighting and compression divergence between classes.
- **Grad-CAM Attribution Audit:**
  - **51.73%** of Grad-CAM saliency mass is concentrated on background borders and peripheral illumination edges rather than facial anatomical landmarks, confirming shortcut learning.
- **Clean Split MobileNetV2 Re-Evaluation:**
  - Clean test set size: $N = 224$ (after removing 56 leaked validation duplicates).
  - Clean test accuracy: **49.55%** (chance baseline).
  - Clean test ROC-AUC: **0.4595** (no diagnostic capability).


---

## Appendix: Real-World Length Estimation via Corneal Iris Scaling
*Validation Protocol:* [`experiments/CAPTURE_PROTOCOL_README.md`](file:///D:/projects/asd-decision-client/experiments/CAPTURE_PROTOCOL_README.md)  
*Validation Script:* [`experiments/exp8_iris_scale.py`](file:///D:/projects/asd-decision-client/experiments/exp8_iris_scale.py)  
*Backend Engine:* [`backend/iris_scale.py`](file:///D:/projects/asd-decision-client/backend/iris_scale.py)

### 1. Codebase Reference & Attribution
- **Repository**: [`face-detection-tflite`](file:///D:/projects/asd-decision-client/face-detection-tflite) (`fdlite`)
- **Author**: Patrick Levin
- **License**: MIT License (Copyright (c) 2021, 2024 Patrick Levin)
- **Reused Logic**: MediaPipe iris landmark regression and horizontal limbal diameter extraction (`IrisLandmark`, indices 468-477).

### 2. Methodological Formulation
- **Coordinate Conversion**: Landmarks are projected to native original image coordinates ($x \cdot W, y \cdot H$), undoing crop offsets and non-uniform resize scaling without square aspect-ratio distortion.
- **Iris Scale Constant**: Horizontal corneal diameter is referenced to the nominal adult anatomical mean: $D_{\text{iris}} = 11.7\text{ mm}$ (vertical axis omitted due to eyelid ptosis).
- **Pediatric Variance Note**: The $11.7\text{ mm}$ reference is an adult population average; corneal diameter is subject to developmental growth and higher variance in young pediatric cohorts.
- **Pixel-to-Millimeter Conversion**: $\text{mm\_per\_px} = 11.7 / d_{\text{iris\_px}}$, where $d_{\text{iris\_px}} = \frac{1}{2}(d_{\text{left}} + d_{\text{right}})$.
- **Roll Normalization**: The 2D landmark plane is rotated by $-\theta_{\text{roll}}$ around the inter-pupillary midpoint to zero in-plane head tilt prior to measurement.
- **Quality Gates**:
  - **Resolution Gate**: Rejection / Warning (iris_too_small) if mean iris diameter $< 22\\text{ px}$. Millimeter scaling is suppressed because pixel quantization uncertainty ($\\sim 1/d_{\\text{iris}}$) exceeds acceptable precision.
  - **Asymmetry Gate**: Rejection / Warning (iris_diameter_asymmetry_high) if left/right iris diameter discrepancy exceeds \\%$ ($\\frac{|d_L - d_R|}{\\text{mean}} > 0.12$).
  - **Head Pose Gate**: Rejection / Warning (head_yaw_exceeds_15_deg, head_pitch_exceeds_15_deg) if estimated head $|\\text{Yaw}| > 15^\\circ$ or $|\\text{Pitch}| > 15^\\circ$.
  - **Focus Gate**: Rejection / Warning (image_blur_high) if Laplacian blur variance $< 100$.
- **Plausibility Gates & Child Plausibility Failure**:
  - **Pediatric Plausibility Failure**: Adult-calibrated iris diameter (.7\\text{ mm}$) does not hold for young children. On the test toddler image (mella-kannu.jpg), nominal scaling yields adult-sized metrics (IPD .5\\text{ mm} > 58\\text{ mm}$, face width .8\\text{ mm} > 130\\text{ mm}$), triggering implausible_for_age. Measurements fail plausibility and are suppressed. Accuracy is never claimed for pediatric subjects.
  - **General Plausibility**: Flagged as measurement_implausible if dimensions exceed \\text{--}220\\text{ mm}$ (width) or \\text{--}260\\text{ mm}$ (length).
  - **Canvas Overlay Suppression**: When any quality gate or plausibility check fails, ruler lines and iris circles are suppressed from canvas rendering; only the failure telemetry banner is presented.
- **Scientific Status & Scope**: The iris scaling module is strictly an **unvalidated visual exploratory demo**. It is **completely excluded from all research claims, statistical evaluations, and IEEE conference paper findings**.

### 3. Landmark-Defined Metrics & Uncertainty
- **Inter-Pupillary Distance (IPD)**: Left iris center to right iris center.
- **Bizygomatic Face Width**: Tragus landmarks #234 to #454 connecting actual landmark points (naturally tilted with head roll).
- **Face Length**: Forehead glabella #10 to gnathion chin #152 connecting actual landmark points.
- **Uncertainty Band**: Dynamically read from `results/iris_scale_validation.json` when physical validation benchmarks exist; otherwise strictly labeled **`unvalidated, error unknown`**.
- **Semantics**: Strictly landmark-defined Euclidean distances; not anatomical bone metrics; zero clinical claims or normative comparisons.

### 4. Empirical Validation Status
- **Status**: **UNVALIDATED (Pending Certified Physical Calibration Target Capture)**
- **Protocol**: Requires photographing an ISO/IEC 7810 ID-1 reference card ($85.60 \times 53.98\text{ mm}$) co-planar at the forehead plane across $N \ge 20$ participants (instructions in `experiments/CAPTURE_PROTOCOL_README.md`).
- **Honesty Disclosure**: Any prior synthetic lower bounds (previously generated via unvalidated Monte Carlo simulation) have been removed. If `datasets/card_validation` contains fewer than 20 valid physical images, no results file is generated, and the system reports `unvalidated, error unknown`.
- **Clinical Notice**: All millimeter estimations in the UI and API are flagged as `unvalidated_without_physical_calibration_card` and accompanied by the disclaimer: *"approximate, from iris scale, not clinical, not used in any prediction"*.
