import React from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Activity, Eye, FileText, UserCheck, Stethoscope, HelpCircle, HeartPulse, Brain } from "lucide-react";

export default function HowItWorks({ setCurrentPage, startScreening }) {
  const steps = [
    {
      num: "01",
      title: "Select Developmental Stage",
      desc: "Choose from 4 tailored protocols: Toddlers (12–36 mo), Children (4–11 yr), Adolescents (12–16 yr), or Adults (18+ yr). Each age group assesses specific milestones such as joint attention, peer interaction, or self-reported social communication.",
      icon: HeartPulse,
      color: "#FFFFFF"
    },
    {
      num: "02",
      title: "Complete the Behavioral Screener",
      desc: "Answer structured questions based on standardized AQ-10 or Q-CHAT-10 screening tools. Choose the Comprehensive 10-Item protocol or the Streamlined 5-Item Triage if quick clinical prioritization is needed.",
      icon: Activity,
      color: "#E2E8F0"
    },
    {
      num: "03",
      title: "Optional Visual Feature Analysis",
      desc: "For clinical exploratory settings, access the Vision Lab to observe subtle facial landmark symmetry and visual focus cues non-invasively through camera or image upload.",
      icon: Eye,
      color: "#CBD5E1"
    },
    {
      num: "04",
      title: "Receive Structured Clinical Synthesis",
      desc: "Review an immediate assessment report categorized into three protective states: Lower Likelihood, Higher Likelihood, or Please See a Specialist. Includes transparent trait identification and downloadable summary.",
      icon: FileText,
      color: "#94A3B8"
    }
  ];

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.06)", color: "#FFFFFF", fontSize: "13px", fontWeight: "700", marginBottom: "12px", border: "1px solid rgba(255, 255, 255, 0.16)" }}>
          <Brain size={16} /> Clinical Workflow &amp; Methodology
        </div>
        <h1 style={{ fontSize: "36px", color: "#FFFFFF", marginBottom: "14px" }}>
          How NeuroScreen AI™ Works
        </h1>
        <p style={{ color: "#CBD5E1", fontSize: "17px", lineHeight: "1.6", maxWidth: "800px" }}>
          NeuroScreen AI™ is an auxiliary clinical decision-support platform designed to streamline early developmental screening through established standardized questionnaires and transparent analytical insights.
        </p>
      </div>

      {/* Step by Step Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "40px" }}>
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="health-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: `${s.color}22`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${s.color}44` }}>
                    <Icon size={22} />
                  </div>
                  <span style={{ fontSize: "28px", fontWeight: "800", color: "rgba(255, 255, 255, 0.15)", fontFamily: "var(--font-heading)" }}>
                    {s.num}
                  </span>
                </div>
                <h3 style={{ fontSize: "19px", color: "#FFFFFF", marginBottom: "10px" }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.6" }}>
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Three Tier Result Explanation */}
      <div className="health-card" style={{ marginBottom: "36px", padding: "36px" }}>
        <h2 style={{ fontSize: "24px", color: "#FFFFFF", marginBottom: "12px" }}>
          Transparent, Non-Binary 3-Tier Categorization
        </h2>
        <p style={{ color: "#CBD5E1", marginBottom: "26px", fontSize: "15px", maxWidth: "780px" }}>
          Unlike black-box calculators that generate confusing numerical scores, NeuroScreen AI™ classifies screening results into three clear clinical trajectory states designed to protect patient wellbeing:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
          <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
            <span style={{ display: "inline-block", background: "rgba(16, 185, 129, 0.2)", color: "#6EE7B7", padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", marginBottom: "10px" }}>
              State 1
            </span>
            <h4 style={{ fontSize: "17px", color: "#FFFFFF", marginBottom: "8px" }}>Lower Likelihood</h4>
            <p style={{ fontSize: "13px", color: "#CBD5E1", lineHeight: "1.5" }}>
              Responses align with typical neurodevelopmental patterns. Ongoing developmental monitoring is recommended according to regular pediatric guidelines.
            </p>
          </div>

          <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
            <span style={{ display: "inline-block", background: "rgba(245, 158, 11, 0.2)", color: "#FDE68A", padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", marginBottom: "10px" }}>
              State 2 (Abstain)
            </span>
            <h4 style={{ fontSize: "17px", color: "#FFFFFF", marginBottom: "8px" }}>Please See a Specialist</h4>
            <p style={{ fontSize: "13px", color: "#CBD5E1", lineHeight: "1.5" }}>
              Borderline or mixed behavioral responses where automated screening abstains from definitive likelihood. Recommends evaluation by a licensed specialist.
            </p>
          </div>

          <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)" }}>
            <span style={{ display: "inline-block", background: "rgba(244, 63, 94, 0.2)", color: "#FDA4AF", padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", marginBottom: "10px" }}>
              State 3
            </span>
            <h4 style={{ fontSize: "17px", color: "#FFFFFF", marginBottom: "8px" }}>Higher Likelihood</h4>
            <p style={{ fontSize: "13px", color: "#CBD5E1", lineHeight: "1.5" }}>
              Responses indicate elevated autism spectrum characteristics. Directs families to a structured diagnostic pathway with developmental pediatricians or clinical psychologists.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Box */}
      <div className="health-card" style={{ textAlign: "center", padding: "40px 24px", marginBottom: "40px" }}>
        <h2 style={{ fontSize: "26px", color: "#FFFFFF", marginBottom: "12px" }}>
          Ready to Begin a Screening Session?
        </h2>
        <p style={{ color: "#CBD5E1", fontSize: "15px", maxWidth: "600px", margin: "0 auto 24px auto" }}>
          Select an age cohort to start a structured questionnaire. Sessions are private, take only 5–10 minutes, and leave zero data on external servers.
        </p>
        <button 
          className="btn-primary" 
          onClick={() => startScreening("adult")}
          style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}
        >
          Begin Clinical Assessment Now <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
