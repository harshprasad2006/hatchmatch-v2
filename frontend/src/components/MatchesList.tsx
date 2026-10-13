import React, { useState } from 'react'
import {
  ExternalLink,
  BookOpen,
  ShoppingBag,
  FileText,
  Search,
  Filter,
} from 'lucide-react'
import type { Match } from '../types/api'

interface MatchesListProps {
  matches: Match[]
}

export const MatchesList: React.FC<MatchesListProps> = ({ matches }) => {
  const [filterType, setFilterType] = useState<string>('all')

  if (!matches || matches.length === 0) {
    return (
      <div
        style={{
          padding: '2rem',
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          color: 'var(--color-charcoal-muted)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <Search size={28} style={{ color: 'var(--color-taupe)', marginBottom: '0.5rem' }} />
        <h4 style={{ color: 'var(--color-charcoal)', marginBottom: '0.25rem' }}>
          No Prior Art Matches Recorded
        </h4>
        <p style={{ fontSize: '0.875rem' }}>
          The backend search retrieved no directly conflicting products, research papers, or patents.
        </p>
      </div>
    )
  }

  const filtered =
    filterType === 'all'
      ? matches
      : matches.filter((m) => m.type.toLowerCase().includes(filterType.toLowerCase()))

  const getIconForType = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('product')) return <ShoppingBag size={14} />
    if (t.includes('paper') || t.includes('research')) return <BookOpen size={14} />
    if (t.includes('patent')) return <FileText size={14} />
    return <Search size={14} />
  }

  const getTypeBadgeClass = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('product')) return 'badge-violet'
    if (t.includes('paper') || t.includes('research')) return 'badge-taupe'
    if (t.includes('patent')) return 'badge-charcoal'
    return 'badge-taupe'
  }

  // Parse text into similarities and differences
  const parseMatchText = (text: string) => {
    if (!text) return { similarities: '', differences: '' }
    const simMatch = text.match(/Similarities:\s*([\s\S]*?)(?=Differences:|$)/i)
    const diffMatch = text.match(/Differences:\s*([\s\S]*?)$/i)

    return {
      similarities: simMatch ? simMatch[1].trim() : text,
      differences: diffMatch ? diffMatch[1].trim() : '',
    }
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
      {/* Header and Filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        <div>
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
            <Filter size={18} style={{ color: 'var(--color-violet)' }} />
            Discovered Prior Art ({matches.length})
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-charcoal-muted)' }}>
            Existing commercial products, OpenAlex academic papers, and Google Patents.
          </p>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${matches.length})` },
            { id: 'product', label: 'Products' },
            { id: 'paper', label: 'Papers' },
            { id: 'patent', label: 'Patents' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`btn btn-sm ${filterType === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              textAlign: 'center',
              color: 'var(--color-charcoal-subtle)',
              fontSize: '0.875rem',
            }}
          >
            No matches found in the <strong>{filterType}</strong> category.
          </div>
        ) : (
          filtered.map((match, idx) => {
            const { similarities, differences } = parseMatchText(match.text)
            const similarityColor =
              match.similarity >= 70
                ? 'var(--semantic-error-text)'
                : match.similarity >= 40
                ? 'var(--semantic-warning-text)'
                : 'var(--semantic-success-text)'

            const similarityBg =
              match.similarity >= 70
                ? 'var(--semantic-error-bg)'
                : match.similarity >= 40
                ? 'var(--semantic-warning-bg)'
                : 'var(--semantic-success-bg)'

            return (
              <div
                key={idx}
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.125rem',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Match title, type badge, similarity pill */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className={`badge ${getTypeBadgeClass(match.type)}`}>
                        {getIconForType(match.type)}
                        {match.type.replace('_', ' ').toUpperCase()}
                      </span>

                      {match.link && (
                        <a
                          href={match.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            color: 'var(--color-violet)',
                            fontWeight: 500,
                          }}
                        >
                          Source Link <ExternalLink size={11} />
                        </a>
                      )}
                    </div>

                    <h4
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--color-charcoal-strong)',
                        marginTop: '0.25rem',
                      }}
                    >
                      {match.title}
                    </h4>
                  </div>

                  {/* Similarity gauge pill */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '0.125rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.625rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: similarityBg,
                        color: similarityColor,
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      {match.similarity}% Similarity
                    </span>
                  </div>
                </div>

                {/* Similarities & Differences */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: differences ? 'repeat(auto-fit, minmax(240px, 1fr))' : '1fr',
                    gap: '0.75rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  {similarities && (
                    <div
                      style={{
                        backgroundColor: 'var(--color-white)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.625rem 0.875rem',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: 'var(--semantic-error-text)',
                          display: 'block',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Overlap / Similarities:
                      </span>
                      <p style={{ margin: 0, color: 'var(--color-charcoal-muted)' }}>{similarities}</p>
                    </div>
                  )}

                  {differences && (
                    <div
                      style={{
                        backgroundColor: 'var(--color-white)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.625rem 0.875rem',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: 'var(--semantic-success-text)',
                          display: 'block',
                          marginBottom: '0.25rem',
                        }}
                      >
                        Your Differentiation:
                      </span>
                      <p style={{ margin: 0, color: 'var(--color-charcoal-muted)' }}>{differences}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
