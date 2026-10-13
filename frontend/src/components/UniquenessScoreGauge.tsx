import React from 'react'
import { BarChart2, Award } from 'lucide-react'
import type { ScoreBreakdown } from '../types/api'

interface UniquenessScoreGaugeProps {
  score: number
  breakdown: ScoreBreakdown
}

export const UniquenessScoreGauge: React.FC<UniquenessScoreGaugeProps> = ({
  score,
  breakdown,
}) => {
  // Qualitative classification based on score
  let ratingLabel = 'High Novelty'
  let ratingBadge = 'badge-success'
  let ratingSummary =
    'Few direct commercial or research matches found. Significant headroom for a unique solution.'

  if (score < 50) {
    ratingLabel = 'Crowded Space'
    ratingBadge = 'badge-error'
    ratingSummary =
      'High overlap with existing products or patents. Consider pivoting towards an underserved niche or novel constraint.'
  } else if (score < 75) {
    ratingLabel = 'Moderate Differentiation'
    ratingBadge = 'badge-warning'
    ratingSummary =
      'Similar concepts exist, but your specific feature combinations still have notable unique value.'
  }

  // Calculate circumference for radial display
  const radius = 54
  const stroke = 8
  const normalizedRadius = radius - stroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        {/* Radial Meter & Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ position: 'relative', width: 108, height: 108 }}>
            <svg height={108} width={108} style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                stroke="var(--color-taupe-light)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={54}
                cy={54}
              />
              {/* Progress circle */}
              <circle
                stroke="var(--color-violet)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s ease' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={54}
                cy={54}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--color-charcoal-strong)',
                  lineHeight: 1,
                }}
              >
                {score}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-charcoal-subtle)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginTop: '2px',
                }}
              >
                out of 100
              </span>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                Uniqueness Score
              </h3>
              <span className={`badge ${ratingBadge}`}>{ratingLabel}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-charcoal-muted)', maxWidth: '420px' }}>
              {ratingSummary}
            </p>
          </div>
        </div>

        {/* Status pill */}
        <div
          style={{
            padding: '0.625rem 1rem',
            backgroundColor: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            fontSize: '0.75rem',
            color: 'var(--color-charcoal-subtle)',
            maxWidth: '260px',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Award size={13} style={{ color: 'var(--color-violet)' }} />
            Algorithmic Scoring
          </div>
          Computed from closest match similarity, domain crowd density, and feature overlap.
        </div>
      </div>

      {/* Backend Deductions Breakdown */}
      <div>
        <h4
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-charcoal-subtle)',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
          }}
        >
          <BarChart2 size={13} />
          Exact Score Deductions (Backend Algorithm)
        </h4>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          {/* Closest Match Deduction */}
          <div
            style={{
              padding: '0.875rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-charcoal-muted)',
                marginBottom: '0.25rem',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Closest Match</span>
              <span style={{ fontWeight: 600, color: 'var(--semantic-error-text)' }}>
                -{breakdown.closest_match_deduction.toFixed(1)} pts
              </span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-charcoal-subtle)' }}>
              Max deduction: 50 pts (scaled by top match similarity)
            </div>
          </div>

          {/* Crowd Deduction */}
          <div
            style={{
              padding: '0.875rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-charcoal-muted)',
                marginBottom: '0.25rem',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Crowd Density</span>
              <span style={{ fontWeight: 600, color: 'var(--semantic-error-text)' }}>
                -{breakdown.crowd_deduction.toFixed(1)} pts
              </span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-charcoal-subtle)' }}>
              Max deduction: 25 pts (matches with &ge;70% similarity)
            </div>
          </div>

          {/* Feature Overlap Deduction */}
          <div
            style={{
              padding: '0.875rem',
              backgroundColor: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-charcoal-muted)',
                marginBottom: '0.25rem',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>Feature Overlap</span>
              <span style={{ fontWeight: 600, color: 'var(--semantic-error-text)' }}>
                -{breakdown.feature_overlap_deduction.toFixed(1)} pts
              </span>
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-charcoal-subtle)' }}>
              Max deduction: 25 pts (features detected in prior art)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
