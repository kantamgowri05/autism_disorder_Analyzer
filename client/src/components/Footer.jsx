import React from "react";
import { Brain, Mail, Phone } from "lucide-react";

export default function Footer({ setCurrentPage, startScreening, selectedCohort }) {
  const currentYear = new Date().getFullYear();

  const handleNav = (page) => {
    setCurrentPage(page);
  };

  const handleStart = (cohort) => {
    startScreening(cohort || "adult");
  };

  return (
    <footer className="app-footer">
      <div className="footer-inner">
        {/* Brand & Organization Column */}
        <div className="footer-brand-col">
          <div 
            className="logo-wrapper" 
            onClick={() => handleNav("home")}
            style={{ marginBottom: "16px", cursor: "pointer" }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") handleNav("home"); }}
          >
            <div className="logo-icon-box">
              <Brain size={22} />
            </div>
            <div>
              <div className="logo-title">NeuroScreen AI™<span style={{ color: "#FFFFFF" }}>.</span></div>
              <div className="logo-subtitle">Clinical Decision Support</div>
            </div>
          </div>
          <p className="footer-bio">
            NeuroScreen AI™ is an auxiliary clinical decision-support platform designed to assist pediatricians, family healthcare professionals, and parents with structured developmental screening and transparent follow-up guidance.
          </p>
          <div className="footer-contact-block">
            <div className="footer-contact-item">
              <Mail size={15} color="#FFFFFF" />
              <a href="mailto:clinical-inquiries@neuroscreen.ai" className="footer-contact-link">
                clinical-inquiries@neuroscreen.ai
              </a>
            </div>
            <div className="footer-contact-item">
              <Phone size={15} color="#FFFFFF" />
              <a href="tel:+18005550199" className="footer-contact-link">
                +1 (800) 555-0199 (Mon-Fri, 9am-6pm EST)
              </a>
            </div>
          </div>
        </div>

        {/* Screening Protocols Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Screening Protocols</h4>
          <ul className="footer-nav-list">
            <li>
              <button className="footer-link-btn" onClick={() => handleStart("toddler")}>
                Toddler Q-CHAT-10 (12-36 Mo)
              </button>
            </li>
            <li>
              <button className="footer-link-btn" onClick={() => handleStart("children")}>
                Child AQ-10 (4-11 Yrs)
              </button>
            </li>
            <li>
              <button className="footer-link-btn" onClick={() => handleStart("adolescent")}>
                Adolescent AQ-10 (12-16 Yrs)
              </button>
            </li>
            <li>
              <button className="footer-link-btn" onClick={() => handleStart("adult")}>
                Adult AQ-10 (18+ Yrs)
              </button>
            </li>
            <li>
              <button className="footer-link-btn" onClick={() => handleStart("adult")}>
                Streamlined 5-Item Triage
              </button>
            </li>
          </ul>
        </div>

        {/* Clinical Platform Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Clinical Platform</h4>
          <ul className="footer-nav-list">
            <li>
              <button className="footer-link-btn" onClick={() => handleNav("how-it-works")}>
                How It Works &amp; Methodology
              </button>
            </li>
            <li>
              <button className="footer-link-btn" onClick={() => handleNav("vision")}>
                Two-Stage Vision Lab
              </button>
            </li>
            <li>
              <button className="footer-link-btn" onClick={() => handleNav("privacy")}>
                Edge Security &amp; Zero Retention
              </button>
            </li>
            <li>
              <button className="footer-link-btn" onClick={() => handleNav("how-it-works")}>
                Clinical Decision Protocol
              </button>
            </li>
          </ul>
        </div>

        {/* Regulatory & Governance Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Compliance &amp; Governance</h4>
          <ul className="footer-nav-list">
            <li>
              <button className="footer-link-btn" onClick={() => handleNav("privacy")}>
                Privacy Policy &amp; Security Standards
              </button>
            </li>
            <li>
              <button className="footer-link-btn" onClick={() => handleNav("terms")}>
                Terms of Service &amp; Clinical Ethics
              </button>
            </li>
            <li>
              <span className="footer-static-notice">
                HIPAA Technical Safeguards Aligned
              </span>
            </li>
            <li>
              <span className="footer-static-notice">
                Zero Cloud Storage &bull; On-Device Processing
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="footer-bottom-inner">
          <div className="footer-copyright">
            &copy; {currentYear} NeuroScreen AI™&trade; Healthcare Technologies Inc. All rights reserved.
          </div>
          <div className="footer-disclaimer-text">
            Regulatory Notice: NeuroScreen AI™ is a clinical decision-support screener for authorized healthcare personnel and preliminary assessment. It does not provide medical diagnoses or replace licensed specialist evaluation.
          </div>
        </div>
      </div>
    </footer>
  );
}
