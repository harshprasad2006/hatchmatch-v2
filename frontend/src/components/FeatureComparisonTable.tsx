import React from 'react'
import { Check, X, Layers } from 'lucide-react'
import type { FeatureComparison, Match } from '../types/api'

interface FeatureComparisonTableProps {
  features: FeatureComparison[]
  matches: Match[]
}

export const FeatureComparisonTable: React.FC<FeatureComparisonTableProps> = ({
  features,
  matches,
}) => {
  if (!features || features.length === 0) {
    return (
      <div
        style={{
          padding: '1.25rem',
          backgroundColor: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--color-charcoal-muted)',
        }}
      >
        No feature comparisons available for this report.
      </div>
    )
  }

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
      <div style={{ marginBottom: '1rem' }}>
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'var(--color-charcoal-strong)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Layers size={18} style={{ color: 'var(--color-violet)' }} />
          Feature Overlap Breakdown
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-charcoal-muted)', marginTop: '0.25rem' }}>
          Evaluates each core feature of your idea against discovered products, papers, and patents.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '2px solid var(--border-light)',
                backgroundColor: 'var(--bg-surface-subtle)',
              }}
            >
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                Idea Feature
              </th>
              <th
                style={{
                  padding: '0.75rem 1rem',
                  fontWeight: 600,
                  color: 'var(--color-charcoal)',
                  width: '140px',
                }}
              >
                Prior Art Found?
              </th>
              <th style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                Matching Sources
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((item, index) => {
              const matchedSources = item.found_in
                .map((matchIdx) => matches[matchIdx])
                .filter(Boolean)

              return (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    backgroundColor: index % 2 === 0 ? 'var(--color-white)' : 'var(--bg-surface-subtle)',
                  }}
                >
                  <td
                    style={{
                      padding: '0.875rem 1rem',
                      fontWeight: 500,
                      color: 'var(--color-charcoal-strong)',
                    }}
                  >
                    {item.feature}
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    {item.found ? (
                      <span className="badge badge-error" style={{ fontSize: '0.75rem' }}>
                        <Check size={11} /> Overlap Found
                      </span>
                    ) : (
                      <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                        <X size={11} /> Unique Feature
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--color-charcoal-muted)' }}>
                    {item.found && matchedSources.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {matchedSources.map((source, sIdx) => (
                          <div
                            key={sIdx}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              fontSize: '0.8125rem',
                            }}
                          >
                            <span
                              className="badge badge-taupe"
                              style={{ fontSize: '0.6875rem', padding: '0.1rem 0.35rem' }}
                            >
                              {source.type}
                            </span>
                            <span style={{ color: 'var(--color-charcoal)' }}>{source.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--semantic-success-text)' }}>
                        No direct match found in tested databases
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
