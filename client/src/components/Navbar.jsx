import React, { useState } from "react";
import { Brain, Activity, Shield, Sparkles, HelpCircle, Menu, X, ArrowRight } from "lucide-react";
import JellyRadio from "./JellyRadio";

export default function Navbar({ currentPage, setCurrentPage, startScreening, selectedCohort }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  const handleStartScreening = () => {
    startScreening(selectedCohort || "adult");
    setMobileMenuOpen(false);
  };

  const navItems = [
    { value: "home", label: "Home" },
    { value: "screening", label: "Clinical Screener", icon: <Activity size={14} /> },
    { value: "vision", label: "Vision Lab", icon: <Sparkles size={14} /> },
    { value: "privacy", label: "Security & Privacy", icon: <Shield size={14} /> },
    { value: "how-it-works", label: "How It Works", icon: <HelpCircle size={14} /> }
  ];

  const handleJellyNavChange = (val) => {
    if (val === "screening") {
      handleStartScreening();
    } else {
      handleNavClick(val);
    }
  };

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Clickable Brand Logo */}
        <div 
          className="logo-wrapper" 
          onClick={() => handleNavClick("home")}
          role="button"
          tabIndex={0}
          aria-label="NeuroScreen AI™ Home"
          onKeyDown={(e) => { if (e.key === "Enter") handleNavClick("home"); }}
        >
          <div className="logo-icon-box">
            <Brain size={22} />
          </div>
          <div>
            <div className="logo-title">NeuroScreen AI™<span style={{ color: "#3f3f46" }}>.</span></div>
            <div className="logo-subtitle">Clinical Decision Support</div>
          </div>
        </div>

        {/* Desktop Navigation Links with JellyRadio (Transparent, Only Sections Visible) */}
        <nav className="desktop-only" aria-label="Main Navigation" style={{ display: "flex", alignItems: "center" }}>
          <JellyRadio
            items={navItems}
            value={["home", "how-it-works", "screening", "vision", "privacy"].includes(currentPage) ? currentPage : undefined}
            onChange={handleJellyNavChange}
            chipColor="transparent"
            activeColor="linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)"
            textColor="#CBD5E1"
            activeTextColor="#090514"
            size="md"
            gap={6}
            radius={14}
            swell={0.16}
            barge={5}
            bounce={0.24}
            stiffness={560}
            ariaLabel="Main Navigation"
          />
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button 
          className="mobile-menu-toggle mobile-only" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="dialog" aria-modal="true">
          <nav className="mobile-nav-list">
            <button 
              className={`mobile-nav-item ${currentPage === "home" ? "active" : ""}`}
              onClick={() => handleNavClick("home")}
            >
              Home
            </button>
            <button 
              className={`mobile-nav-item ${currentPage === "screening" ? "active" : ""}`}
              onClick={handleStartScreening}
            >
              <Activity size={16} /> Clinical Screener
            </button>
            <button 
              className={`mobile-nav-item ${currentPage === "vision" ? "active" : ""}`}
              onClick={() => handleNavClick("vision")}
            >
              <Sparkles size={16} /> Vision Lab
            </button>
            <button 
              className={`mobile-nav-item ${currentPage === "privacy" ? "active" : ""}`}
              onClick={() => handleNavClick("privacy")}
            >
              <Shield size={16} /> Security &amp; Privacy
            </button>
            <button 
              className={`mobile-nav-item ${currentPage === "how-it-works" ? "active" : ""}`}
              onClick={() => handleNavClick("how-it-works")}
            >
              <HelpCircle size={16} /> How It Works
            </button>
            <button 
              className={`mobile-nav-item ${currentPage === "terms" ? "active" : ""}`}
              onClick={() => handleNavClick("terms")}
            >
              Terms &amp; Clinical Ethics
            </button>

            <div style={{ paddingTop: "12px", marginTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <button 
                className="btn-primary" 
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleStartScreening}
              >
                Begin Screener Now <ArrowRight size={16} />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
