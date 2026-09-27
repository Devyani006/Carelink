import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, Zap, Users, Calendar, Ambulance,
  Droplets, Building2, Clock, CheckCircle2, ShieldAlert,
  ArrowDown, ChevronRight, Layers, Sparkles, Network,
  Radio, HeartPulse
} from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {/* Top Landing Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Red CareLink Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
            <div style={{
              width: 38,
              height: 38,
              background: 'var(--brand-red)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(168, 38, 32, 0.3)'
            }}>
              <Activity size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, lineHeight: 1.1 }}>
                CareLink
              </div>
              <div style={{ fontSize: 11, color: 'var(--brand-red)', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Healthcare Operations
              </div>
            </div>
          </div>

          {/* Navigation Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button
              onClick={() => scrollToSection('how-it-works')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('coordination')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-secondary)',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--brand-red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              What We Coordinate
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: 13.5 }}
              onClick={() => navigate('/dashboard')}
            >
              Enter CareLink <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section style={{
        padding: '70px 24px 80px',
        maxWidth: 1160,
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Sub-badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 20,
          fontSize: 12.5,
          fontWeight: 700,
          color: 'var(--brand-red)',
          marginBottom: 24,
          boxShadow: 'var(--shadow-xs)'
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-red)', display: 'inline-block' }} />
          <span>Unified Healthcare Coordination &amp; Operations Management</span>
        </div>

        {/* Main Headline */}
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-1.5px',
          lineHeight: 1.15,
          maxWidth: 920,
          margin: '0 auto 20px'
        }}>
          One case. One timeline. Every critical coordination step.
        </h1>

        {/* Supporting Text */}
        <p style={{
          fontSize: 'clamp(16px, 2vw, 19px)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          maxWidth: 780,
          margin: '0 auto 36px',
          fontWeight: 500
        }}>
          CareLink is a unified healthcare coordination platform connecting patients, emergency cases, ambulances, blood requirements, and healthcare facilities in one operational view.
        </p>

        {/* Primary CTA Buttons */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: 50 }}>
          <button
            className="btn btn-primary btn-lg"
            style={{ fontSize: 16, padding: '14px 28px', gap: 10, boxShadow: '0 4px 16px rgba(168, 38, 32, 0.3)' }}
            onClick={() => navigate('/dashboard')}
          >
            Enter CareLink <ArrowRight size={18} />
          </button>
          <button
            className="btn btn-secondary btn-lg"
            style={{ fontSize: 15, padding: '14px 24px', background: '#FFFFFF' }}
            onClick={() => scrollToSection('how-it-works')}
          >
            Explore how it works <ArrowDown size={16} />
          </button>
        </div>

        {/* Restrained Connected Nodes Graphic (No stock photos/AI images) */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid var(--border)',
          borderRadius: 16,
          padding: '28px 24px',
          maxWidth: 960,
          margin: '0 auto',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-red)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 18 }}>
            Real-Time Coordination Nodes
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, alignItems: 'center' }}>
            {[
              { icon: Users, label: 'Patient Identity', color: 'var(--color-slate)' },
              { icon: Zap, label: 'Emergency Case', color: 'var(--brand-red)' },
              { icon: Ambulance, label: 'Ambulance Unit', color: 'var(--color-urgent)' },
              { icon: Droplets, label: 'Blood Supply', color: 'var(--color-plum)' },
              { icon: Building2, label: 'Receiving Hospital', color: 'var(--color-slate)' },
              { icon: Clock, label: 'Unified Timeline', color: 'var(--color-success)' },
            ].map((node, i) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.label}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '16px 10px',
                    textAlign: 'center',
                    transition: 'transform 0.15s ease, border-color 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = node.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: '#FFFFFF',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px',
                    color: node.color
                  }}>
                    <Icon size={18} strokeWidth={2.4} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                    {node.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          OUR PROMISE
      ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{
        background: '#FFFFFF',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '80px 24px'
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 56px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-red)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
              OUR PROMISE
            </div>
            <h2 style={{
              fontSize: 'clamp(26px, 4vw, 40px)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-1px',
              lineHeight: 1.2,
              marginBottom: 16
            }}>
              When every second matters, coordination shouldn't be the problem.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
              CareLink brings critical coordination steps into one shared operational view, helping teams understand what has happened, what is happening, and what needs attention next.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <div style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              borderRadius: 14,
              padding: '30px 26px',
              borderTop: '4px solid var(--brand-red)'
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'var(--color-emergency-bg)',
                color: 'var(--brand-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}>
                <Network size={22} strokeWidth={2.4} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                CONNECT
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
                Bring patients, emergency cases, ambulances, blood requirements and facilities into one coordinated case.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              borderRadius: 14,
              padding: '30px 26px',
              borderTop: '4px solid var(--color-slate)'
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'var(--color-slate-bg)',
                color: 'var(--color-slate)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}>
                <Clock size={22} strokeWidth={2.4} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                COORDINATE
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
                Track critical actions through a shared emergency timeline instead of disconnected updates.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              borderRadius: 14,
              padding: '30px 26px',
              borderTop: '4px solid var(--color-success)'
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}>
                <CheckCircle2 size={22} strokeWidth={2.4} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
                RESPOND
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
                Give teams a clear operational view of requests, assignments, status changes and receiving facilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          COORDINATION FLOW (One Case. Multiple Coordination Points)
      ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 50px' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-red)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
            ORCHESTRATION ARCHITECTURE
          </div>
          <h2 style={{
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.8px',
            lineHeight: 1.2
          }}>
            One Case. Multiple Coordination Points.
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 10, fontWeight: 500 }}>
            Every stakeholder acts on the same single source of truth without fragmented phone calls or missing records.
          </p>
        </div>

        {/* Visual Workflow Steps */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 12,
          position: 'relative'
        }}>
          {[
            { step: '01', title: 'PATIENT', desc: 'Medical profile & case association', icon: Users, color: 'var(--color-slate)' },
            { step: '02', title: 'EMERGENCY CASE', desc: 'Case priority & triage initiation', icon: Zap, color: 'var(--brand-red)' },
            { step: '03', title: 'AMBULANCE', desc: 'Fleet routing & driver dispatch', icon: Ambulance, color: 'var(--color-urgent)' },
            { step: '04', title: 'BLOOD REQUIREMENT', desc: 'Bank match & component allocation', icon: Droplets, color: 'var(--color-plum)' },
            { step: '05', title: 'RECEIVING FACILITY', desc: 'ICU bed alignment & admission', icon: Building2, color: 'var(--color-slate)' },
            { step: '06', title: 'CASE TIMELINE', desc: 'Unified audit & event logging', icon: Clock, color: 'var(--color-success)' },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12,
                  padding: '22px 16px',
                  position: 'relative',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-red)', fontFamily: 'monospace' }}>
                      {item.step}
                    </span>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: 'var(--bg-secondary)',
                      color: item.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={16} strokeWidth={2.4} />
                    </div>
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.25 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4, fontWeight: 500 }}>
                    {item.desc}
                  </div>
                </div>

                <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Synchronized</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          WHAT CARELINK COORDINATES (6 Core Cards)
      ───────────────────────────────────────────────────────────── */}
      <section id="coordination" style={{
        background: '#FFFFFF',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '80px 24px'
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 50px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--brand-red)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
              OPERATIONAL SCOPE
            </div>
            <h2 style={{
              fontSize: 'clamp(24px, 3.5vw, 36px)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.8px',
              lineHeight: 1.2
            }}>
              What CareLink Coordinates
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 10, fontWeight: 500 }}>
              Six dedicated operational modules integrated seamlessly around the patient journey.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            <div style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              borderRadius: 12,
              padding: '24px 22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--color-slate-bg)', color: 'var(--color-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} strokeWidth={2.4} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>PATIENTS</h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>
                Basic patient information and case association.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              borderRadius: 12,
              padding: '24px 22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--color-slate-bg)', color: 'var(--color-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} strokeWidth={2.4} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>APPOINTMENTS</h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>
                Schedule and track appointment status.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              borderRadius: 12,
              padding: '24px 22px',
              borderTop: '3px solid var(--brand-red)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--color-emergency-bg)', color: 'var(--brand-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={18} strokeWidth={2.4} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>EMERGENCY CASES</h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>
                Create and monitor emergency coordination cases.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              borderRadius: 12,
              padding: '24px 22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--color-urgent-bg)', color: 'var(--color-urgent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ambulance size={18} strokeWidth={2.4} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>AMBULANCES</h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>
                Manage ambulance requests, assignment and status.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              borderRadius: 12,
              padding: '24px 22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--color-plum-bg)', color: 'var(--color-plum)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Droplets size={18} strokeWidth={2.4} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>BLOOD</h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>
                Coordinate blood requirements and available sources.
              </p>
            </div>

            <div style={{
              background: 'var(--bg-primary)',
              border: '1.5px solid var(--border)',
              borderRadius: 12,
              padding: '24px 22px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--color-slate-bg)', color: 'var(--color-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} strokeWidth={2.4} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>FACILITIES</h3>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500 }}>
                Maintain hospitals/clinics and receiving-facility information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          PRODUCT BOUNDARY / TRUST SECTION
      ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: '70px 24px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1.5px solid var(--border)',
          borderRadius: 14,
          padding: '32px 36px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 20
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            color: 'var(--brand-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={22} strokeWidth={2.4} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Built for Coordination, Not Clinical Decisions.
            </h3>
            <p style={{ fontSize: 14.5, color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 500 }}>
              CareLink focuses on operational coordination and visibility. It does not diagnose patients, recommend treatment, or replace emergency services.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FINAL CTA SECTION
      ───────────────────────────────────────────────────────────── */}
      <section style={{
        background: '#FFFFFF',
        borderTop: '1px solid var(--border)',
        padding: '70px 24px 80px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-1px',
            lineHeight: 1.2,
            marginBottom: 16
          }}>
            Ready to coordinate care?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32, fontWeight: 500 }}>
            Bring the entire emergency coordination timeline into one operational view.
          </p>
          <button
            className="btn btn-primary btn-lg"
            style={{ fontSize: 16, padding: '14px 32px', gap: 10, boxShadow: '0 4px 16px rgba(168, 38, 32, 0.3)' }}
            onClick={() => navigate('/dashboard')}
          >
            Enter CareLink <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer style={{
        background: '#FFFFFF',
        borderTop: '1px solid var(--border)',
        padding: '36px 24px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--brand-red)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={13} strokeWidth={2.4} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>CARELINK</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-red)', marginBottom: 6 }}>
            Healthcare Coordination &amp; Emergency Management
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 640, margin: '0 auto' }}>
            Coordination platform for patients, appointments, emergency cases, ambulances, blood requirements and healthcare facilities.
          </p>
        </div>
      </footer>
    </div>
  );
}
