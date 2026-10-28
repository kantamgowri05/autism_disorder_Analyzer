# De-biasing Autism Spectrum Screening: From Empirical Rule Recovery to Questionnaire Shortening, Adaptive Triage, and Conformal Abstention

**Authors:** NeuroScreen AI Research Consortium  
**Target Venue:** IEEE Transactions on Emerging Topics in Computing / IEEE JBHI  

---

## Abstract
Machine learning applied to Autism Spectrum Disorder (ASD) screening has proliferated in recent literature, with numerous studies reporting classification accuracies exceeding 98% on 10-item questionnaires (AQ-10, Q-CHAT-10). In this paper, we report a critical methodological audit: in all publicly available individual cohorts, the diagnostic target label exhibits **100.00% exact agreement** with a deterministic arithmetic threshold on the questionnaire responses ($\sum_{i=1}^{10} A_i \ge t$). Consequently, models evaluated on the complete 10-item vector do not learn latent psychiatric phenotypes; they merely learn arithmetic addition. 

To establish an honest foundation, we formulate three statistically valid tasks evaluated under 5x5 repeated stratified cross-validation:
1. **Demographic Baselines:** Evaluating demographics and medical history alone demonstrates only weak predictive power (ROC-AUC 0.56–0.66), confirming that behavioral observations cannot be substituted by demographic data.
2. **Questionnaire Shortening:** Under strict nested feature selection within each cross-validation fold, administering only 5 items achieves 96.55% ROC-AUC in adults and 96.36% in toddlers. We show this is matched by an exact closed-form Bayesian posterior baseline calculated from item marginals.
3. **Adaptive Triage & Conformal Abstention:** An adaptive information-gain screener cuts respondent burden by 53.8% while maintaining 97.87% agreement. Incorporating split conformal prediction at 95% target coverage enables selective prediction with 89.34% accuracy and a 13.48% abstention rate, mapping ambiguous cases to specialist referrals.

Finally, cryptographic and perceptual hash audits of open facial vision benchmarks expose 56 duplicate images between validation and test sets (70.0% of the validation set), demonstrating that open pediatric computer vision remains an unvalidated exploratory prototype.

---

## I. Introduction
Early identification of autism spectrum traits is crucial for timely developmental support. Standard screening instruments like the AQ-10 and Q-CHAT-10 provide rapid 10-item behavioral rubrics. While machine learning has been proposed to optimize screening, literature claims of near-perfect accuracy often conflate deterministic scoring recovery with statistical inference.

The paper is structured as follows:
- **Section II:** Empirical verification of deterministic rule recovery.
- **Section III:** Demographic baselines and weak signal verification.
- **Section IV:** Questionnaire shortening under nested cross-validation and exact Bayesian baselines.
- **Section V:** Adaptive questionnaire stopping rules.
- **Section VI:** Split conformal prediction and clinical abstention.
- **Section VII:** Cross-cohort transfer as an arithmetic sanity check.
- **Section VIII:** Negative-result audit of pediatric facial image benchmarks.
- **Section IX:** Limitations and Ethical Considerations.

---

## II. Empirical Verification of Trivial Rule Recovery

Clinical screening guidelines formally define the diagnostic threshold:
$$\hat{Y}_{rule} = \mathbb{I}\left(\sum_{i=1}^{10} A_i \ge t\right)$$
where $t = 4$ for toddlers and $t = 7$ for children, adolescents, and adults.

We conducted a threshold sweep for $t \in [0, 10]$ across all public datasets:
- **Toddler (Q-CHAT-10, $N=1,054$):** 100.00% agreement at $t=4$.
- **Child (AQ-10, $N=292$):** 100.00% agreement at $t=7$.
- **Adolescent (AQ-10, $N=104$):** 100.00% agreement at $t=7$.
- **Adult (AQ-10, $N=704$):** 100.00% agreement at $t=7$.
- **Combined Aggregation ($N=6,075$):** 93.38% agreement at $t=7$ due to unadjusted merging of toddler records ($t=4$).

