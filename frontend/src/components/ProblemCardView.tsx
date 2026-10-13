import React, { useState } from 'react'
import {
  Tag,
  User,
  AlertTriangle,
  Clock,
  Wrench,
  Share2,
  CheckCircle2,
  Globe,
  Calendar,
  ThumbsUp,
  Hammer,
} from 'lucide-react'
import type { ProblemCard, ProblemResponse } from '../types/api'

interface ProblemCardViewProps {
  problem: ProblemResponse
  onShare?: (problemId: string) => void
  isSharing?: boolean
  showShareButton?: boolean
  onSolve?: (title: string, pain: string) => void
}

export const ProblemCardView: React.FC<ProblemCardViewProps> = ({
  problem,
  onShare,
  isSharing = false,
  showShareButton = true,
  onSolve,
}) => {
  const hasEnglishTranslation = Boolean(problem.card_en && problem.card_en.title)

  // Default to English if available as requested by user!
  const [viewLanguage, setViewLanguage] = useState<'original' | 'english'>(() => {
    return hasEnglishTranslation ? 'english' : 'original'
  })

  // Generate a deterministic initial community count based on problem id
  const getInitialCount = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash % 20) + 5
  }

  const [hasVotedMeToo, setHasVotedMeToo] = useState<boolean>(() => {
    return localStorage.getItem(`hm_metoo_voted_${problem.id}`) === 'true'
  })

  const [meTooCount, setMeTooCount] = useState<number>(() => {
    const saved = localStorage.getItem(`hm_metoo_count_${problem.id}`)
    if (saved) return parseInt(saved, 10)
    return getInitialCount(problem.id || 'id')
  })

  const handleToggleMeToo = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasVotedMeToo) {
      const next = Math.max(0, meTooCount - 1)
      setMeTooCount(next)
      setHasVotedMeToo(false)
      localStorage.setItem(`hm_metoo_voted_${problem.id}`, 'false')
      localStorage.setItem(`hm_metoo_count_${problem.id}`, next.toString())
    } else {
      const next = meTooCount + 1
      setMeTooCount(next)
      setHasVotedMeToo(true)
      localStorage.setItem(`hm_metoo_voted_${problem.id}`, 'true')
      localStorage.setItem(`hm_metoo_count_${problem.id}`, next.toString())
    }
  }

  const activeCard: ProblemCard =
    viewLanguage === 'english' && problem.card_en ? problem.card_en : (problem.card || {})

  const getCategoryColor = (cat?: string) => {
    const c = (cat || '').toLowerCase()
    if (c.includes('money') || c.includes('financ')) return 'badge-cobalt'
    if (c.includes('health')) return 'badge-success'
    if (c.includes('transport') || c.includes('travel')) return 'badge-taupe'
    if (c.includes('education') || c.includes('student')) return 'badge-cobalt'
    return 'badge-charcoal'
  }

  const formattedDate = problem.created_at
    ? new Date(problem.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null

  const isMentioned = (val?: string) => {
    if (!val) return false
    const lower = val.toLowerCase().trim()
    return lower !== 'not mentioned' && lower !== 'not yet assessed' && lower !== 'none'
  }

  return (
    <div
      className="card card-hover"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '0.875rem',
        padding: '1.25rem',
        height: '100%',
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--border-medium)',
      }}
    >
      <div>
        {/* Top Header: Category, Language Switcher, Date */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            <span className={`badge ${getCategoryColor(activeCard.category)}`} style={{ fontSize: '0.7rem' }}>
              <Tag size={10} />
              {activeCard.category || 'General'}
            </span>

            {problem.shared ? (
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }} title="Shared on the public board">
                <CheckCircle2 size={10} />
                Shared
              </span>
            ) : (
              <span className="badge badge-taupe" style={{ fontSize: '0.7rem' }}>
                Draft
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {hasEnglishTranslation && (
              <div
                style={{
                  display: 'inline-flex',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  padding: '2px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <button
                  onClick={() => setViewLanguage('english')}
                  style={{
                    border: 'none',
                    background: viewLanguage === 'english' ? 'var(--color-white)' : 'transparent',
                    color: viewLanguage === 'english' ? 'var(--color-cobalt)' : 'var(--color-charcoal-muted)',
                    fontSize: '0.6875rem',
                    fontWeight: viewLanguage === 'english' ? 700 : 500,
                    padding: '0.15rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    boxShadow: viewLanguage === 'english' ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  EN
                </button>
                <button
                  onClick={() => setViewLanguage('original')}
                  style={{
                    border: 'none',
                    background: viewLanguage === 'original' ? 'var(--color-white)' : 'transparent',
                    color: viewLanguage === 'original' ? 'var(--color-charcoal)' : 'var(--color-charcoal-muted)',
                    fontSize: '0.6875rem',
                    fontWeight: viewLanguage === 'original' ? 700 : 500,
                    padding: '0.15rem 0.4rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    boxShadow: viewLanguage === 'original' ? 'var(--shadow-sm)' : 'none',
                  }}
                  title="View original language"
                >
                  <Globe size={10} /> Orig
                </button>
              </div>
            )}

            {formattedDate && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-taupe-grey)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <Calendar size={10} />
                {formattedDate}
              </span>
            )}
          </div>
        </div>

        {/* Structured Title */}
        <h3
          style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'var(--color-charcoal)',
            margin: '0 0 0.625rem',
            lineHeight: 1.35,
          }}
        >
          {activeCard.title || 'Untitled Problem'}
        </h3>

        {/* Core Pain Point (Compact callout) */}
        <div
          style={{
            backgroundColor: 'var(--color-warm-taupe-surface)',
            borderLeft: '3px solid var(--color-cobalt)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.625rem 0.75rem',
            marginBottom: '0.625rem',
          }}
        >
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--color-cobalt)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              marginBottom: '0.2rem',
            }}
          >
            <AlertTriangle size={11} />
            Pain Point
          </div>
          <p
            style={{
              fontSize: '0.84375rem',
              color: 'var(--color-charcoal)',
              fontWeight: 500,
              lineHeight: 1.45,
              margin: 0,
            }}
          >
            {activeCard.pain || 'No description provided'}
          </p>
        </div>

        {/* Context metadata: Who & Workaround (Clean compact pills) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
          {activeCard.who && (
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.2rem 0.5rem',
                color: 'var(--color-charcoal-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <User size={11} style={{ color: 'var(--color-cobalt)' }} />
              <span><strong>Who:</strong> {activeCard.who}</span>
            </span>
          )}

          {isMentioned(activeCard.frequency) && (
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.2rem 0.5rem',
                color: 'var(--color-charcoal-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Clock size={11} style={{ color: 'var(--color-taupe-grey)' }} />
              <span>{activeCard.frequency}</span>
            </span>
          )}

          {isMentioned(activeCard.workaround) && (
            <span
              style={{
                fontSize: '0.75rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.2rem 0.5rem',
                color: 'var(--color-charcoal-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
              title={`Current Workaround: ${activeCard.workaround}`}
            >
              <Wrench size={11} style={{ color: 'var(--color-taupe-grey)' }} />
              <span>{activeCard.workaround.length > 28 ? activeCard.workaround.slice(0, 26) + '...' : activeCard.workaround}</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer: Me Too Engagement & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          paddingTop: '0.625rem',
          borderTop: '1px solid var(--border-light)',
          marginTop: '0.25rem',
        }}
      >
        {/* Me Too Button */}
        <button
          type="button"
          onClick={handleToggleMeToo}
          className="btn btn-sm"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            backgroundColor: hasVotedMeToo ? 'var(--color-cobalt-light)' : 'var(--bg-surface-subtle)',
            borderColor: hasVotedMeToo ? 'var(--color-cobalt)' : 'var(--border-medium)',
            color: hasVotedMeToo ? 'var(--color-cobalt)' : 'var(--color-charcoal)',
            fontWeight: hasVotedMeToo ? 700 : 500,
            padding: '0.25rem 0.625rem',
            fontSize: '0.75rem',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={hasVotedMeToo ? 'Click to remove your MeToo vote' : 'I face this problem too! Click to vote.'}
        >
          <ThumbsUp
            size={12}
            style={{
              color: hasVotedMeToo ? 'var(--color-cobalt)' : 'inherit',
              transform: hasVotedMeToo ? 'scale(1.1)' : 'scale(1)',
            }}
          />
          <span>Me Too!</span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              backgroundColor: hasVotedMeToo ? 'var(--color-cobalt)' : 'var(--color-taupe-grey)',
              color: 'var(--color-white)',
              padding: '0px 5px',
              borderRadius: '8px',
            }}
          >
            {meTooCount}
          </span>
        </button>

        {/* Action: Solve Problem or Share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onSolve && (
            <button
              onClick={() => onSolve(activeCard.title, activeCard.pain)}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-cobalt)',
                fontWeight: 600,
                padding: '0.25rem 0.5rem',
                gap: '0.25rem',
              }}
              title="Test a solution for this problem"
            >
              <Hammer size={12} />
              Solve
            </button>
          )}

          {showShareButton && !problem.shared && onShare && (
            <button
              onClick={() => onShare(problem.id)}
              disabled={isSharing}
              className="btn btn-cobalt btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              {isSharing ? (
                <span className="spinner spinner-white" />
              ) : (
                <>
                  <Share2 size={11} /> Share
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
