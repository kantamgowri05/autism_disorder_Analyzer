import json
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

# IEEE style configuration
plt.rcParams.update({
    "font.family": "serif",
    "font.serif": ["Times New Roman", "DejaVu Serif"],
    "font.size": 8,
    "axes.labelsize": 8,
    "legend.fontsize": 6.0,
    "xtick.labelsize": 7,
    "ytick.labelsize": 7,
    "figure.titlesize": 9,
    "mathtext.fontset": "stix"
})

BASE_DIR = Path(r"D:\projects\asd-decision-client")
RESULTS_DIR = BASE_DIR / "results"
FIGS_DIR = BASE_DIR / "docs" / "paper" / "figures"
FIGS_DIR.mkdir(parents=True, exist_ok=True)

cohorts = ["adult", "child", "adolescent", "toddler"]
cohort_names = {"adult": "Adult", "child": "Child", "adolescent": "Adolescent", "toddler": "Toddler"}
colors = {"adult": "#1f77b4", "child": "#2ca02c", "adolescent": "#ff7f0e", "toddler": "#d62728"}
markers = {"adult": "o", "child": "s", "adolescent": "^", "toddler": "D"}

# ---------------------------------------------------------
# FIGURE 2 (fig1_shortening_and_adaptive.pdf):
# Fixed-k points EQUAL Table III RF Acc from questionnaire_shortening.json:
# Adult: 88.10, 90.57, 92.30
# Child: 81.92, 84.11, 87.87
# Adolescent: 78.90, 85.59, 87.90
# Toddler: 85.18, 90.30, 93.13
# Adaptive stars from adaptive_questionnaire.json (delta=0.05):
# Adult: (4.62, 97.87)
# Child: (6.86, 99.66)
# Adolescent: (6.82, 99.04)
# Toddler: (4.74, 95.07)
# ---------------------------------------------------------
with open(RESULTS_DIR / "questionnaire_shortening.json", "r") as f:
    shortening_data = json.load(f)["cohort_results"]

table3_rf_acc = {
    c: [
        round(shortening_data[c]["k_comparisons"][f"k_{k}"]["random_forest"]["acc"]["mean"] * 100, 2)
        for k in [3, 5, 7]
    ]
    for c in cohorts
}

with open(RESULTS_DIR / "adaptive_questionnaire.json", "r") as f:
    adapt_raw = json.load(f)["evaluations"]

adaptive_stars = {}
for c in cohorts:
    sweep = adapt_raw[c]["confidence_threshold_sweep"]
    d05 = next(x for x in sweep if x["delta"] == 0.05)
    adaptive_stars[c] = (round(d05["mean_questions_asked"], 2), round(d05["accuracy"] * 100, 2))

fig, ax = plt.subplots(figsize=(3.45, 2.45), dpi=300)
k_vals = [3, 5, 7]

# 1. Plot fixed-k lines
for c in cohorts:
    ax.plot(k_vals, table3_rf_acc[c], marker=markers[c], markersize=4.0, linewidth=1.1,
            linestyle="-", label=f"{cohort_names[c]} (Fixed-k)", color=colors[c])

# 2. Plot adaptive stars
for c in cohorts:
    mean_q, adapt_acc = adaptive_stars[c]
    ax.scatter([mean_q], [adapt_acc], marker="*", s=95, color=colors[c],
               edgecolors="black", linewidths=0.6, zorder=6,
               label=f"{cohort_names[c]} (Adaptive $\\star$)")

ax.set_xlabel("Mean Questions Asked ($k$)")
ax.set_ylabel("Screening Accuracy / Agreement (%)")
ax.set_title("Fixed-$k$ Truncation vs. Adaptive Stopping ($\\delta=0.05$)", fontsize=8)
ax.set_ylim(74, 103)
ax.set_xlim(2.4, 7.6)
ax.grid(True, linestyle="--", alpha=0.4)
ax.legend(loc="lower right", frameon=True, framealpha=0.92, fontsize=5.8, ncol=2)
plt.tight_layout(pad=0.4)

fig.savefig(FIGS_DIR / "fig1_shortening_and_adaptive.pdf")
fig.savefig(FIGS_DIR / "fig1_shortening_and_adaptive.png")
plt.close(fig)
print("SUCCESS: Regenerated Figure 2 strictly matching Table III RF Acc points from questionnaire_shortening.json!")

# ---------------------------------------------------------
# FIGURE 3 (fig2_conformal_abstention.pdf):
# Conformal Coverage vs. Abstention from conformal_abstention_100splits.json
# Mean abstention vs mean coverage per cohort and alpha, consistent with Table V.
# ---------------------------------------------------------
with open(RESULTS_DIR / "conformal_abstention_100splits.json", "r") as f:
    conf_100 = json.load(f)["cohort_results"]

fig, ax = plt.subplots(figsize=(3.45, 2.45), dpi=300)