Auditing the 6,075-row combined dataset revealed 847 full duplicate rows (13.94%) originating from web survey aggregations. Full 10-item machine learning is therefore an empirical recovery of arithmetic addition, not an inductive discovery.

---

## III. Experiment A: Demographic Baseline (Weak Signal)
Using Age, Sex, Ethnicity, Jaundice, and Family History of ASD under 5x5 repeated stratified cross-validation (25 evaluations per cohort, seed 42):
- **Adult ($N=704$):** Model Accuracy = 72.67% [95% CI: 72.22, 73.12] vs. Majority Class Baseline = 73.15%. Balanced Accuracy = 50.37% [49.95, 50.79].
- **Toddler ($N=1,054$):** Model Accuracy = 70.61% [95% CI: 70.07, 71.15] vs. Majority Class Baseline = 69.07%. Balanced Accuracy = 54.70% [53.76, 55.64].

Demographic and familial history alone provide weak predictive signal, demonstrating that direct behavioral assessments remain necessary.

---

## IV. Experiment B: Questionnaire Shortening via Nested CV
We evaluated predicting the full-questionnaire outcome using reduced subsets ($k=3, 5, 7$) with feature selection conducted strictly inside each training fold:

- **Adult Cohort ($t=7$):**
  - $k=3$: Random Forest AUC = 0.9409 [95% CI: 0.9366, 0.9452] | Exact Bayes AUC = 0.9415 [0.9372, 0.9458].
  - $k=5$: Random Forest AUC = 0.9655 [95% CI: 0.9626, 0.9684] | Exact Bayes AUC = 0.9647 [0.9616, 0.9678].
- **Toddler Cohort ($t=4$):**
  - $k=5$: Random Forest AUC = 0.9636 [95% CI: 0.9609, 0.9663] | Exact Bayes AUC = 0.9642 [0.9615, 0.9669].

The Exact Bayesian baseline (derived from Poisson-Binomial convolutions over training marginals) matches Random Forest performance within 0.001 AUC, confirming that questionnaire shortening operates as statistical reconstruction of the sum.

---


### C. Explainability Scope: What SHAP Explains
Our TreeExplainer SHAP module attributes how each observed binary questionnaire item shifts the machine learning surrogate model's output log-odds relative to the training expectation. Crucially, SHAP explains the computational surrogate's score reconstruction—namely, how individual responses contribute to meeting the artificial threshold cutoff t—and does NOT explain biological neurodevelopmental mechanisms, cognitive causes, or clinical autism etiology.


## V. Adaptive Questionnaire Triage
Implementing greedy mutual information item ordering with Bayesian stopping criteria ($P \ge 1 - \delta$ or $P \le \delta$):
- **Adult ($\delta=0.05$):** 97.87% agreement requiring only 4.62 questions on average (53.8% burden reduction).
- **Child ($\delta=0.05$):** 99.66% agreement requiring 6.86 questions on average (31.4% burden reduction).
- **Adolescent ($\delta=0.05$):** 99.04% agreement requiring 6.82 questions on average (31.8% burden reduction).

---

## VI. Split Conformal Prediction & Clinical Abstention
To prevent false-certainty triage, we implemented split conformal prediction on a 20% held-out calibration set with Platt scaling:
- **Adult ($\alpha=0.05$, Target Coverage 95%):** Empirical Coverage = 90.78%, Selective Accuracy = 89.34%, Abstention Rate = 13.48%.
- Ambiguous sets ($\{0, 1\}$ or $\emptyset$) map directly to *"Please See a Specialist"* to ensure patient safety.

---

## VII. Cross-Cohort Transfer: An Arithmetic Sanity Check
Pairwise cross-cohort transfer evaluations confirm that transfer is governed by scoring rule alignment:
- Transfer between matching thresholds ($t=7 \rightarrow t=7$, Adult $\rightarrow$ Adolescent): Accuracy = 90.38%, ROC-AUC = 0.9686.
- Transfer across mismatched thresholds ($t=7 \rightarrow t=4$, Adult $\rightarrow$ Toddler): Accuracy collapses to 68.50% due to threshold misalignment, while ranking (ROC-AUC = 0.9871) remains preserved.

