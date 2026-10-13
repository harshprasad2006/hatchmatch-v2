import React from 'react'
import {
  Sparkles,
  Hammer,
  ArrowRight,
  Plus,
  Compass,
  Lightbulb,
} from 'lucide-react'
import type { NavTab } from '../components/Navbar'

interface HomePageProps {
  onNavigate: (tab: NavTab) => void
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      {/* Minimalistic, Open, Structured, Humanized Hero Section */}
      <section
        style={{
          padding: '3rem 0 1.5rem',
          maxWidth: '840px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.625rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-cobalt-light)',
            border: '1px solid var(--color-cobalt-border)',
            color: 'var(--color-cobalt)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
          }}
        >
          <img src="/logo.png" alt="Logo" style={{ height: '16px', width: 'auto' }} />
          <span>Real Community Friction &times; Student Innovation</span>
        </div>

        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            color: 'var(--color-charcoal)',
            lineHeight: 1.15,
            letterSpacing: '-0.035em',
            marginBottom: '1.25rem',
          }}
        >
          Stop guessing what to build.{' '}
          <span style={{ color: 'var(--color-cobalt)' }}>
            Discover real problems worth solving.
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--color-charcoal-muted)',
            lineHeight: 1.65,
            marginBottom: '2rem',
            maxWidth: '680px',
          }}
        >
          HatchMatch bridges daily, real-world friction experienced by citizens and workers with student builders.
          Describe genuine challenges in Hindi, Marathi, or English, or verify your project idea against existing products,
          papers, and patents before writing a line of code.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => onNavigate('board')}
            className="btn btn-cobalt btn-lg"
            style={{ gap: '0.625rem' }}
          >
            <Compass size={18} />
            Explore Problems Board
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => onNavigate('problem')}
            className="btn btn-secondary btn-lg"
            style={{ gap: '0.5rem' }}
          >
            <Plus size={16} style={{ color: 'var(--color-cobalt)' }} />
            Submit a Problem
          </button>

          <button
            onClick={() => onNavigate('builder')}
            className="btn btn-secondary btn-lg"
            style={{ gap: '0.5rem' }}
          >
            <Lightbulb size={16} style={{ color: 'var(--color-apricot)' }} />
            Check Idea Uniqueness
          </button>
        </div>
      </section>

      {/* Pathways Section: Two clear choices */}
      <section id="pathways-section">
        <div style={{ marginBottom: '1.75rem' }}>
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-cobalt)',
              marginBottom: '0.25rem',
            }}
          >
            Choose Your Journey
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Start by Submitting or Building
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-charcoal-muted)' }}>
            Whether you face a daily challenge or want to verify an engineering project, choose your pathway below.
          </p>
        </div>

        <div className="grid-2">
          {/* Pathway 1: I Have a Problem */}
          <div
            className="card card-hover"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderTop: '4px solid var(--color-cobalt)',
              padding: '2rem',
            }}
            onClick={() => onNavigate('problem')}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-cobalt-light)',
                  color: 'var(--color-cobalt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Sparkles size={24} />
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-cobalt)',
                  marginBottom: '0.25rem',
                }}
              >
                For Everyday Citizens &amp; Workers
              </div>

              <h3
                style={{
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  color: 'var(--color-charcoal)',
                  marginBottom: '0.75rem',
                }}
              >
                I Have a Problem
              </h3>

              <p
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--color-charcoal-muted)',
                  lineHeight: 1.55,
                  marginBottom: '1.5rem',
                }}
              >
                Share an annoying problem in everyday life or work. Write freely in your native language (Hindi, Marathi, English).
                Get a clean structured problem specification and see if solutions already exist.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}>
                <span className="badge badge-cobalt">Hindi, Marathi &amp; English</span>
                <span className="badge badge-taupe">Auto AI Structuring</span>
                <span className="badge badge-taupe">Share with Builders</span>
              </div>
            </div>

            <button className="btn btn-cobalt" style={{ width: '100%', gap: '0.5rem' }}>
              Submit a Problem <ArrowRight size={15} />
            </button>
          </div>

          {/* Pathway 2: I Am a Builder */}
          <div
            className="card card-hover"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              borderTop: '4px solid var(--color-apricot)',
              padding: '2rem',
            }}
            onClick={() => onNavigate('builder')}
          >
            <div>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-apricot-light)',
                  color: 'var(--color-apricot)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Hammer size={24} />
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-apricot)',
                  marginBottom: '0.25rem',
                }}
              >
                For Students &amp; Hackathon Teams
              </div>

              <h3
                style={{
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  color: 'var(--color-charcoal)',
                  marginBottom: '0.75rem',
                }}
              >
                I Am a Builder
              </h3>

              <p
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--color-charcoal-muted)',
                  lineHeight: 1.55,
                  marginBottom: '1.5rem',
                }}
              >
                Pitch your project idea to test its novelty before you start coding. Cross-reference
                live products, academic papers, and patents to compute an objective Uniqueness Score.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.75rem' }}>
                <span className="badge badge-coral">Uniqueness Score (0-100)</span>
                <span className="badge badge-taupe">Prior Art Comparison</span>
                <span className="badge badge-taupe">Google Patents &amp; OpenAlex</span>
              </div>
            </div>

            <button className="btn btn-coral" style={{ width: '100%', gap: '0.5rem' }}>
              Check Idea Uniqueness <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* How HatchMatch Works */}
      <section>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 2.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: '0.5rem' }}>
            How HatchMatch Works
          </h2>
          <p style={{ fontSize: '0.9375rem', color: 'var(--color-charcoal-muted)' }}>
            A transparent platform that turns grassroots Indian friction into verified student innovation.
          </p>
        </div>

        <div className="grid-3">
          {/* Step 1 */}
          <div
            className="card card-hover"
            style={{
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-cobalt-light)',
                color: 'var(--color-cobalt)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.125rem',
              }}
            >
              1
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
              Grassroots Capture
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.55 }}>
              Anyone can describe everyday friction in their own words—Hindi, Marathi, Hinglish, or English.
              Messy voice-to-text or casual typing welcome.
            </p>
          </div>

          {/* Step 2 */}
          <div
            className="card card-hover"
            style={{
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-warm-taupe-light)',
                color: 'var(--color-taupe-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.125rem',
              }}
            >
              2
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
              Structure &amp; Discovery
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.55 }}>
              Raw complaints are analyzed into who is affected, core pain points, frequency, and current
              workarounds, while looking up market solutions.
            </p>
          </div>

          {/* Step 3 */}
          <div
            className="card card-hover"
            style={{
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-apricot-light)',
                color: 'var(--color-apricot)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.125rem',
              }}
            >
              3
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
              Novelty &amp; Impact Check
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.55 }}>
              Student builders evaluate their solution pitches against products, OpenAlex research papers,
              and patents with an objective Uniqueness Score.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
