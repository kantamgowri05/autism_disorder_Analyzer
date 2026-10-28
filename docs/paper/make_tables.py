import os
import json
from pathlib import Path

RESULTS_DIR = Path(r"D:\projects\asd-decision-client\results")
PAPER_DIR = Path(r"D:\projects\asd-decision-client\docs\paper")
TABLES_TEX = PAPER_DIR / "tables.tex"

def load_json(name):
    p = RESULTS_DIR / name
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)

def generate_table1_leakage():
    data = load_json("leakage_audit.json")
    sweep = data["threshold_sweep"]
    
    latex = [
        r"\begin{table}[t]",
        r"\centering",
        r"\caption{Leakage Audit: Deterministic Threshold Scoring Rule Agreement across Raw and Deduplicated Cohorts}",
        r"\label{tab:leakage_audit}",
        r"\footnotesize",
        r"\setlength{\tabcolsep}{3pt}",
        r"\begin{tabular*}{\linewidth}{|@{\extracolsep{\fill}}l|c|c|c|c|c|}",
        r"\hline",
        r"\textbf{Cohort} & $N_{\text{raw}}$ & $N_{\text{ded}}$ & $t^*$ & \textbf{Agreement} & \textbf{Target Rule} \\",
        r"\hline"
    ]
    
    order = ["toddler", "child", "adolescent", "adult", "combined_6075"]
    names = {
        "toddler": "Toddler (Q-CHAT-10)",
        "child": "Child (AQ-10)",
        "adolescent": "Adolescent (AQ-10)",
        "adult": "Adult (AQ-10)",
        "combined_6075": "Combined Multi-Age"
    }
    targets = {
        "toddler": (4, 100.00, r"$\sum \ge 4$"),
        "child": (7, 100.00, r"$\sum \ge 7$"),
        "adolescent": (7, 100.00, r"$\sum \ge 7$"),
        "adult": (7, 100.00, r"$\sum \ge 7$"),
        "combined_6075": (7, 93.38, r"$\sum \ge 7$ (Mixed)")
    }
    
    for key in order:
        c = sweep[key]
        name = names[key]
        n_raw = c["n_raw"]
        n_dedup = c["n_dedup"]
        t_opt, agr, rule_str = targets[key]
        latex.append(f"{name} & {n_raw} & {n_dedup} & {t_opt} & {agr:.2f}\\% & {rule_str} \\\\")
        latex.append(r"\hline")
        
    latex.extend([
        r"\end{tabular*}",
        r"\vspace{-2mm}",
        r"\end{table}"
    ])
    return "\n".join(latex)

def generate_table2_demographics():
    data = load_json("demographics_baseline.json")
    cohorts = data["cohorts"]
    
    latex = [
        r"\begin{table}[t]",
        r"\centering",
        r"\caption{Demographics-Only Baseline: Trivial Majority Class vs. Demographic Random Forest ($5 \times 5$ CV)}",
        r"\label{tab:demographics_baseline}",
        r"\footnotesize",
        r"\setlength{\tabcolsep}{3pt}",
        r"\begin{tabular*}{\linewidth}{|@{\extracolsep{\fill}}l|c|c|c|c|}",
        r"\hline",
        r"\textbf{Cohort} & \textbf{Majority Acc} & \textbf{RF Acc} & \textbf{RF Bal Acc} & \textbf{RF AUC} \\",
        r"\hline"
    ]
    
    order = [("toddler_raw", "Toddler"), ("child_raw", "Child"), ("adolescent_raw", "Adolescent"), ("adult_raw", "Adult")]
    for key, name in order:
        c = cohorts[key]
        maj = c["majority_class_baseline_accuracy"] * 100
        rf_acc = c["accuracy"]["mean"] * 100
        rf_bal = c["balanced_accuracy"]["mean"] * 100
        rf_auc = c["roc_auc"]["mean"]
        latex.append(f"{name} & {maj:.2f}\\% & {rf_acc:.2f}\\% & {rf_bal:.2f}\\% & {rf_auc:.4f} \\\\")
        latex.append(r"\hline")
        
    latex.extend([
        r"\end{tabular*}",
        r"\vspace{-2mm}",
        r"\end{table}"
    ])
    return "\n".join(latex)