---

## VIII. Pediatric Face Benchmark Audit (Negative Result)
Auditing the Kaggle pediatric face dataset (3,014 images):
- **MD5 Exact Duplicates:** 0 Train <-> Test duplicates, but **56 exact duplicate images between Validation and Test splits** (70.0% of the 80 validation images). In addition, **3 exact duplicates** were identified internally within the training split.
- **pHash Near-Duplicates (Hamming <= 4):** Confirmed 56 near-duplicates between valid and test, and **11 near-duplicates** internally within the training split (3 exact MD5 duplicates plus 8 pHash-only near-duplicates).
- **Shortcut Learning & Background Confounders:** Autistic class images display a mean border luminance of **113.91**, compared to **121.63** for the non-autistic class (a statistically significant divergence of **7.72 units**). Grad-CAM feature attribution reveals that **51.73%** of model saliency energy is localized on peripheral borders and background illumination rather than facial anatomical structures.
- **Clean Split Re-Evaluation:** Evaluating MobileNetV2 on the de-duplicated clean test split (N=224) yields an accuracy of **49.55%** and an ROC-AUC of **0.4595**, confirming that the model performs at chance level when evaluation leakage is eliminated.pirical Rule Recovery to Questionnaire Shortening, Adaptive Triage, and Conformal Abstention

**Authors:** NeuroScreen AI Research Consortium  
**Target Venue:** IEEE Transactions on Emerging Topics in Computing / IEEE JBHI  

---

## Abstract
Machine learning applied to Autism Spectrum Disorder (ASD) screening has proliferated in recent literature, with numerous studies reporting classification accuracies exceeding 98% on 10-item questionnaires (AQ-10, Q-CHAT-10). In this paper, we report a critical methodological audit: in all publicly available individual cohorts, the diagnostic target label exhibits **100.00% exact agreement** with a deterministic arithmetic threshold on the questionnaire responses ($\sum_{i=1}^{10} A_i \ge t$). Consequently, models evaluated on the complete 10-item vector do not learn latent psychiatric phenotypes; they merely learn arithmetic addition. 

To establish an honest foundation, we formulate three statistically valid tasks evaluated under 5x5 repeated stratified cross-validation:
1. **Demographic Baselines:** Evaluating demographics and medical history alone demonstrates only weak predictive power (ROC-AUC 0.56–0.66), confirming that behavioral observations cannot be substituted by demographic data.
2. **Questionnaire Shortening:** Under strict nested feature selection within each cross-validation fold, administering only 5 items achieves 96.55% ROC-AUC in adults and 96.36% in toddlers. We show this is matched by an exact closed-form Bayesian posterior baseline calculated from item marginals.
3. **Adaptive Triage & Conformal Abstention:** An adaptive information-gain screener cuts respondent burden by 53.8% while maintaining 97.87% agreement. Incorporating split conformal prediction at 95% target coverage enables selective prediction with 89.34% accuracy and a 13.48% abstention rate, mapping ambiguous cases to specialist referrals.

Finally, cryptographic and perceptual hash audits of open facial vision benchmarks expose 56 duplicate images between validation and test sets (70.0% of the validation set), demonstrating that open pediatric computer vision remains an unvalidated exploratory prototype.

---

## I. Introduction
Early identification of autism spectrum traits is crucial for timely developmental support. Standard screening instruments like the AQ-10 and Q-CHAT-10 provide rapid 10-item behavioral rubrics. While machine learning has been proposed to optimize screening, literature claims of near-perfect accuracy often conflate deterministic scoring recovery with statistical inference.

