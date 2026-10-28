import React, { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Sparkles, Zap, ShieldCheck, Check, Eye } from "lucide-react";
import JellyRadio from "./JellyRadio";

export default function Screening({
  selectedCohort,
  activeQuestions,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  answers,
  handleAnswer,
  handleSubmitScreening,
  loading,
  screeningMode,
  setScreeningMode
}) {
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);

  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];
  const progressPercent = Math.round(((currentQuestionIndex + 1) / activeQuestions.length) * 100);
  const isAnswered = currentQ && answers[currentQ.id] !== undefined;

  const isPediatric = selectedCohort === "toddler" || selectedCohort === "children";

  // Auto-advance dynamically upon option click
  const onAnswerSelect = (val) => {
    if (isAdvancing) return;
    handleAnswer(val);

    const isFinalQ = currentQuestionIndex >= activeQuestions.length - 1;
    const label = isFinalQ
      ? "Final Question Logged! Transitioning to Step 2: Vision Lab..."
      : (val === 1 
          ? (isPediatric ? "Recorded: Frequent in Child" : "Recorded: Consistent")
          : (isPediatric ? "Recorded: Age-Typical Play" : "Recorded: Seldom / Disagree"));
    setFeedbackMsg(label);

    setIsAdvancing(true);
    setTimeout(() => {
      setFeedbackMsg("");
      setIsAdvancing(false);
      if (!isFinalQ) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Automatically proceed to Step 2: Vision Lab on the final question!
        handleSubmitScreening({ ...answers, [currentQ.id]: val });
      }
    }, 420);
  };

  const handleModeSwitch = (mode) => {
    setScreeningMode(mode);
    setFeedbackMsg(`Protocol updated: ${mode === "rapid" ? "Rapid 5-Item Triage" : "Standard AQ-10"}`);
    setTimeout(() => setFeedbackMsg(""), 2000);
  };

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      {/* Step Progress Pill */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "5px 14px", borderRadius: "8px", fontSize: "12px", color: "#E2E8F0", fontWeight: "700" }}>
          <span>Step 1 of 2: Behavioral Screener</span>
          <span>&bull;</span>
          <span style={{ color: "#FFFFFF" }}>Next: Vision &amp; Ocular Biometrics Lab</span>
        </div>

        {/* Mode Selector with JellyRadio */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <JellyRadio
            items={[
              { value: "standard", label: "Standard AQ-10" },
              { value: "rapid", label: "Rapid 5-Item", icon: <Zap size={13} /> }
            ]}
            value={screeningMode}
            onChange={(val) => handleModeSwitch(val)}
            chipColor="rgba(255, 255, 255, 0.05)"
            activeColor="linear-gradient(135deg, #FFFFFF 0%, #CBD5E1 100%)"
            textColor="#CBD5E1"
            activeTextColor="#090514"
            size="sm"
            radius={10}
            gap={4}
            swell={0.14}
            bounce={0.22}
            ariaLabel="Screening Protocol Modes"
          />
        </div>
      </div>

      {/* Dynamic Feedback Toast */}
      {feedbackMsg && (
        <div style={{ marginBottom: "14px", padding: "8px 14px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.2)", color: "#FFFFFF", fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
          <Check size={15} color="#FFFFFF" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Stepper Header Box */}
      <div className="stepper-header-box" style={{ padding: "18px 22px", marginBottom: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "700", color: "#CBD5E1", letterSpacing: "0.06em" }}>
              {isPediatric ? "Pediatric Behavioral Assessment" : "Clinical Behavioral Protocol"} &bull; {selectedCohort.toUpperCase()}
            </span>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#FFFFFF", marginTop: "2px" }}>
              Question {currentQuestionIndex + 1} of {activeQuestions.length}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#FFFFFF" }}>
              {progressPercent}%
            </span>
            <div style={{ fontSize: "11px", color: "#CBD5E1", fontWeight: "600" }}>
              Progress
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-track" style={{ height: "6px", marginTop: "12px" }}>
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, transition: "width 0.3s ease" }}></div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="question-box" style={{ padding: "28px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "6px" }}>
          <div className="question-badge" style={{ fontSize: "11px", padding: "3px 10px" }}>
            Item #{currentQuestionIndex + 1} ({currentQ ? currentQ.id : ""})
          </div>
          <span style={{ fontSize: "12px", color: "#94A3B8" }}>
            Click an option to auto-advance
          </span>
        </div>

        <h2 className="question-title" style={{ fontSize: "20px", lineHeight: "1.45", marginBottom: "24px" }}>
          {currentQ ? currentQ.text : "Loading indicator..."}
        </h2>

        {/* Adaptive Answer Options */}
        {currentQ && (
          <div className="answers-pills" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Yes / Observed Option */}
            <div
              className={`answer-btn ${answers[currentQ.id] === 1 ? "selected" : ""}`}
              onClick={() => onAnswerSelect(1)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onAnswerSelect(1); }}
              style={{
                cursor: "pointer",
                padding: "16px 20px",
                borderRadius: "10px",
                transition: "all 0.15s ease",
                border: answers[currentQ.id] === 1 ? "2px solid #FFFFFF" : "1px solid rgba(255, 255, 255, 0.1)",
                background: answers[currentQ.id] === 1 ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.04)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  backgroundColor: answers[currentQ.id] === 1 ? "#FFFFFF" : "rgba(255, 255, 255, 0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: answers[currentQ.id] === 1 ? "#090514" : "#94A3B8"
                }}>
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: "700", color: "#FFFFFF", fontSize: "15px" }}>
                    {isPediatric ? "Frequently Observed in Child / Persistent" : "Yes / Definitely Agree"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                    {isPediatric ? "Consistently demonstrated during daily play, routines, or interactions" : "Observed consistently or frequently experienced"}
                  </div>
                </div>
              </div>
            </div>

            {/* No / Typical Option */}
            <div
              className={`answer-btn ${answers[currentQ.id] === 0 ? "selected" : ""}`}
              onClick={() => onAnswerSelect(0)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onAnswerSelect(0); }}
              style={{
                cursor: "pointer",
                padding: "16px 20px",
                borderRadius: "10px",
                transition: "all 0.15s ease",
                border: answers[currentQ.id] === 0 ? "2px solid #FFFFFF" : "1px solid rgba(255, 255, 255, 0.1)",
                background: answers[currentQ.id] === 0 ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.04)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  backgroundColor: answers[currentQ.id] === 0 ? "#FFFFFF" : "rgba(255, 255, 255, 0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: answers[currentQ.id] === 0 ? "#090514" : "#94A3B8"
                }}>
                  <XCircle size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: "700", color: "#FFFFFF", fontSize: "15px" }}>
                    {isPediatric ? "Age-Typical Play / Seldom Observed" : "No / Rarely Disagree"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                    {isPediatric ? "Demonstrates normative developmental social reciprocity or flexibility" : "Seldom observed or does not apply"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "20px", marginTop: "22px" }}>
          <button
            className="btn-secondary"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            style={{ visibility: currentQuestionIndex === 0 ? "hidden" : "visible", padding: "9px 18px", fontSize: "13px" }}
          >
            <ArrowLeft size={15} /> Previous Question
          </button>

          {currentQuestionIndex < activeQuestions.length - 1 ? (
            <button
              className="btn-primary"
              disabled={!isAnswered}
              onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              style={{ opacity: isAnswered ? 1 : 0.6, padding: "10px 22px", fontSize: "13px" }}
            >
              Next Item <ArrowRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={loading}
              onClick={() => {
                const currentVal = answers[currentQ.id] !== undefined ? answers[currentQ.id] : 0;
                handleSubmitScreening({ ...answers, [currentQ.id]: currentVal });
              }}
              style={{
                padding: "11px 24px",
                fontSize: "13px",
                background: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #CBD5E1 100%)",
                color: "#090514",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(255, 255, 255, 0.25)"
              }}
            >
              <Eye size={16} />
              {loading ? "Recording Screener..." : "Proceed to Step 2: Vision & Ocular Lab"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
