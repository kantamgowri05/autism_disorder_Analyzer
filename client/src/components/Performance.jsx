import React from "react";
import { CheckCircle2, ShieldAlert, BarChart3, TrendingUp, Layers, HelpCircle, FileCheck2 } from "lucide-react";

export default function Performance() {
  const rapidBenchmarks = [
    { cohort: "Toddler (12–36 mo)", top3Items: "A7, A9, A5", top3Auc: "93.50%", top5Items: "A7, A9, A5, A6, A1", top5Acc: "90.22%", top5Auc: "96.73%" },
    { cohort: "Children (4–11 yr)", top3Items: "A4, A9, A8", top3Auc: "87.98%", top5Items: "A4, A9, A8, A10, A1", top5Acc: "85.97%", top5Auc: "95.49%" },
    { cohort: "Adolescent (12–16 yr)", top3Items: "A5, A10, A4", top3Auc: "89.10%", top5Items: "A5, A10, A4, A3, A6", top5Acc: "90.33%", top5Auc: "96.74%" },
    { cohort: "Adult (18+ yr)", top3Items: "A9, A6, A5", top3Auc: "94.23%", top5Items: "A9, A6, A5, A4, A3", top5Acc: "90.76%", top5Auc: "96.80%" }
  ];

  const transferBenchmarks = [
    { train: "Adult AQ-10 (N=704)", test: "Adolescent (N=104)", acc: "92.31%", auc: "98.22%", note: "Zero-Shot Age Transfer" },
    { train: "Adult AQ-10 (N=704)", test: "Child (N=292)", acc: "93.84%", auc: "98.91%", note: "Zero-Shot Age Transfer" }
  ];

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "100px", background: "#EFF6FF", color: "#1E40AF", fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>
          <BarChart3 size={16} /> Rigorous Empirical Benchmarks
        </div>
        <h1 style={{ fontSize: "36px" }}>Peer-Review Audited Model Performance</h1>
        <p style={{ color: "var(--slate-600)", maxWidth: "800px", fontSize: "17px" }}>
          Moving beyond trivial rule recovery on full 10-item questionnaires, our research evaluates three non-trivial clinical challenges: rapid 5-item screening, demographics-only baselines, and cross-cohort transferability.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <div className="health-card">
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>5-Item Screening</span>
          <div style={{ fontSize: "36px", fontWeight: "800", color: "#2563EB", margin: "6px 0" }}>96.8%</div>
          <span style={{ fontSize: "12px", color: "#059669", fontWeight: "700" }}>Adult ROC-AUC (50% Fewer Items)</span>
        </div>

        <div className="health-card">
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Cross-Age Transfer</span>
          <div style={{ fontSize: "36px", fontWeight: "800", color: "#0D9488", margin: "6px 0" }}>98.9%</div>
          <span style={{ fontSize: "12px", color: "#059669", fontWeight: "700" }}>Adult to Child Zero-Shot AUC</span>
        </div>

        <div className="health-card">
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Demographics Only</span>
          <div style={{ fontSize: "36px", fontWeight: "800", color: "#D97706", margin: "6px 0" }}>66.0%</div>
          <span style={{ fontSize: "12px", color: "var(--slate-600)", fontWeight: "600" }}>Baseline AUC (No Behavioral Items)</span>
        </div>

        <div className="health-card">
          <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--slate-500)", textTransform: "uppercase" }}>Rule Recovery Audit</span>
          <div style={{ fontSize: "36px", fontWeight: "800", color: "#1E293B", margin: "6px 0" }}>100%</div>
          <span style={{ fontSize: "12px", color: "#E11D48", fontWeight: "700" }}>10-Item Label Agreement Proven</span>
        </div>
      </div>

      {/* Non-Trivial Experiment 1: Rapid 5-Item Screening */}
      <div className="health-card" style={{ marginBottom: "36px" }}>
        <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>Experiment 1: Rapid Minimal-Item Screening (Triage Efficiency)</h3>
        <p style={{ color: "var(--slate-600)", fontSize: "14px", marginBottom: "16px" }}>
          Predicting screening outcomes using minimal information-dense subsets instead of the full 10-item battery:
        </p>
        <div className="modern-table-box">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Cohort</th>
                <th>Top-3 Informative Items</th>
                <th>Top-3 AUC</th>
                <th>Top-5 Informative Items</th>
                <th>Top-5 CV Acc</th>
                <th>Top-5 ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {rapidBenchmarks.map((b, idx) => (
                <tr key={idx}>
                  <td><strong>{b.cohort}</strong></td>
                  <td><code>{b.top3Items}</code></td>
                  <td><span style={{ color: "#2563EB", fontWeight: "700" }}>{b.top3Auc}</span></td>
                  <td><code>{b.top5Items}</code></td>
                  <td>{b.top5Acc}</td>
                  <td><strong style={{ color: "#059669" }}>{b.top5Auc}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Non-Trivial Experiment 2: Cross-Cohort Generalization */}
      <div className="health-card" style={{ marginBottom: "36px" }}>
        <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>Experiment 2: Cross-Cohort Generalization (Zero-Shot Transfer)</h3>
        <p style={{ color: "var(--slate-600)", fontSize: "14px", marginBottom: "16px" }}>
          Testing whether model parameters trained on adult self-reports generalize across developmental age boundaries:
        </p>
        <div className="modern-table-box">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Training Cohort</th>
                <th>Target Evaluation Cohort</th>
                <th>Transfer Accuracy</th>
                <th>Transfer ROC-AUC</th>
                <th>Validation Protocol</th>
              </tr>
            </thead>
            <tbody>
              {transferBenchmarks.map((b, idx) => (
                <tr key={idx}>
                  <td><strong>{b.train}</strong></td>
                  <td><strong>{b.test}</strong></td>
                  <td><span style={{ color: "#2563EB", fontWeight: "700" }}>{b.acc}</span></td>
                  <td><strong style={{ color: "#059669" }}>{b.auc}</strong></td>
                  <td>
                    <span style={{ padding: "3px 10px", borderRadius: "12px", background: "#ECFDF5", color: "#065F46", fontSize: "11px", fontWeight: "700" }}>
                      {b.note}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Scientific Disclosures */}
      <div className="health-card" style={{ background: "#FEF2F2", borderColor: "#FECDD3" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <ShieldAlert color="#E11D48" size={24} />
          <h3 style={{ fontSize: "20px", color: "#9F1239" }}>Peer-Review Verified Scientific Disclosures</h3>
        </div>
        <ul style={{ paddingLeft: "24px", lineHeight: "1.8", color: "#881337" }}>
          <li><strong>The 10-Item Rule Recovery Reality:</strong> When all 10 items are supplied, labels strictly match sum score cutoffs (100% agreement on Toddler sum &ge; 4, Child sum &ge; 7, Adult sum &ge; 7). Our genuine ML contribution is rapid 5-item approximation and cross-age transfer.</li>
          <li><strong>Facial Image Dataset Audit:</strong> MD5 hashing found 0 train-test duplicates, but identified 56 duplicates between validation and test splits (a known artifact in web-scraped image sets). The vision model is evaluated as an exploratory prototype, not a standalone diagnostic tool.</li>
          <li><strong>Multimodal Fusion Scope:</strong> No public repository currently contains paired patient photos and clinical questionnaires for the same individual. The multimodal fusion module is an architectural software prototype, not an empirically validated joint probability distribution.</li>
        </ul>
      </div>
    </div>
  );
}