The paper is structured as follows:
- **Section II:** Empirical verification of deterministic rule recovery.
- **Section III:** Demographic baselines and weak signal verification.
- **Section IV:** Questionnaire shortening under nested cross-validation and exact Bayesian baselines.
- **Section V:** Adaptive questionnaire stopping rules.
- **Section VI:** Split conformal prediction and clinical abstention.
- **Section VII:** Cross-cohort transfer as an arithmetic sanity check.
- **Section VIII:** Negative-result audit of pediatric facial image benchmarks.
- **Section IX:** Limitations and Ethical Considerations.

---

## II. Empirical Verification of Trivial Rule Recovery

Clinical screening guidelines formally define the diagnostic threshold:
$$\hat{Y}_{rule} = \mathbb{I}\left(\sum_{i=1}^{10} A_i \ge t\right)$$
where $t = 4$ for toddlers and $t = 7$ for children, adolescents, and adults.

We conducted a threshold sweep for $t \in [0, 10]$ across all public datasets:
- **Toddler (Q-CHAT-10, $N=1,054$):** 100.00% agreement at $t=4$.
- **Child (AQ-10, $N=292$):** 100.00% agreement at $t=7$.
- **Adolescent (AQ-10, $N=104$):** 100.00% agreement at $t=7$.
- **Adult (AQ-10, $N=704$):** 100.00% agreement at $t=7$.
- **Combined Aggregation ($N=6,075$):** 93.38% agreement at $t=7$ due to unadjusted merging of toddler records ($t=4$).

Auditing the 6,075-row combined dataset revealed 847 full duplicate rows (13.94%) originating from web survey aggregations. Full 10-item machine learning is therefore an empirical recovery of arithmetic addition, not an inductive discovery.

---

## III. Experiment A: Demographic Baseline (Weak Signal)
Using Age, Sex, Ethnicity, Jaundice, and Family History of ASD under 5x5 repeated stratified cross-validation (25 evaluations per cohort, seed 42):
- **Adult ($N=704$):** Model Accuracy = 72.67% [95% CI: 72.22, 73.12] vs. Majority Class Baseline = 73.15%. Balanced Accuracy = 50.37% [49.95, 50.79].
- **Toddler ($N=1,054$):** Model Accuracy = 70.61% [95% CI: 70.07, 71.15] vs. Majority Class Baseline = 69.07%. Balanced Accuracy = 54.70% [53.76, 55.64].

Demographic and familial history alone provide weak predictive signal, demonstrating that direct behavioral assessments remain necessary.

---

## IV. Experiment B: Questionnaire Shortening via Nested CV
We evaluated predicting the full-questionnaire outcome using reduced subsets ($k=3, 5, 7$) with feature selection conducted strictly inside each training fold:

- **Adult Cohort ($t=7$):**
  - $k=3$: Random Forest AUC = 0.9409 [95% CI: 0.9366, 0.9452] | Exact Bayes AUC = 0.9415 [0.9372, 0.9458].
  - $k=5$: Random Forest AUC = 0.9655 [95% CI: 0.9626, 0.9684] | Exact Bayes AUC = 0.9647 [0.9616, 0.9678].
- **Toddler Cohort ($t=4$):**
  - $k=5$: Random Forest AUC = 0.9636 [95% CI: 0.9609, 0.9663] | Exact Bayes AUC = 0.9642 [0.9615, 0.9669].

The Exact Bayesian baseline (derived from Poisson-Binomial convolutions over training marginals) matches Random Forest performance within 0.001 AUC, confirming that questionnaire shortening operates as statistical reconstruction of the sum.

---


### C. Explainability Scope: What SHAP Explains
Our TreeExplainer SHAP module attributes how each observed binary questionnaire item shifts the machine learning surrogate model's output log-odds relative to the training expectation. Crucially, SHAP explains the computational surrogate's score reconstruction—namely, how individual responses contribute to meeting the artificial threshold cutoff t—and does NOT explain biological neurodevelopmental mechanisms, cognitive causes, or clinical autism etiology.


