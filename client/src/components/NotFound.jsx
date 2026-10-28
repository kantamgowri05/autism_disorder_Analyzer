import React from "react";
import { AlertCircle, Home, Activity, ArrowRight, BookOpen } from "lucide-react";

export default function NotFound({ setCurrentPage, startScreening }) {
  return (
    <div style={{ maxWidth: "680px", margin: "60px auto", textAlign: "center", padding: "20px" }}>
      <div className="health-card" style={{ padding: "48px 36px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(236, 72, 153, 0.15)", color: "#F472B6", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", border: "1px solid rgba(236, 72, 153, 0.3)" }}>
          <AlertCircle size={36} />
        </div>

        <div style={{ fontSize: "14px", fontWeight: "700", color: "#C4B5FD", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
          Error 404 &bull; Clinical Route Not Located
        </div>

        <h1 style={{ fontSize: "32px", marginBottom: "16px", color: "#FFFFFF" }}>
          Diagnostic Protocol Not Found
        </h1>

        <p style={{ color: "#CBD5E1", fontSize: "16px", lineHeight: "1.6", maxWidth: "520px", margin: "0 auto 32px auto" }}>
          The requested developmental screening session, route, or dataset is not active. Please navigate back to the main portal or begin a validated screening assessment.
        </p>

        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <button 
            className="btn-primary" 
            onClick={() => setCurrentPage("home")}
          >
            <Home size={18} /> Return to Home Dashboard
          </button>
          <button 
            className="btn-secondary" 
            onClick={() => startScreening("adult")}
          >
            <Activity size={18} /> Begin Clinical Screener
          </button>
        </div>

        <div style={{ marginTop: "32px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "20px", display: "flex", justifyContent: "center", gap: "20px", fontSize: "14px" }}>
          <button 
            onClick={() => setCurrentPage("performance")} 
            style={{ background: "none", border: "none", color: "#A5B4FC", cursor: "pointer", textDecoration: "underline" }}
          >
            View Model Benchmarks
          </button>
          <button 
            onClick={() => setCurrentPage("privacy")} 
            style={{ background: "none", border: "none", color: "#A5B4FC", cursor: "pointer", textDecoration: "underline" }}
          >
            Security &amp; Privacy
          </button>
        </div>
      </div>
    </div>
  );
}