for c in cohorts:
    sw = conf_100[c]["conformal_summary"]
    # Sort alpha: 0.20 -> 0.10 -> 0.05
    sw = sorted(sw, key=lambda x: x["alpha"], reverse=True)
    absts = [x["abstention_mean"] for x in sw]
    covs = [x["coverage_mean"] for x in sw]
    abst_sds = [x["abstention_sd"] for x in sw]
    cov_sds = [x["coverage_sd"] for x in sw]
    
    ax.plot(absts, covs, marker=markers[c], markersize=4.0, linewidth=1.1,
            label=cohort_names[c], color=colors[c], linestyle="-")
    
    # Annotate alpha values on points
    for i, item in enumerate(sw):
        a_val = item["alpha"]
        offset_y = 1.0 if c in ["child", "adolescent"] else -1.8
        offset_x = 0.5
        ax.annotate(f"$\\alpha={a_val}$", xy=(absts[i], covs[i]),
                    xytext=(absts[i] + offset_x, covs[i] + offset_y),
                    fontsize=5.2, color=colors[c])

ax.axhline(95.0, color="#444444", linestyle=":", linewidth=0.8, label="Nominal 95%")
ax.axhline(90.0, color="#777777", linestyle="--", linewidth=0.8, label="Nominal 90%")
ax.axhline(80.0, color="#999999", linestyle="-.", linewidth=0.8, label="Nominal 80%")

ax.set_xlabel("Mean Abstention Rate (%)")
ax.set_ylabel("Mean Empirical Coverage (%)")
ax.set_title("Conformal Coverage vs Abstention (100 repetitions)", fontsize=8)
ax.set_ylim(75, 102)
ax.set_xlim(0, 62)
ax.grid(True, linestyle="--", alpha=0.4)
ax.legend(loc="lower right", frameon=True, framealpha=0.92, fontsize=5.8, ncol=2)
plt.tight_layout(pad=0.4)

fig.savefig(FIGS_DIR / "fig2_conformal_abstention.pdf")
fig.savefig(FIGS_DIR / "fig2_conformal_abstention.png")
plt.close(fig)
print("SUCCESS: Regenerated Figure 3 strictly from conformal_abstention_100splits.json!")

# ---------------------------------------------------------
# FIGURE 4 (fig3_gradcam_shortcut): Saliency vs Area & Gate Pass
# Subplot (b) title shortened to: "(b) Gate pass rate by class"
# ---------------------------------------------------------
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(3.45, 2.15), dpi=300)

categories = ["Peripheral\nBorder", "Central\nFacial Region"]
saliency_share = [51.73, 48.27]
area_share = [36.00, 64.00]

x = np.arange(len(categories))
width = 0.35

rects1 = ax1.bar(x - width/2, saliency_share, width, label="Grad-CAM Mass", color="#d62728", alpha=0.88)
rects2 = ax1.bar(x + width/2, area_share, width, label="Pixel Area", color="#4a5568", alpha=0.88)

ax1.set_ylabel("Percentage (%)")
ax1.set_title("(a) Saliency vs. Area", fontsize=7.5)
ax1.set_xticks(x)
ax1.set_xticklabels(categories, fontsize=6.5)
ax1.set_ylim(0, 80)
ax1.grid(True, linestyle="--", alpha=0.35, axis="y")
ax1.legend(loc="upper left", bbox_to_anchor=(0.0, 1.0), frameon=True, framealpha=0.9, fontsize=5.5)

for rect in rects1:
    h = rect.get_height()
    ax1.annotate(f"{h:.1f}%", xy=(rect.get_x() + rect.get_width()/2, h),
                 xytext=(0, 2), textcoords="offset points", ha="center", va="bottom", fontsize=6)
for rect in rects2:
    h = rect.get_height()
    ax1.annotate(f"{h:.1f}%", xy=(rect.get_x() + rect.get_width()/2, h),
                 xytext=(0, 2), textcoords="offset points", ha="center", va="bottom", fontsize=6)

metrics_labels = ["Autistic", "Non-Autistic"]
gate_pass = [16.32, 29.99]
colors_sub = ["#e53e3e", "#3182ce"]

rects3 = ax2.bar(metrics_labels, gate_pass, width=0.5, color=colors_sub, alpha=0.88)
ax2.set_ylabel("Gate Pass Rate (%)")
ax2.set_title("(b) Gate pass rate by class", fontsize=7.5)
ax2.set_ylim(0, 42)
ax2.grid(True, linestyle="--", alpha=0.35, axis="y")

for rect in rects3:
    h = rect.get_height()
    ax2.annotate(f"{h:.1f}%", xy=(rect.get_x() + rect.get_width()/2, h),
                 xytext=(0, 2), textcoords="offset points", ha="center", va="bottom", fontsize=6.5, fontweight="bold")

plt.tight_layout(pad=0.4)

fig.savefig(FIGS_DIR / "fig3_gradcam_shortcut.pdf")
fig.savefig(FIGS_DIR / "fig3_gradcam_shortcut.png")
fig.savefig(FIGS_DIR / "fig3_yolo_landmarks_gradcam.pdf")
fig.savefig(FIGS_DIR / "fig3_yolo_landmarks_gradcam.png")
plt.close(fig)
print("SUCCESS: Regenerated Figure 4 with shortened (b) title and ylim 80!")
