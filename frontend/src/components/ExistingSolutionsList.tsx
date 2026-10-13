import React from 'react'
import { ExternalLink, Compass, AlertCircle } from 'lucide-react'
import type { ExistingSolution } from '../types/api'

interface ExistingSolutionsListProps {
  solutions: ExistingSolution[]
  note?: string
  errors?: string[]
}

export const ExistingSolutionsList: React.FC<ExistingSolutionsListProps> = ({
  solutions,
  note,
  errors = [],
}) => {
  if ((!solutions || solutions.length === 0) && errors.length === 0 && !note) {
    return (
      <div
        style={{
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-light)',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--color-charcoal-muted)',
        }}
      >
        <Compass size={20} style={{ color: 'var(--color-taupe)', marginBottom: '0.25rem' }} />
        <div>No immediate commercial solutions cataloged yet for this exact problem.</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-subtle)', marginTop: '0.25rem' }}>
          This represents an opportunity for student builders to create something fresh!
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
      {/* Backend errors / notes if any */}
      {(note || errors.length > 0) && (
        <div className="alert alert-info" style={{ padding: '0.75rem 1rem', marginBottom: 0 }}>
          <AlertCircle size={16} />
          <div style={{ fontSize: '0.8125rem' }}>
            {note && <div>{note}</div>}
            {errors.map((err, i) => (
              <div key={i}>{err}</div>
            ))}
          </div>
        </div>
      )}

      {/* Solutions list */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '0.875rem',
        }}
      >
        {solutions.map((sol, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  marginBottom: '0.375rem',
                }}
              >
                <h4
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    color: 'var(--color-charcoal)',
                  }}
                >
                  {sol.name}
                </h4>
                {sol.link && (
                  <a
                    href={sol.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open external reference"
                    style={{
                      color: 'var(--color-violet)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.125rem',
                    }}
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-charcoal-muted)',
                  lineHeight: 1.45,
                }}
              >
                {sol.summary}
              </p>
            </div>

            {sol.link && (
              <div style={{ fontSize: '0.75rem' }}>
                <a
                  href={sol.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    color: 'var(--color-violet)',
                    fontWeight: 500,
                  }}
                >
                  Verify via Source
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
