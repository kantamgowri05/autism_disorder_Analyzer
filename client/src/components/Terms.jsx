import React from "react";
import { FileText, ShieldAlert, Scale, HelpCircle, CheckCircle2, Mail, Phone } from "lucide-react";

export default function Terms({ setCurrentPage, startScreening }) {
  return (
    <div style={{ maxWidth: "980px", margin: "0 auto" }}>
      {/* Top Banner */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.15)", color: "#C4B5FD", fontSize: "13px", fontWeight: "700", marginBottom: "12px", border: "1px solid rgba(167, 139, 250, 0.3)" }}>
          <Scale size={16} /> Clinical Governance &amp; Terms
        </div>
        <h1 style={{ fontSize: "36px", marginBottom: "12px" }}>Terms of Service &amp; Clinical Ethics Protocol</h1>
        <p style={{ color: "#CBD5E1", fontSize: "16px", lineHeight: "1.6" }}>
          Effective Date: January 1, 2026 &bull; Last Revised: October 2026. Please review these clinical terms carefully before utilizing NeuroScreen AI™ screening workflows or interpreting analytical reports.
        </p>
      </div>

      {/* Primary Medical Disclaimer Box */}
      <div className="health-card" style={{ marginBottom: "28px", borderLeft: "4px solid #F59E0B" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <ShieldAlert size={28} color="#F59E0B" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <h3 style={{ fontSize: "18px", color: "#FDE68A", marginBottom: "6px" }}>
              1. Non-Diagnostic Medical Device Notice
            </h3>
            <p style={{ fontSize: "14px", color: "#E2E8F0", lineHeight: "1.6", margin: 0 }}>
              NeuroScreen AI™ is designed exclusively as an auxiliary clinical decision-support tool. <strong>It does not provide a definitive diagnosis of Autism Spectrum Disorder (ASD) or any related neurodevelopmental condition.</strong> Screening trajectories, risk likelihood categories, and Explainable AI™ feature maps must always be validated through in-person developmental evaluation by a qualified specialist.
            </p>
          </div>
        </div>
      </div>

      {/* Terms Sections */}
      <div className="health-card" style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "16px" }}>2. Authorized Use &amp; User Responsibilities</h2>
        <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.7", marginBottom: "14px" }}>
          The platform may be used by clinicians, developmental researchers, pediatricians, educators, and primary caregivers seeking structured, evidence-based behavioral risk stratification. By accessing this platform, you agree to:
        </p>
        <ul style={{ listStyleType: "none", paddingLeft: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
          <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "#E2E8F0" }}>
            <CheckCircle2 size={16} color="#34D399" style={{ flexShrink: 0, marginTop: "3px" }} />
            <span>Provide accurate and faithful behavioral observational answers without synthetic falsification.</span>
          </li>
          <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "#E2E8F0" }}>
            <CheckCircle2 size={16} color="#34D399" style={{ flexShrink: 0, marginTop: "3px" }} />
            <span>Never alter clinical intervention plans solely on automated screening output without consulting a licensed physician.</span>
          </li>
          <li style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "#E2E8F0" }}>
            <CheckCircle2 size={16} color="#34D399" style={{ flexShrink: 0, marginTop: "3px" }} />
            <span>Adhere to patient data consent regulations when submitting photographic or developmental data for visual saliency analysis.</span>
          </li>
        </ul>
      </div>

      <div className="health-card" style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "16px" }}>3. Data Sovereignty &amp; Privacy Protections</h2>
        <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.7", marginBottom: "12px" }}>
          In accordance with HIPAA Security Rules and European GDPR requirements, NeuroScreen AI™ operates on a <strong>zero-telemetry edge architecture</strong>. Questionnaires and webcam frames submitted in the Vision Lab are processed in volatile memory on the local server and are not stored in central databases or sold to third-party data brokers.
        </p>
        <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.7" }}>
          For further details regarding cryptographic security, please review the <button onClick={() => setCurrentPage("privacy")} style={{ background: "none", border: "none", color: "#F472B6", textDecoration: "underline", cursor: "pointer", padding: 0, font: "inherit", fontWeight: "600" }}>Privacy Policy</button>.
        </p>
      </div>

      <div className="health-card" style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "16px" }}>4. Intellectual Property &amp; Algorithmic Transparency</h2>
        <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.7" }}>
          All mathematical weights, de-biasing protocols, and feature-attribution architectures developed under NeuroScreen AI™ are proprietary to NeuroScreen AI™ Healthcare Technologies Inc., while honoring open academic citations for the underlying standardized Q-CHAT-10 and AQ-10 clinical validation datasets.
        </p>
      </div>

      <div className="health-card" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "16px" }}>5. Contact &amp; Clinical Inquiries</h2>
        <p style={{ fontSize: "14px", color: "#CBD5E1", lineHeight: "1.7", marginBottom: "16px" }}>
          For institutional licensing, ethics review boards (IRB) documentation, or technical inquiries:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Mail size={16} color="#F472B6" />
            <a href="mailto:ethics@neuroscreen.ai" style={{ color: "#E0E7FF", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
              ethics@neuroscreen.ai
            </a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Phone size={16} color="#F472B6" />
            <a href="tel:+18005550199" style={{ color: "#E0E7FF", textDecoration: "none", fontSize: "14px", fontWeight: "600" }}>
              +1 (800) 555-0199
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
