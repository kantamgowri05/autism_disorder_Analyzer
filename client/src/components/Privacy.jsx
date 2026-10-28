import React from "react";
import { ShieldCheck, Lock, EyeOff, ServerOff, DatabaseZap, CheckCircle2, Mail, Phone, FileText } from "lucide-react";

export default function Privacy({ setCurrentPage }) {
  return (
    <div style={{ maxWidth: "980px", margin: "0 auto" }}>
      {/* Top Header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.06)", color: "#FFFFFF", fontSize: "13px", fontWeight: "700", marginBottom: "12px", border: "1px solid rgba(255, 255, 255, 0.16)" }}>
          <ShieldCheck size={16} /> Data Governance &amp; Security Standards
        </div>
        <h1 style={{ fontSize: "36px", marginBottom: "12px" }}>Privacy Policy &amp; Edge Execution Governance</h1>
        <p style={{ color: "#CBD5E1", fontSize: "16px", lineHeight: "1.6" }}>
          NeuroScreen AI™ is engineered under zero-telemetry and edge privacy principles. Patient confidentiality is protected by executing model inferences strictly on the local client machine without cloud telemetry leakage.
        </p>
      </div>

      {/* Core Privacy Pillars Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "36px" }}>
        <div className="health-card">
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.08)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
            <ServerOff size={24} />
          </div>
          <h3 style={{ fontSize: "18px", marginBottom: "8px", color: "#FFFFFF" }}>100% Local Edge Inference</h3>
          <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.6" }}>
            All clinical screening models (scikit-learn ensembles and MobileNetV2 weights) evaluate inputs on your local server. Zero questionnaire answers or behavioral tallies are transmitted to remote servers.
          </p>
        </div>

        <div className="health-card">
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.08)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
            <EyeOff size={24} />
          </div>
          <h3 style={{ fontSize: "18px", marginBottom: "8px", color: "#FFFFFF" }}>Ephemeral Visual Processing</h3>
          <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.6" }}>
            Patient photographs and webcam frames processed through the Two-Stage YOLO + Grad-CAM pipeline reside strictly in volatile RAM and are automatically purged after inference.
          </p>
        </div>

        <div className="health-card">
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "rgba(255, 255, 255, 0.08)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", border: "1px solid rgba(255, 255, 255, 0.2)" }}>
            <Lock size={24} />
          </div>
          <h3 style={{ fontSize: "18px", marginBottom: "8px", color: "#FFFFFF" }}>De-Identified Explanations</h3>
          <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.6" }}>
            The LLM explanation generator functions strictly with de-identified trait codes (e.g. A1, A4). Patient names, birthdates, and protected health identifiers (PHI) are never accepted or transmitted.
          </p>
        </div>
      </div>

      {/* Detailed Compliance & Retention Section */}
      <div className="health-card" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "16px", color: "#FFFFFF" }}>Regulatory Compliance &amp; Patient Rights</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h4 style={{ fontSize: "16px", color: "#FFFFFF", marginBottom: "6px" }}>HIPAA Security Rule Alignment</h4>
            <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.6" }}>
              NeuroScreen AI™ supports technical safeguards by eliminating persistent storage of electronic Protected Health Information (ePHI). When screening reports are downloaded or printed, responsibility transfers to the institutional clinical records protocol.
            </p>
          </div>
          <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "14px" }}>
            <h4 style={{ fontSize: "16px", color: "#FFFFFF", marginBottom: "6px" }}>GDPR Article 9 Compliance (Special Category Data)</h4>
            <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.6" }}>
              Health biometric data is never aggregated for model retraining or commercial sharing. Users retain complete sovereignty to reset session state at any time by clearing the active browser window.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Contact Section */}
      <div className="health-card" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "12px", color: "#FFFFFF" }}>Data Protection Officer &amp; Contact</h2>
        <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.6", marginBottom: "20px" }}>
          If you have questions regarding our privacy architecture, IRB institutional review compliance, or data governance protocols, contact our clinical privacy team:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Mail size={18} color="#FFFFFF" />
            <div>
              <div style={{ fontSize: "12px", color: "#94A3B8" }}>Privacy Inquiries</div>
              <a href="mailto:privacy@neuroscreen.ai" style={{ color: "#FFFFFF", textDecoration: "none", fontSize: "15px", fontWeight: "600" }}>
                privacy@neuroscreen.ai
              </a>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Phone size={18} color="#FFFFFF" />
            <div>
              <div style={{ fontSize: "12px", color: "#94A3B8" }}>Toll-Free Clinical Support</div>
              <a href="tel:+18005550199" style={{ color: "#FFFFFF", textDecoration: "none", fontSize: "15px", fontWeight: "600" }}>
                +1 (800) 555-0199
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
