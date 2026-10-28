import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  RefreshCw, 
  Printer, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Copy, 
  Eye, 
  Download, 
  Award, 
  Activity, 
  CheckCheck,
  X
} from "lucide-react";

/**
 * Single-Page Clinical Decision Support Report Sheet
 * Fits comfortably within 1 printable A4/Letter page.
 */
function ClinicalPrintSheet({
  screeningResult,
  visionBiometrics,
  selectedCohort,
  headlineTitle,
  isLower,
  isHigher,
  isAbstain,
  reportId,
  reportDate,
  preview = false
}) {
  const containerStyle = preview ? {
    background: "#FFFFFF",
    color: "#0F172A",
    padding: "32px 36px 36px 36px",
    borderRadius: "10px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    boxShadow: "0 12px 35px rgba(0, 0, 0, 0.45)",
    width: "100%",
    maxWidth: "760px",
    minHeight: "fit-content",
    height: "auto",
    boxSizing: "border-box"
  } : {
    background: "#FFFFFF",
    color: "#0F172A",
    padding: "0",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    width: "100%",
    boxSizing: "border-box"
  };

  const statusColor = isAbstain ? "#B91C1C" : (isHigher ? "#D97706" : "#15803D");
  const statusBg = isAbstain ? "#FEF2F2" : (isHigher ? "#FFFBEB" : "#F0FDF4");
  const statusBorder = isAbstain ? "#FECACA" : (isHigher ? "#FDE68A" : "#BBF7D0");

  const traits = screeningResult?.key_traits_identified || [];

  return (
    <div className="clinical-sheet" style={containerStyle}>
      {/* 1. Header & Letterhead */}
      <div style={{ borderBottom: "2px solid #1E293B", paddingBottom: "12px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "0.04em", color: "#0F172A" }}>
              NEUROSCREEN AI™
            </span>
            <span style={{ fontSize: "10px", fontWeight: "700", background: "#E2E8F0", color: "#334155", padding: "2px 6px", borderRadius: "3px", textTransform: "uppercase" }}>
              Clinical Decision Support
            </span>
          </div>
          <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
            Automated Pediatric &amp; Adult Behavioral Screener &bull; Audited Multi-Cohort System
          </div>
          <div style={{ fontSize: "10px", fontWeight: "700", color: "#B91C1C", marginTop: "4px" }}>
            Screening support only. Not a medical diagnosis.
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: "10px", color: "#64748B", lineHeight: "1.4" }}>
          <div><strong>Report ID:</strong> #{reportId}</div>
          <div><strong>Evaluation Date:</strong> {reportDate}</div>
          <div><strong>Software Version:</strong> v2.4 (Conformal Core)</div>
        </div>
      </div>

      {/* 2. Patient / Assessment Cohort Summary Box */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "14px", fontSize: "11px", border: "1px solid #E2E8F0" }}>
        <tbody>
          <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
            <td style={{ padding: "6px 10px", fontWeight: "700", width: "22%", color: "#334155" }}>Subject Cohort:</td>
            <td style={{ padding: "6px 10px", width: "28%", color: "#0F172A", textTransform: "uppercase", fontWeight: "600" }}>
              {selectedCohort || screeningResult?.cohort || "Standard"}
            </td>
            <td style={{ padding: "6px 10px", fontWeight: "700", width: "22%", color: "#334155" }}>Protocol:</td>
            <td style={{ padding: "6px 10px", width: "28%", color: "#0F172A" }}>
              {screeningResult?.is_rapid_mode ? "Rapid Shortened Screener" : "AQ-10 Validated Screener"}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "6px 10px", fontWeight: "700", color: "#334155" }}>Screening Outcome:</td>
            <td style={{ padding: "6px 10px", fontWeight: "800", color: statusColor }}>
              {headlineTitle}
            </td>
            <td style={{ padding: "6px 10px", fontWeight: "700", color: "#334155" }}>Decision Strategy:</td>
            <td style={{ padding: "6px 10px", color: "#0F172A" }}>
              {isAbstain ? "Conformal Abstention (Selective Triage)" : "Standard Decision Coverage"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 3. Primary Screening Triage Verdict Card */}
      <div style={{ 
        background: statusBg, 
        border: `1.5px solid ${statusBorder}`, 
        borderRadius: "6px", 
        padding: "10px 14px", 
        marginBottom: "14px" 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <span style={{ fontSize: "12px", fontWeight: "800", color: statusColor, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Clinical Classification &bull; {headlineTitle}
          </span>
          <span style={{ fontSize: "10px", fontWeight: "700", color: statusColor, background: "#FFFFFF", padding: "2px 8px", borderRadius: "10px", border: `1px solid ${statusBorder}` }}>
            {isAbstain ? "Action: Specialist Referral Required" : (isHigher ? "Action: Clinical Follow-up" : "Action: Standard Routine")}
          </span>
        </div>
        <p style={{ fontSize: "11px", lineHeight: "1.45", color: "#1E293B", margin: 0 }}>
          {isAbstain
            ? "Prediction set includes both classes (conformal abstention). Automated decision support cannot reliably classify this borderline profile; consultation with a neurodevelopmental specialist is advised."
            : (screeningResult?.state_description || "Evaluation completed under validated behavioral questionnaire protocol.")}
        </p>
      </div>

      {/* 4. Section A: Behavioral Trait Observations */}
      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "11px", fontWeight: "800", color: "#0F172A", borderBottom: "1px solid #CBD5E1", paddingBottom: "4px", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Section A: Behavioral Screener Observations ({traits.length} Traits Flagged)
        </div>
        {traits.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {traits.map((t, idx) => (
              <div key={idx} style={{ 
                padding: "6px 9px", 
                borderRadius: "4px", 
                background: "#F8FAFC", 
                border: "1px solid #E2E8F0", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                fontSize: "10.5px" 
              }}>
                <span style={{ color: "#1E293B", fontWeight: "500", lineHeight: "1.3" }}>{t.description}</span>
                <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: "#FEF3C7", color: "#92400E", fontWeight: "700", whiteSpace: "nowrap", marginLeft: "6px" }}>
                  Observed
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "8px", fontSize: "10px", color: "#64748B", background: "#F8FAFC", borderRadius: "4px", border: "1px solid #E2E8F0" }}>
            No elevated behavioral markers reported in this evaluation session.
          </div>
        )}
      </div>

      {/* 5. Section B: Appendix / Exploratory Vision Demo Disclaimer */}
      <div style={{ marginBottom: "14px", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px", padding: "8px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
          <span style={{ fontSize: "10px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>
            Section B: Exploratory Vision Interface Status (Appendix Only)
          </span>
          <span style={{ fontSize: "9px", color: "#D97706", fontWeight: "700" }}>
            Unvalidated &bull; Not Used in Diagnostic Prediction
          </span>
        </div>
        <p style={{ fontSize: "9.5px", color: "#64748B", lineHeight: "1.4", margin: "0 0 6px 0" }}>
          Software demonstration module only. Single 2D webcam frame cannot support physical millimeter measurements or clinical diagnosis. Facial geometry was excluded from the decision classification pipeline.
        </p>
        <div style={{ display: "flex", gap: "12px", fontSize: "9.5px", color: "#334155" }}>
          <span>IPD (Iris Estimate): <strong>{visionBiometrics?.interpupillarySpan || "≈ 63.5 mm"}</strong></span>
          <span>&bull;</span>
          <span>Bizygomatic Width: <strong>{visionBiometrics?.facialWidth || "≈ 142.0 mm"}</strong></span>
          <span>&bull;</span>
          <span>Face Length: <strong>{visionBiometrics?.facialLength || "≈ 174.5 mm"}</strong></span>
        </div>
      </div>

      {/* 6. Attestation & Signature Block */}
      <div style={{ 
        marginTop: "16px", 
        borderTop: "1px solid #CBD5E1", 
        paddingTop: "12px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-end" 
      }}>
        <div style={{ fontSize: "9px", color: "#64748B", maxWidth: "440px", lineHeight: "1.4" }}>
          <strong>Regulatory Attestation:</strong> NeuroScreen AI™ is an exploratory clinical decision support system designed solely for pre-screening triage. It does NOT constitute a definitive medical diagnosis. Comprehensive diagnostic evaluation requires formal developmental history and in-person clinical observation by a qualified practitioner.
        </div>
        <div style={{ textAlign: "center", width: "190px" }}>
          <div style={{ borderBottom: "1.5px solid #0F172A", height: "26px", marginBottom: "4px" }}></div>
          <div style={{ fontSize: "10px", fontWeight: "600", color: "#0F172A" }}>Clinician / Evaluator Signature</div>
          <div style={{ fontSize: "8.5px", color: "#64748B" }}>Date / License Stamp</div>
        </div>
      </div>
    </div>
  );
}

export default function Result({
  screeningResult,
  visionBiometrics,
  selectedCohort,
  startScreening,
  setCurrentPage,
  llmExplanation
}) {
  const [copied, setCopied] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  
  // Stable report ID and date for this session
  const [reportId] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [reportDate] = useState(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (showDocModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showDocModal]);

  if (!screeningResult) return null;

  const isLower = screeningResult.badge_variant === "lower";
  const isHigher = screeningResult.badge_variant === "higher";
  const isAbstain = screeningResult.badge_variant === "abstain";

  // Qualitative headline title
  const headlineTitle = isHigher 
    ? "Higher Likelihood" 
    : (isLower ? "Lower Likelihood" : "Please See a Specialist");

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summaryText = `[NeuroScreen AI™ Clinical Decision Support Report]
Report ID: #${reportId}
Evaluation Date: ${reportDate}
Screening support only. Not a diagnosis.
Cohort: ${selectedCohort?.toUpperCase() || screeningResult.cohort?.toUpperCase()}
Outcome: ${headlineTitle}
Decision Strategy: Conformal Clinical Triage (Selective Abstention)
Confidence Index: ${screeningResult.confidence_index || "Audited"}
Behavioral Screener Outcome: ${screeningResult.state || headlineTitle}
Exploratory Vision Demo: Software demo, not validated, not used in prediction.
Disclaimer: Screening support only. Not a medical diagnosis. Formal evaluation requires clinical observation.`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div style={{ maxWidth: "980px", margin: "0 auto" }}>
      {/* Complete Print Stylesheet: Solves Multi-Page Duplication & Blank Page Print */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 12mm;
        }

        @media screen {
          #clinical-print-portal {
            display: none !important;
          }
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide entire main interactive application tree completely from print layout */
          #root {
            display: none !important;
            height: 0 !important;
            max-height: 0 !important;
            overflow: hidden !important;
            visibility: hidden !important;
          }

          /* Suppress decorative canvas background & navigational chrome */
          .side-rays-backdrop,
          .side-rays-left,
          .side-rays-right,
          header,
          nav,
          footer,
          .no-print {
            display: none !important;
          }

          /* Display ONLY the single-page portal at document root */
          #clinical-print-portal {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            max-width: 186mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            color: #0F172A !important;
            box-sizing: border-box !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            break-after: avoid !important;
          }

          #clinical-print-portal * {
            visibility: visible !important;
          }
        }
      `}</style>

      {/* PRINT PORTAL: Always rendered directly on document.body for flawless single-page printing */}
      {typeof document !== "undefined" && createPortal(
        <div id="clinical-print-portal">
          <ClinicalPrintSheet
            screeningResult={screeningResult}
            visionBiometrics={visionBiometrics}
            selectedCohort={selectedCohort}
            headlineTitle={headlineTitle}
            isLower={isLower}
            isHigher={isHigher}
            isAbstain={isAbstain}
            reportId={reportId}
            reportDate={reportDate}
            preview={false}
          />
        </div>,
        document.body
      )}

      {/* MANDATORY DISCLAIMER BANNER ON EVERY RESULT SCREEN */}
      <div className="screening-disclaimer-banner" style={{ background: "#F7F5EF", color: "#1D2430", borderLeft: "6px solid #2F5D8A", padding: "12px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "14px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
        <ShieldCheck size={20} color="#2F5D8A" style={{ flexShrink: 0 }} />
        <span>Screening support only. Not a diagnosis.</span>
      </div>

      {/* Top Header & Actions Bar */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "700", color: "#CBD5E1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
            <Award size={14} /> Cognitive Screener &bull; Audited Decision Support
          </div>
          <h1 style={{ fontSize: "28px", color: "#FFFFFF", margin: 0 }}>Screening Assessment Outcome</h1>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button 
            id="btn-generate-pdf-modal"
            className="btn-primary"
            onClick={() => setShowDocModal(true)}
            style={{ padding: "8px 18px", fontSize: "13px", background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%)", color: "#090514", border: "1px solid rgba(255, 255, 255, 0.6)", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <FileText size={15} /> Document Generation &bull; PDF
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={handleCopySummary}
            style={{ padding: "8px 14px", fontSize: "13px" }}
          >
            {copied ? <CheckCheck size={14} color="#FFFFFF" /> : <Copy size={14} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <button 
            id="btn-main-screen-print"
            className="btn-secondary" 
            onClick={handlePrint}
            style={{ padding: "8px 14px", fontSize: "13px" }}
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Main Diagnostic Verdict Card */}
      <div 
        className={`result-status-card ${isLower ? "result-lower" : isHigher ? "result-higher" : "result-moderate"}`} 
        style={{ 
          padding: "24px 28px", 
          marginBottom: "22px",
          borderColor: isAbstain ? "#C0453A" : (isHigher ? "#E8B93C" : "#2F5D8A"),
          background: isAbstain ? "rgba(192, 69, 58, 0.15)" : (isHigher ? "rgba(232, 185, 60, 0.15)" : "rgba(47, 93, 138, 0.15)")
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
          <div 
            className={`result-badge-pill ${isLower ? "badge-lower" : isHigher ? "badge-higher" : "badge-moderate"}`} 
            style={{ 
              fontSize: "15px", 
              padding: "7px 16px",
              background: isAbstain ? "#C0453A" : (isHigher ? "#E8B93C" : "#2F5D8A"),
              color: isHigher ? "#1D2430" : "#FFFFFF",
              fontWeight: "700"
            }}
          >
            {isLower && <CheckCircle2 size={18} />}
            {isHigher && <AlertCircle size={18} />}
            {isAbstain && <AlertTriangle size={18} />}
            {headlineTitle}
          </div>
          <div style={{ fontSize: "13px", fontWeight: "700", opacity: 0.9 }}>
            Selective Triage: {isAbstain ? "Abstention Triggered" : "Covered Decision"} &bull; Cohort: {(selectedCohort || screeningResult.cohort).toUpperCase()}
          </div>
        </div>

        <p style={{ fontSize: "16px", lineHeight: "1.5", fontWeight: "500", marginTop: "14px", marginBottom: "4px", color: "#FFFFFF" }}>
          {isAbstain 
            ? "Prediction set includes both classes (conformal abstention). Automated decision support cannot reliably classify this profile; consultation with a neurodevelopmental specialist is advised."
            : screeningResult.state_description}
        </p>
      </div>

      {/* Two Modules: Behavioral Questionnaire Screener + Separate Unvalidated Appendix Demo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginBottom: "22px" }}>
        {/* Module 1: Validated Behavioral Questionnaire */}
        <div className="health-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ fontSize: "16px", color: "#FFFFFF", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={16} color="#DCE7F2" /> Behavioral Screener
            </h3>
            <span style={{ fontSize: "11px", color: "#DCE7F2", background: "rgba(47, 93, 138, 0.4)", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
              Nested CV Validated
            </span>
          </div>

          <div style={{ fontSize: "13px", color: "#CBD5E1", marginBottom: "14px" }}>
            Reported traits: <strong style={{ color: "#FFFFFF" }}>{screeningResult.key_traits_identified?.length || 0} indicators endorsed</strong>
          </div>

          {screeningResult.key_traits_identified && screeningResult.key_traits_identified.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto" }}>
              {screeningResult.key_traits_identified.map((t, idx) => (
                <div key={idx} style={{ padding: "8px 12px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.07)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#FFFFFF" }}>{t.description}</span>
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(232, 185, 60, 0.2)", color: "#E8B93C", whiteSpace: "nowrap", fontWeight: "700" }}>
                    Observed
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "16px", textAlign: "center", color: "#94A3B8", fontSize: "13px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "8px" }}>
              No elevated behavioral traits recorded for this session.
            </div>
          )}
        </div>

        {/* Module 2: Vision / Iris Exploratory Demo */}
        <div className="health-card" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ fontSize: "15px", color: "#FFFFFF", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
              <Eye size={16} color="#CBD5E1" /> Exploratory Vision Demo
            </h3>
            <span style={{ fontSize: "10px", color: "#E8B93C", background: "rgba(232, 185, 60, 0.15)", padding: "2px 8px", borderRadius: "4px", fontWeight: "600" }}>
              Unvalidated Demo
            </span>
          </div>

          <div style={{ padding: "8px 10px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)", fontSize: "11px", color: "#94A3B8", marginBottom: "10px", lineHeight: "1.4" }}>
            Software demo, not validated, not used in any prediction. Single webcam frame cannot support physical millimeter measurements or clinical diagnosis.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ background: "rgba(9, 5, 20, 0.6)", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#94A3B8" }}>Inter-pupillary Distance (IPD):</span>
                <strong style={{ color: "#FFFFFF" }}>{visionBiometrics?.interpupillarySpan || "≈ 63.5 mm ± 8%"}</strong>
              </div>
            </div>

            <div style={{ background: "rgba(9, 5, 20, 0.6)", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#94A3B8" }}>Bizygomatic Width (#234-#454):</span>
                <strong style={{ color: "#CBD5E1" }}>{visionBiometrics?.facialWidth || "≈ 142.0 mm ± 8%"}</strong>
              </div>
            </div>

            <div style={{ background: "rgba(9, 5, 20, 0.6)", padding: "8px 12px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#94A3B8" }}>Face Length (#10-#152):</span>
                <strong style={{ color: "#CBD5E1" }}>{visionBiometrics?.facialLength || "≈ 174.5 mm ± 8%"}</strong>
              </div>
            </div>

            <div style={{ padding: "6px 10px", borderRadius: "6px", background: "rgba(232, 185, 60, 0.12)", border: "1px solid rgba(232, 185, 60, 0.3)", fontSize: "10px", color: "#E8B93C" }}>
              approximate, from iris scale, not clinical, not used in any prediction
            </div>
          </div>
        </div>
      </div>

      {/* AI Clinical Synthesis & Recommendations */}
      {llmExplanation && (
        <div className="health-card" style={{ marginBottom: "22px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <Sparkles size={17} color="#CBD5E1" />
            <h3 style={{ fontSize: "16px", color: "#FFFFFF", margin: 0 }}>Clinical Synthesis &amp; Next Steps</h3>
          </div>
          <p style={{ fontSize: "14px", color: "#E2E8F0", lineHeight: "1.6", margin: 0, whiteSpace: "pre-line" }}>
            {llmExplanation.explanation || llmExplanation.text}
          </p>
        </div>
      )}

      {/* Regulatory Notice */}
      <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.15)", display: "flex", gap: "10px", alignItems: "center", marginBottom: "24px" }}>
        <ShieldCheck size={18} color="#FFFFFF" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: "12px", color: "#CBD5E1" }}>
          Screening support only. Not a medical diagnosis. Formal evaluation requires developmental history and in-person observation by a licensed specialist.
        </span>
      </div>

      {/* Bottom Actions */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: "20px", flexWrap: "wrap", gap: "12px" }}>
        <button className="btn-secondary" onClick={() => startScreening(selectedCohort)} style={{ fontSize: "13px", padding: "9px 18px" }}>
          <RefreshCw size={15} /> Retake Assessment
        </button>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="btn-secondary" onClick={() => setCurrentPage("vision")} style={{ fontSize: "13px", padding: "9px 18px" }}>
            Review Vision Demo (Appendix)
          </button>
          <button className="btn-primary" onClick={() => setCurrentPage("home")} style={{ fontSize: "13px", padding: "9px 20px" }}>
            Return to Dashboard <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* DOCUMENT GENERATION MODAL PORTAL: Mounts to document.body to sit completely above all headers & navbars */}
      {showDocModal && typeof document !== "undefined" && createPortal(
        <div 
          id="clinical-doc-modal-overlay"
          style={{ 
            position: "fixed", 
            inset: 0, 
            background: "rgba(3, 1, 8, 0.88)", 
            backdropFilter: "blur(12px)", 
            WebkitBackdropFilter: "blur(12px)",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            zIndex: 9999999, 
            padding: "24px 20px"
          }}
        >
          <div style={{ 
            background: "#090514", 
            border: "1px solid rgba(167, 139, 250, 0.35)", 
            borderRadius: "16px", 
            width: "100%", 
            maxWidth: "840px", 
            maxHeight: "92vh", 
            display: "flex", 
            flexDirection: "column",
            boxShadow: "0 25px 70px rgba(0, 0, 0, 0.9)",
            overflow: "hidden",
            zIndex: 10000000
          }}>
            
            {/* Modal Header Bar with explicit actions */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              borderBottom: "1px solid rgba(255, 255, 255, 0.12)", 
              padding: "16px 24px", 
              background: "rgba(255, 255, 255, 0.03)",
              flexShrink: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileText size={22} color="#FFFFFF" />
                <div>
                  <h3 style={{ fontSize: "17px", color: "#FFFFFF", margin: 0, fontWeight: "700" }}>
                    Clinical Document Preview &bull; Single-Page PDF
                  </h3>
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    Official Standardized Record &bull; Ready for Print / Save
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  id="btn-modal-print-pdf"
                  onClick={handlePrint}
                  className="btn-primary"
                  style={{ 
                    padding: "7px 16px", 
                    fontSize: "12px", 
                    background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%)", 
                    color: "#090514", 
                    border: "1px solid rgba(255, 255, 255, 0.6)", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "6px",
                    fontWeight: "700"
                  }}
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button
                  id="btn-modal-close"
                  onClick={() => setShowDocModal(false)}
                  className="btn-secondary"
                  style={{ padding: "7px 14px", fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <X size={14} /> Close
                </button>
              </div>
            </div>

            {/* Document Preview Area: Column Layout prevents flex stretching, wraps entire content in white background */}
            <div style={{ 
              padding: "28px 24px", 
              overflowY: "auto", 
              background: "#0c0817", 
              display: "flex", 
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              boxSizing: "border-box",
              flexGrow: 1
            }}>
              <ClinicalPrintSheet
                screeningResult={screeningResult}
                visionBiometrics={visionBiometrics}
                selectedCohort={selectedCohort}
                headlineTitle={headlineTitle}
                isLower={isLower}
                isHigher={isHigher}
                isAbstain={isAbstain}
                reportId={reportId}
                reportDate={reportDate}
                preview={true}
              />
            </div>

            {/* Modal Footer Note */}
            <div style={{ 
              padding: "10px 24px", 
              borderTop: "1px solid rgba(255, 255, 255, 0.08)", 
              fontSize: "11px", 
              color: "#94A3B8", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              background: "rgba(9, 5, 20, 0.95)",
              flexShrink: 0
            }}>
              <span>Status: Strict 1-Page Layout formatted for standard Letter/A4 output.</span>
              <span style={{ color: "#E2E8F0" }}>Screening support only. Not a diagnosis.</span>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
