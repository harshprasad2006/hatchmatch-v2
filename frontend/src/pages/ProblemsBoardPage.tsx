import React, { useState, useEffect, useMemo } from 'react'
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Clock,
} from 'lucide-react'
import { api, ApiError } from '../services/api'
import type { ProblemResponse } from '../types/api'
import { ProblemCardView } from '../components/ProblemCardView'

type DurationFilter = 'all' | 'week' | 'month' | 'year'

interface ProblemsBoardPageProps {
  onNavigateToSubmit: () => void
  onSolveProblem: (problemTitle: string, problemPain: string) => void
}

export const ProblemsBoardPage: React.FC<ProblemsBoardPageProps> = ({
  onNavigateToSubmit,
  onSolveProblem,
}) => {
  const [problems, setProblems] = useState<ProblemResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all')

  const fetchProblems = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.listSharedProblems()
      const raw = res.problems || []
      // Sort in reverse chronological order: newly submitted problems appear at the TOP
      const sorted = [...raw].sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime()
        const timeB = new Date(b.created_at || 0).getTime()
        return timeB - timeA
      })
      setProblems(sorted)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Unable to retrieve shared problems from backend: ${err.detail}`)
      } else {
        setError('Network error connecting to HatchMatch API. Please ensure the backend is running.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProblems()
  }, [])

  // Dynamically extract real categories from existing database problems
  const categories = useMemo(() => {
    const set = new Set<string>()
    problems.forEach((p) => {
      if (p.card?.category && p.card.category.trim()) {
        set.add(p.card.category.trim())
      }
    })
    return ['All', ...Array.from(set).sort()]
  }, [problems])

  // Filter problems by search query, category, and duration
  const filteredProblems = problems.filter((item) => {
    const card = item.card || {}
    const matchesCategory =
      selectedCategory === 'All' ||
      (card.category && card.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim())

    if (!matchesCategory) return false

    // Duration filter
    if (durationFilter !== 'all' && item.created_at) {
      const itemTime = new Date(item.created_at).getTime()
      const now = Date.now()
      const diffMs = now - itemTime
      if (durationFilter === 'week' && diffMs > 7 * 24 * 60 * 60 * 1000) {
        return false
      }
      if (durationFilter === 'month' && diffMs > 30 * 24 * 60 * 60 * 1000) {
        return false
      }
      if (durationFilter === 'year' && diffMs > 365 * 24 * 60 * 60 * 1000) {
        return false
      }
    }

    const query = searchQuery.toLowerCase().trim()
    if (!query) return true

    const matchesQuery = Boolean(
      card.title?.toLowerCase().includes(query) ||
      card.pain?.toLowerCase().includes(query) ||
      card.who?.toLowerCase().includes(query) ||
      card.category?.toLowerCase().includes(query) ||
      item.card_en?.title?.toLowerCase().includes(query) ||
      item.card_en?.pain?.toLowerCase().includes(query)
    )

    return matchesQuery
  })

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-violet)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem',
            }}
          >
            <Activity size={14} />
            Live Backend Problems Feed
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-charcoal-strong)' }}>
            Real Problems Board
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-charcoal-muted)', marginTop: '0.25rem' }}>
            Verified pain points shared by real citizens. Live data fetched from{' '}
            <code>GET /api/v1/problems</code>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={fetchProblems}
            disabled={isLoading}
            className="btn btn-secondary"
            title="Refresh problems from backend"
          >
            <RefreshCw size={14} className={isLoading ? 'spinner' : ''} />
            Refresh
          </button>
          <button onClick={onNavigateToSubmit} className="btn btn-primary">
            <Sparkles size={14} />
            Submit Problem
          </button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-charcoal-subtle)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems by keyword, title, who, or pain point..."
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-charcoal-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Filter size={12} /> Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`btn btn-sm ${
                  selectedCategory === cat ? 'btn-primary' : 'btn-ghost'
                }`}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.625rem',
                  borderRadius: 'var(--radius-full)',
                  border: selectedCategory === cat ? 'none' : '1px solid var(--border-medium)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Backend Communication Error</strong>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
            color: 'var(--color-charcoal-muted)',
          }}
        >
          <span className="spinner" style={{ width: 28, height: 28, marginBottom: '1rem' }} />
          <div style={{ fontWeight: 500 }}>Connecting to HatchMatch database...</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-charcoal-subtle)', marginTop: '0.25rem' }}>
            Querying shared problem documents from Firestore
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredProblems.length === 0 && (
        <div className="empty-state">
          <Activity className="empty-state-icon" />
          <h3 className="empty-state-title">
            {problems.length === 0
              ? 'No Shared Problems in Database Yet'
              : 'No Problems Matching Your Filter'}
          </h3>
          <p className="empty-state-desc">
            {problems.length === 0
              ? 'The backend Firestore collection currently contains no problems with "shared: true". Submit a problem and click "Share with Builders" to display it on this board.'
              : 'Try clearing your search query or choosing another category filter.'}
          </p>
          {problems.length === 0 ? (
            <button onClick={onNavigateToSubmit} className="btn btn-primary">
              <Sparkles size={14} /> Submit the First Problem
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
              }}
              className="btn btn-secondary"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Problems Feed */}
      {!isLoading && filteredProblems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              fontSize: '0.8125rem',
              color: 'var(--color-charcoal-subtle)',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <span>
              Showing <strong>{filteredProblems.length}</strong> problem
              {filteredProblems.length === 1 ? '' : 's'}
            </span>

            {/* YouTube-style Duration Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={13} style={{ color: 'var(--color-violet)' }} />
              <label htmlFor="duration-select" style={{ fontSize: '0.8125rem', color: 'var(--color-charcoal-subtle)', fontWeight: 500 }}>
                Uploaded:
              </label>
              <select
                id="duration-select"
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value as DurationFilter)}
                className="form-select"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-white)',
                  borderColor: 'var(--border-medium)',
                  color: 'var(--color-charcoal)',
                  height: 'auto',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All time</option>
                <option value="week">Past week</option>
                <option value="month">Past month</option>
                <option value="year">Past year</option>
              </select>
            </div>
          </div>

          {/* 2-Column Responsive Grid (Min 2 cards per row on desktop) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '1rem',
              alignItems: 'stretch',
            }}
          >
            {filteredProblems.map((problem) => (
              <ProblemCardView
                key={problem.id}
                problem={problem}
                showShareButton={false}
                onSolve={onSolveProblem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
