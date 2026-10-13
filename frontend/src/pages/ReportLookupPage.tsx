import React, { useState } from 'react'
import {
  FileSearch,
  Search,
  AlertCircle,
  FileCheck,
  Tag,
  Copy,
  Check,
} from 'lucide-react'
import { api, ApiError } from '../services/api'
import type { IdeaReport } from '../types/api'
import { UniquenessScoreGauge } from '../components/UniquenessScoreGauge'
import { FeatureComparisonTable } from '../components/FeatureComparisonTable'
import { MatchesList } from '../components/MatchesList'

export const ReportLookupPage: React.FC = () => {
  const [reportId, setReportId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<IdeaReport | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = reportId.trim()
    if (!id) {
      setError('Please enter a valid Report ID.')
      return
    }

    setIsLoading(true)
    setError(null)
    setReport(null)

    try {
      const res = await api.getReport(id)
      setReport(res)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError(`Report "${id}" was not found in the backend database.`)
        } else {
          setError(err.detail || `Server error (${err.status})`)
        }
      } else {
        setError('Network error connecting to backend API.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
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
          <FileSearch size={14} />
          Firestore Persistence Query
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-charcoal-strong)' }}>
          Report Lookup
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-charcoal-muted)', marginTop: '0.25rem' }}>
          Retrieve a previously generated novelty assessment using its unique ID from{' '}
          <code>GET /api/v1/reports/{'{report_id}'}</code>.
        </p>
      </div>

      {/* Search Bar Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleLookup}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="report-id-input">
              <span>Report UUID / ID</span>
              <span className="form-hint">e.g., 3fa85f64-5717-4562-b3fc-2c963f66afa6</span>
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                id="report-id-input"
                type="text"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                placeholder="Paste Report ID here..."
                className="form-input"
                style={{ flex: 1, minWidth: '260px' }}
                required
              />
              <button
                type="submit"
                disabled={isLoading || !reportId.trim()}
                className="btn btn-primary"
                style={{ minWidth: '140px' }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner spinner-white" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Search size={15} />
                    Find Report
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 0 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Rendered Retrieved Report */}
      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header Card */}
          <div
            style={{
              backgroundColor: 'var(--color-white)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-light)',
              }}
            >
              <div>
                <span className="badge badge-taupe" style={{ marginBottom: '0.5rem' }}>
                  <FileCheck size={12} />
                  Retrieved from Firestore
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-charcoal-strong)' }}>
                  {report.idea_card.title}
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-charcoal-subtle)',
                    backgroundColor: 'var(--bg-surface-subtle)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  ID: <code>{report.id.slice(0, 12)}...</code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyId(report.id)}
                  className="btn btn-secondary btn-sm"
                >
                  {copiedId ? <Check size={12} style={{ color: 'var(--semantic-success-text)' }} /> : <Copy size={12} />}
                  {copiedId ? 'Copied' : 'Copy ID'}
                </button>
              </div>
            </div>

            {/* Evaluated Pitch */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-charcoal-subtle)',
                  marginBottom: '0.25rem',
                }}
              >
                Evaluated Pitch
              </div>
              <p
                style={{
                  fontSize: '0.9375rem',
                  color: 'var(--color-charcoal)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {report.idea_text}
              </p>
            </div>

            {/* Extracted Core Features & Keywords */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                border: '1px solid var(--border-light)',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-charcoal-subtle)',
                    display: 'block',
                    marginBottom: '0.375rem',
                  }}
                >
                  Core Features:
                </span>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    fontSize: '0.8125rem',
                    color: 'var(--color-charcoal)',
                  }}
                >
                  {report.idea_card.main_features.map((feat, i) => (
                    <li key={i}>{feat}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-charcoal-subtle)',
                    display: 'block',
                    marginBottom: '0.375rem',
                  }}
                >
                  Keywords:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {report.idea_card.keywords.map((kw, i) => (
                    <span key={i} className="badge badge-charcoal" style={{ fontSize: '0.75rem' }}>
                      <Tag size={10} /> {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <UniquenessScoreGauge
            score={report.uniqueness_score}
            breakdown={report.score_breakdown}
          />

          <FeatureComparisonTable
            features={report.compare_table}
            matches={report.matches}
          />

          <MatchesList matches={report.matches} />
        </div>
      )}
    </div>
  )
}
