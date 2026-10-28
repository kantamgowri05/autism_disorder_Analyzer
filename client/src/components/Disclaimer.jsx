import React from "react";

export default function Disclaimer() {
  return (
    <div className="disclaimer-banner" role="alert">
      <div className="geo-circle" style={{ backgroundColor: "var(--accent-ochre)" }} aria-hidden="true"></div>
      <div>Screening support only. Not a diagnosis. Please consult a qualified professional.</div>
    </div>
  );
}