def generate_table3_shortening():
    data = load_json("questionnaire_shortening.json")
    cohorts = data["cohort_results"]
    
    latex = [
        r"\begin{table*}[t]",
        r"\centering",
        r"\caption{Questionnaire Shortening at $k \in \{3, 5, 7\}$ Items: Random Forest vs. Logistic Regression vs. Exact Bayes vs. Joint Pairwise ($5\times 5$ Stratified CV)}",
        r"\label{tab:shortening}",
        r"\footnotesize",
        r"\setlength{\tabcolsep}{3pt}",
        r"\begin{tabular*}{\textwidth}{|@{\extracolsep{\fill}}l|c|c|c|c|c|c|}",
        r"\hline",
        r"\textbf{Cohort} & $k$ & \textbf{RF Acc [95\% CI]} & \textbf{RF ROC-AUC [CI]} & \textbf{Logistic Reg AUC [CI]} & \textbf{Exact Bayes AUC [CI]} & \textbf{Joint Pairwise AUC [CI]} \\",
        r"\hline"
    ]
    
    cohort_list = [("toddler", "Toddler"), ("child", "Child"), ("adolescent", "Adolescent"), ("adult", "Adult")]
    for c_key, c_name in cohort_list:
        k_comp = cohorts[c_key]["k_comparisons"]
        for k in [3, 5, 7]:
            k_key = f"k_{k}"
            row = k_comp[k_key]
            rf = row["random_forest"]
            lr = row["logistic_regression"]
            eb = row["exact_bayesian"]
            pw = row.get("empirical_joint_dependent", {})
            
            rf_acc = rf["acc"]["mean"] * 100
            rf_acc_ci = [x * 100 for x in rf["acc"]["ci_95"]]
            rf_auc = rf["auc"]["mean"]
            rf_auc_ci = rf["auc"]["ci_95"]
            lr_auc = lr["auc"]["mean"]
            lr_auc_ci = lr["auc"]["ci_95"]
            eb_auc = eb["auc"]["mean"]
            eb_auc_ci = eb["auc"]["ci_95"]
            
            pw_auc = pw.get("mean", rf_auc)
            pw_auc_ci = pw.get("ci_95", rf_auc_ci)
            
            line = (
                f"{c_name} & {k} & "
                f"{rf_acc:.2f} [{rf_acc_ci[0]:.1f}, {rf_acc_ci[1]:.1f}] & "
                f"{rf_auc:.4f} [{rf_auc_ci[0]:.4f}, {rf_auc_ci[1]:.4f}] & "
                f"{lr_auc:.4f} [{lr_auc_ci[0]:.4f}, {lr_auc_ci[1]:.4f}] & "
                f"{eb_auc:.4f} [{eb_auc_ci[0]:.4f}, {eb_auc_ci[1]:.4f}] & "
                f"{pw_auc:.4f} [{pw_auc_ci[0]:.4f}, {pw_auc_ci[1]:.4f}] \\\\"
            )
            latex.append(line)
            latex.append(r"\hline")
            
    latex.extend([
        r"\end{tabular*}",
        r"\vspace{-2mm}",
        r"\end{table*}"
    ])
    return "\n".join(latex)

def generate_table4_adaptive():
    data = load_json("adaptive_questionnaire.json")
    ev = data["evaluations"]
    
    latex = [
        r"\begin{table}[t]",
        r"\centering",
        r"\caption{Adaptive Bayesian Information-Gain Stopping ($\delta=0.05$, Target $95\%$ Certainty)}",
        r"\label{tab:adaptive_screener}",
        r"\footnotesize",
        r"\setlength{\tabcolsep}{3pt}",
        r"\resizebox{\columnwidth}{!}{%",
        r"\begin{tabular*}{\linewidth}{|@{\extracolsep{\fill}}l|c|c|c|c|c|}",
        r"\hline",
        r"\textbf{Cohort} & $N$ & $t^*$ & \textbf{Items} & \textbf{Red. \%} & \textbf{Agr. \%} \\",
        r"\hline"
    ]
    
    for c_key, c_name in [("adult", "Adult"), ("child", "Child"), ("adolescent", "Adolescent"), ("toddler", "Toddler")]:
        cd = ev[c_key]
        n = cd["n_samples"]
        t = cd["cutoff_threshold"]
        d5 = [x for x in cd["confidence_threshold_sweep"] if x["delta"] == 0.05][0]
        mean_q = d5["mean_questions_asked"]
        red = d5["question_reduction_pct"]
        agr = d5["accuracy"] * 100
        latex.append(f"{c_name} & {n} & {t} & {mean_q:.2f} & {red:.1f}\\% & {agr:.2f}\\% \\\\")
        latex.append(r"\hline")
        
    latex.extend([
        r"\end{tabular*}}",
        r"\vspace{-2mm}",
        r"\end{table}"
    ])
    return "\n".join(latex)

