import React from 'react';
import { Baby, Users, User, HeartPulse, ArrowRight, Eye, Sparkles } from 'lucide-react';
import DitherVeil from './DitherVeil';

export default function Home({ startScreening, setCurrentPage }) {
  const cohorts = [
    { id: 'toddler', label: 'Toddlers (12–36 Mo)', icon: Baby },
    { id: 'children', label: 'Children (4–11 Yrs)', icon: Users },
    { id: 'adolescent', label: 'Adolescents (12–16 Yrs)', icon: User },
    { id: 'adult', label: 'Adults (18+ Yrs)', icon: HeartPulse }
  ];

  return (
    <div className="home-single-hero" style={{ maxWidth: '1240px', margin: '0 auto', padding: '16px 0 28px 0' }}>
      {/* Seamless Silver Hero Presentation (No Box Lines, Unified with Background) */}
      <div className="hero-split-grid" style={{ gap: '42px', alignItems: 'center' }}>
        
        {/* Left Column: Focused Clinical Messaging & Actions */}
        <div className="hero-content-col">
          <div className="hero-tagline" style={{ marginBottom: '16px' }}>
            <span className="pulse-dot"></span>
            Clinical Decision Support Platform
          </div>

          <h1 className="hero-heading" style={{ fontSize: '40px', lineHeight: '1.16', marginBottom: '16px' }}>
            Precision Screening for Early Autism Spectrum Guidance
          </h1>

          <p className="hero-lead" style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '26px', maxWidth: '560px' }}>
            NeuroScreen AI™ provides structured behavioral assessments and gentle visual landmark analysis to assist clinicians and families with early developmental evaluation.
          </p>

          {/* Primary Action Buttons (Silver / Chrome Gradients) */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '26px' }}>
            <button className="btn-primary" onClick={() => startScreening('adult')}>
              Begin Screener <ArrowRight size={16} />
            </button>
            <button className="btn-secondary" onClick={() => setCurrentPage('vision')}>
              <Eye size={16} /> Open Vision Lab
            </button>
          </div>

          {/* Direct 1-Click Cohort Selector Chips (Clean Silver Styling) */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Direct Cohort Launch:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {cohorts.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => startScreening(c.id)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      color: '#E2E8F0',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#FFFFFF';
                      e.currentTarget.style.color = '#FFFFFF';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                      e.currentTarget.style.color = '#E2E8F0';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <Icon size={14} color="#CBD5E1" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform Metric Pills (Clean Slate-Silver Contrast) */}
          <div className="stats-grid" style={{ marginTop: '0', paddingTop: '18px', gap: '10px' }}>
            <div className="stat-item" style={{ padding: '10px 14px' }}>
              <div className="stat-value" style={{ fontSize: '20px' }}>4 Stages</div>
              <div className="stat-label">Tailored Age Protocols</div>
            </div>
            <div className="stat-item" style={{ padding: '10px 14px' }}>
              <div className="stat-value" style={{ fontSize: '20px' }}>5–10 Min</div>
              <div className="stat-label">Quick Assessment</div>
            </div>
            <div className="stat-item" style={{ padding: '10px 14px' }}>
              <div className="stat-value" style={{ fontSize: '20px' }}>100% Private</div>
              <div className="stat-label">Zero Data Stored</div>
            </div>
            <div className="stat-item" style={{ padding: '10px 14px' }}>
              <div className="stat-value" style={{ fontSize: '20px' }}>Multimodal</div>
              <div className="stat-label">Behavioral + Visual</div>
            </div>
          </div>
        </div>

        {/* Right Column: Borderless Seamless DitherVeil Merged Into Hero */}
        <div className="hero-visual-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          
          {/* DitherVeil Canvas - pure model float with native alpha transparency */}
          <div style={{
            width: '100%',
            maxWidth: '460px',
            height: '460px',
            position: 'relative',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <DitherVeil
              src="https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop"
              pattern="bayer"
              pixelSize={1}
              inkColor="#000000"
              paperColor="#ffffff"
              revealRadius={95}
              softness={0.65}
              linger={1}
            />
          </div>

          {/* Subtle Silver Monochromatic Hint Pill Placed Below the Model */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#E2E8F0',
            marginTop: '14px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            padding: '5px 14px',
            borderRadius: '100px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.4)'
          }}>
            <Sparkles size={12} color="#FFFFFF" />
            <span>Biometric Feature Veil &bull; Glide cursor across portrait</span>
          </div>
        </div>

      </div>
    </div>
  );
}