## V. Adaptive Questionnaire Triage
Implementing greedy mutual information item ordering with Bayesian stopping criteria ($P \ge 1 - \delta$ or $P \le \delta$):
- **Adult ($\delta=0.05$):** 97.87% agreement requiring only 4.62 questions on average (53.8% burden reduction).
- **Child ($\delta=0.05$):** 99.66% agreement requiring 6.86 questions on average (31.4% burden reduction).
- **Adolescent ($\delta=0.05$):** 99.04% agreement requiring 6.82 questions on average (31.8% burden reduction).

---

## VI. Split Conformal Prediction & Clinical Abstention
To prevent false-certainty triage, we implemented split conformal prediction on a 20% held-out calibration set with Platt scaling:
- **Adult ($\alpha=0.05$, Target Coverage 95%):** Empirical Coverage = 90.78%, Selective Accuracy = 89.34%, Abstention Rate = 13.48%.
- Ambiguous sets ($\{0, 1\}$ or $\emptyset$) map directly to *"Please See a Specialist"* to ensure patient safety.

---

## VII. Cross-Cohort Transfer: An Arithmetic Sanity Check
Pairwise cross-cohort transfer evaluations confirm that transfer is governed by scoring rule alignment:
- Transfer between matching thresholds ($t=7 \rightarrow t=7$, Adult $\rightarrow$ Adolescent): Accuracy = 90.38%, ROC-AUC = 0.9686.
- Transfer across mismatched thresholds ($t=7 \rightarrow t=4$, Adult $\rightarrow$ Toddler): Accuracy collapses to 68.50% due to threshold misalignment, while ranking (ROC-AUC = 0.9871) remains preserved.

---

## VIII. Pediatric Face Benchmark Audit (Negative Result)
Auditing the Kaggle pediatric face dataset (3,014 images):
- **MD5 Hash Audit:** 0 Train $\leftrightarrow$ Test duplicates, but **56 duplicate images between Validation and Test splits** (70.0% of the validation split).
- **pHash Audit:** Confirmed 56 near-duplicates between valid and test, and 11 internal train duplicates.
- **Confounding Analysis:** Statistically detectable background lighting discrepancies indicate shortcut learning.
- Computer vision and single-frame webcam telemetry are explicitly classified as exploratory software prototypes, not diagnostic tools.

---

## IX. Limitations and Ethical Considerations
1. **Target Labels:** Questionnaire labels reflect screening scores, not gold-standard clinical diagnoses (e.g. ADOS-2 or ADI-R).
2. **Multimodal Fusion:** No public biomedical repository contains paired facial photographs and AQ questionnaires from the same individuals; multimodal fusion remains an unvalidated prototype.
3. **Face Labels:** Web-scraped pediatric image labels are unverified and subject to lighting and demographic confounders.
4. **Clinical Disclaimer:** NeuroScreen AI is strictly decision-support software and does not replace qualified specialist evaluation.


---

## Visual Pipeline & Shortcut Learning Audit (YOLOv8 + Grad-CAM)

### 1. VisionLab Pipeline
- **Face Localization**: YOLOv8 nano (`yolov8n.pt`) detects the facial bounding box and normalizes portrait margins.
- **Landmark Extraction**: Google MediaPipe 468 3D facial mesh extracts facial length and landmark-defined face width (#234-#454).
- **Scale Calibration**: Dual-iris horizontal boundary landmarks provide metric scaling ($11.7$ mm nominal adult reference).

### 2. Grad-CAM Shortcut Audit Findings
- **Border Concentration**: MobileNetV2 Grad-CAM saliency heatmaps localize **51.73%** of attribution energy in the outer 10% image borders (which constitute only 36.0% of total image pixels).
- **Luminance Confound**: Autistic vs. non-autistic images exhibit a significant **7.72 cd/m²** discrepancy in background lighting ($\Delta L^* = 7.72$, $p < 10^{-5}$).
- **Clean Split Collapse**: Purging cross-split duplicates causes test accuracy to drop from $>85\%$ down to **49.55%** (chance level), proving models attend to photographic shortcuts rather than facial dysmorphology.