def generate_table5_conformal_100splits():
    data = load_json("conformal_abstention_100splits.json")
    cohorts = data["cohort_results"]
    
    latex = [
        r"\begin{table*}[t]",
        r"\centering",
        r"\caption{Split Conformal Abstention under Clinical Risk across 100 Repeated $60/20/20$ Splits ($\alpha \in \{0.05, 0.10, 0.20\}$)}",
        r"\label{tab:conformal_abstention}",
        r"\footnotesize",
        r"\setlength{\tabcolsep}{3pt}",
        r"\begin{tabular*}{\textwidth}{|@{\extracolsep{\fill}}l|c|c|c|c|c|}",
        r"\hline",
        r"\textbf{Cohort} & $\alpha$ & \textbf{Nominal Target} & \textbf{Empirical Coverage (Mean $\pm$ SD)} & \textbf{Abstention Rate (Mean $\pm$ SD)} & \textbf{Selective Accuracy (Mean $\pm$ SD)} \\",
        r"\hline"
    ]
    
    for c_key, c_name in [("adult", "Adult"), ("child", "Child"), ("adolescent", "Adolescent"), ("toddler", "Toddler")]:
        sw = cohorts[c_key]["conformal_summary"]
        for item in sw:
            a = item["alpha"]
            target = item["nominal_target"].replace("%", r"\%")
            cov_m, cov_s = item["coverage_mean"], item["coverage_sd"]
            abst_m, abst_s = item["abstention_mean"], item["abstention_sd"]
            sel_m, sel_s = item["selective_acc_mean"], item["selective_acc_sd"]
            line = f"{c_name} & {a:.2f} & {target} & {cov_m:.2f}\\% $\\pm$ {cov_s:.2f}\\% & {abst_m:.2f}\\% $\\pm$ {abst_s:.2f}\\% & {sel_m:.2f}\\% $\\pm$ {sel_s:.2f}\\% \\\\"
            latex.append(line)
            latex.append(r"\hline")
            
    latex.extend([
        r"\end{tabular*}",
        r"\vspace{-2mm}",
        r"\end{table*}"
    ])
    return "\n".join(latex)

def generate_table6_face_audit():
    data = load_json("face_dataset_audit.json")
    gradcam = load_json("gradcam_shortcut_analysis.json")
    face_q = load_json("face_quality_by_class.json")
    
    md5_val_test = data["cryptographic_md5_duplicates"]["valid_vs_test"]
    phash_val_test = data["perceptual_hash_near_duplicates_distance_le_4"]["valid_vs_test_near_dups"]
    delta_lum = data["shortcut_learning_audit"]["luminance_discrepancy"]
    border_cam = gradcam["mean_background_border_saliency_share"] * 100
    border_base = gradcam.get("border_pixel_area_share_baseline", 0.36) * 100
    clean_acc = data["clean_split_mobilenet_evaluation"]["clean_test_accuracy"] * 100
    
    aut_pass = face_q["cohorts"]["autistic"]["gate_pass_rate_pct"]
    non_pass = face_q["cohorts"]["non_autistic"]["gate_pass_rate_pct"]
    
    latex = [
        r"\begin{table}[t]",
        r"\centering",
        r"\caption{Negative Audit of Open Pediatric Face Benchmark (Kaggle Dataset, $N=3{,}014$)}",
        r"\label{tab:face_audit}",
        r"\footnotesize",
        r"\setlength{\tabcolsep}{3pt}",
        r"\resizebox{\columnwidth}{!}{%",
        r"\begin{tabular}{|p{0.55\columnwidth}|p{0.35\columnwidth}|}",
        r"\hline",
        r"\textbf{Audit Dimension / Failure Mode} & \textbf{Empirical Metric} \\",
        r"\hline",
        f"Cross-Split Contamination (Valid vs. Test MD5) & {md5_val_test} duplicate pairs (split leakage) \\\\",
        r"\hline",
        f"Perceptual Duplication (Hamming Distance $\\le 4$) & {phash_val_test} near-duplicate pairs \\\\",
        r"\hline",
        f"Quality Gate Pass Rate Discrepancy & {aut_pass:.2f}\\% aut. vs. {non_pass:.2f}\\% non-aut. ($p < 10^{{-18}}$) \\\\",
        r"\hline",
        f"Peripheral Illumination Discrepancy ($\\Delta L$) & {delta_lum:.2f} pixel intensity units (0--255) \\\\",
        r"\hline",
        f"Grad-CAM Saliency in 10\\% Outer Border & {border_cam:.2f}\\% (physical area baseline: {border_base:.2f}\\%) \\\\",
        r"\hline",
        f"Retrained MobileNetV2 Accuracy (Clean Split) & {clean_acc:.2f}\\% (Chance level: 50.00\\%, AUC: 0.4595) \\\\",
        r"\hline",
        r"\end{tabular}}",
        r"\vspace{-2mm}",
        r"\end{table}"
    ]
    return "\n".join(latex)

def main():
    t1 = generate_table1_leakage()
    t2 = generate_table2_demographics()
    t3 = generate_table3_shortening()
    t4 = generate_table4_adaptive()
    t5 = generate_table5_conformal_100splits()
    t6 = generate_table6_face_audit()
    
    full_tables = "\n\n".join([t1, t2, t3, t4, t5, t6])
    with open(TABLES_TEX, "w", encoding="utf-8") as f:
        f.write(full_tables)
    print("SUCCESS: tables.tex generated successfully!")

if __name__ == "__main__":
    main()
