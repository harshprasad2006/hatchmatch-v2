import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Sparkles,
  Hammer,
  Share2,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  FileCheck,
  AlertCircle,
  Copy,
  Check,
  Tag,
  Trash2,
} from 'lucide-react'
import { api, ApiError } from '../services/api'
import type { IdeaReport } from '../types/api'
import { UniquenessScoreGauge } from '../components/UniquenessScoreGauge'
import { FeatureComparisonTable } from '../components/FeatureComparisonTable'
import { MatchesList } from '../components/MatchesList'

interface UserProblemRecord {
  id: string
  title: string
  pain: string
  category: string
  shared: boolean
  created_at: string
}

interface UserReportRecord {
  id: string
  title: string
  score: number
  created_at: string
  matches_count: number
  features_count: number
  idea_text?: string
}

interface DashboardPageProps {
  onNavigateToProblem: () => void
  onNavigateToBuilder: () => void
  onSolveProblem: (title: string, pain: string) => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToProblem,
  onNavigateToBuilder,
  onSolveProblem,
}) => {
  const [activeTab, setActiveTab] = useState<'problems' | 'reports'>('problems')
  const [userProblems, setUserProblems] = useState<UserProblemRecord[]>([])
  const [userReports, setUserReports] = useState<UserReportRecord[]>([])

  // Modal / Expanded report viewer
  const [selectedReport, setSelectedReport] = useState<IdeaReport | null>(null)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  // Direct UUID lookup field
  const [lookupId, setLookupId] = useState('')

  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem('hm_user_problems') || '[]')
      setUserProblems(p)
    } catch {
      setUserProblems([])
    }

    try {
      const r = JSON.parse(localStorage.getItem('hm_user_reports') || '[]')
      setUserReports(r)
    } catch {
      setUserReports([])
    }
  }, [])

  const handleViewReport = async (reportId: string) => {
    setIsLoadingReport(true)
    setReportError(null)
    try {
      const reportData = await api.getReport(reportId)
      setSelectedReport(reportData)
    } catch (err) {
      if (err instanceof ApiError) {
        setReportError(err.detail || `Could not load report (${err.status})`)
      } else {
        setReportError('Network error connecting to backend API.')
      }
    } finally {
      setIsLoadingReport(false)
    }
  }

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (lookupId.trim()) {
      handleViewReport(lookupId.trim())
    }
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleClearHistory = () => {
    if (window.confirm('Clear your local dashboard history?')) {
      localStorage.removeItem('hm_user_problems')
      localStorage.removeItem('hm_user_reports')
      setUserProblems([])
      setUserReports([])
    }
  }

  // Calculated Stats
  const totalProblems = userProblems.length
  const totalReports = userReports.length
  const sharedCount = userProblems.filter((p) => p.shared).length
  const avgScore =
    totalReports > 0
      ? Math.round(userReports.reduce((acc, r) => acc + (r.score || 0), 0) / totalReports)
      : null

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
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
            <LayoutDashboard size={14} />
            Live Activity &amp; Submissions
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-charcoal-strong)' }}>
            User Dashboard
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--color-charcoal-muted)', marginTop: '0.25rem' }}>
            Track the real problems you have posted, manage your idea novelty reports, and monitor builder engagement.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {(totalProblems > 0 || totalReports > 0) && (
            <button
              onClick={handleClearHistory}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--semantic-error-text)', gap: '0.375rem' }}
              title="Clear stored local records"
            >
              <Trash2 size={13} />
              Clear Local History
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {/* Metric 1 */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            borderLeft: '4px solid var(--color-violet)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-charcoal-subtle)' }}>
              Problems Submitted
            </span>
            <Sparkles size={16} style={{ color: 'var(--color-violet)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-charcoal-strong)' }}>
            {totalProblems}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-subtle)' }}>
            {sharedCount} shared with builders
          </div>
        </div>

        {/* Metric 2 */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            borderLeft: '4px solid var(--color-taupe)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-charcoal-subtle)' }}>
              Ideas Analyzed
            </span>
            <Hammer size={16} style={{ color: 'var(--color-taupe-text)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-charcoal-strong)' }}>
            {totalReports}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-subtle)' }}>
            Grounding novelty checks
          </div>
        </div>

        {/* Metric 3 */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            borderLeft: '4px solid var(--semantic-success-text)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-charcoal-subtle)' }}>
              Shared to Board
            </span>
            <Share2 size={16} style={{ color: 'var(--semantic-success-text)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-charcoal-strong)' }}>
            {sharedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-subtle)' }}>
            Live on Real Problems Board
          </div>
        </div>

        {/* Metric 4 */}
        <div
          className="card"
          style={{
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            borderLeft: '4px solid var(--color-charcoal)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-charcoal-subtle)' }}>
              Avg Uniqueness Score
            </span>
            <FileCheck size={16} style={{ color: 'var(--color-charcoal)' }} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-charcoal-strong)' }}>
            {avgScore !== null ? `${avgScore}%` : '—'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-subtle)' }}>
            Across evaluated pitches
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--border-light)',
          marginBottom: '1.5rem',
        }}
      >
        <button
          onClick={() => {
            setActiveTab('problems')
            setSelectedReport(null)
          }}
          className={`btn ${activeTab === 'problems' ? 'btn-primary' : 'btn-ghost'}`}
          style={{
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            borderBottom: 'none',
            fontSize: '0.875rem',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={14} />
          My Submitted Problems ({totalProblems})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-ghost'}`}
          style={{
            borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
            borderBottom: 'none',
            fontSize: '0.875rem',
            gap: '0.5rem',
          }}
        >
          <Hammer size={14} />
          My Idea Reports ({totalReports})
        </button>
      </div>

      {/* TAB 1: Problems List */}
      {activeTab === 'problems' && (
        <div>
          {userProblems.length === 0 ? (
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <Sparkles size={36} style={{ color: 'var(--color-violet)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-charcoal)', marginBottom: '0.5rem' }}>
                You haven't submitted any problems yet
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-charcoal-muted)',
                  maxWidth: '460px',
                  margin: '0 auto 1.5rem',
                }}
              >
                Describe an everyday pain point or frustration in Hindi, Marathi, or English to see it structured by AI and shared with student builders.
              </p>
              <button onClick={onNavigateToProblem} className="btn btn-primary">
                <Sparkles size={15} />
                Submit Your First Problem
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {userProblems.map((p) => (
                <div
                  key={p.id}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span className="badge badge-violet">{p.category}</span>
                        {p.shared ? (
                          <span className="badge badge-success">
                            <CheckCircle2 size={11} /> Shared with Builders
                          </span>
                        ) : (
                          <span className="badge badge-taupe">Draft</span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={11} /> {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-charcoal-strong)', margin: 0 }}>
                        {p.title}
                      </h4>
                    </div>

                    <button
                      onClick={() => onSolveProblem(p.title, p.pain)}
                      className="btn btn-secondary btn-sm"
                      style={{ gap: '0.375rem', fontSize: '0.75rem' }}
                    >
                      <Hammer size={12} />
                      Test Solution
                    </button>
                  </div>

                  {p.pain && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-charcoal-muted)', margin: 0 }}>
                      <strong>Pain:</strong> {p.pain}
                    </p>
                  )}

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-subtle)' }}>
                    ID: <code>{p.id}</code>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Idea Reports List */}
      {activeTab === 'reports' && !selectedReport && (
        <div>
          {/* Quick External UUID Lookup Box */}
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <form onSubmit={handleLookupSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <label htmlFor="uuid-lookup" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                Lookup any Report ID:
              </label>
              <input
                id="uuid-lookup"
                type="text"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="Paste Report UUID here..."
                className="form-input"
                style={{ flex: 1, minWidth: '220px', padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
              />
              <button
                type="submit"
                disabled={isLoadingReport || !lookupId.trim()}
                className="btn btn-primary btn-sm"
                style={{ gap: '0.375rem' }}
              >
                {isLoadingReport ? <span className="spinner spinner-white" /> : <Search size={13} />}
                Fetch Report
              </button>
            </form>
          </div>

          {reportError && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              <AlertCircle size={16} />
              <span>{reportError}</span>
            </div>
          )}

          {userReports.length === 0 ? (
            <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <Hammer size={36} style={{ color: 'var(--color-taupe-text)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-charcoal)', marginBottom: '0.5rem' }}>
                You haven't checked any ideas yet
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-charcoal-muted)',
                  maxWidth: '460px',
                  margin: '0 auto 1.5rem',
                }}
              >
                Evaluate your project pitch against existing market products, OpenAlex papers, and Google Patents to get an objective Uniqueness Score.
              </p>
              <button onClick={onNavigateToBuilder} className="btn btn-taupe">
                <Hammer size={15} />
                Analyze a Solution Idea
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {userReports.map((r) => (
                <div
                  key={r.id}
                  className="card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            r.score >= 70
                              ? 'var(--semantic-success-bg)'
                              : r.score >= 40
                              ? 'var(--color-taupe-light)'
                              : 'var(--semantic-warning-bg)',
                          color:
                            r.score >= 70
                              ? 'var(--semantic-success-text)'
                              : r.score >= 40
                              ? 'var(--color-taupe-text)'
                              : 'var(--semantic-warning-text)',
                          fontWeight: 700,
                        }}
                      >
                        Uniqueness: {r.score}%
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={11} /> {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-charcoal-strong)', margin: '0 0 0.25rem' }}>
                      {r.title}
                    </h4>

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-subtle)' }}>
                      ID: <code>{r.id.slice(0, 12)}...</code> &bull; {r.matches_count} prior matches found
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewReport(r.id)}
                    disabled={isLoadingReport}
                    className="btn btn-secondary btn-sm"
                    style={{ gap: '0.375rem' }}
                  >
                    <Eye size={13} />
                    View Novelty Report
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Full Selected Report View (when user clicks "View Novelty Report") */}
      {selectedReport && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedReport(null)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.375rem' }}
            >
              &larr; Back to My Reports List
            </button>

            <button
              onClick={() => handleCopyId(selectedReport.id)}
              className="btn btn-ghost btn-sm"
              style={{ gap: '0.375rem' }}
            >
              {copiedId ? <Check size={12} style={{ color: 'var(--semantic-success-text)' }} /> : <Copy size={12} />}
              {copiedId ? 'Copied ID' : 'Copy Report UUID'}
            </button>
          </div>

          {/* Report Header Card */}
          <div
            className="card"
            style={{
              padding: '1.75rem',
              borderTop: '4px solid var(--color-taupe)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-taupe" style={{ marginBottom: '0.5rem' }}>
                  <FileCheck size={12} /> Live Evaluated Report
                </span>
                <h2 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--color-charcoal-strong)', margin: 0 }}>
                  {selectedReport.idea_card.title}
                </h2>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-charcoal-subtle)' }}>
                ID: <code>{selectedReport.id}</code>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-charcoal-subtle)', marginBottom: '0.25rem' }}>
                Evaluated Pitch:
              </div>
              <p style={{ fontSize: '0.9375rem', color: 'var(--color-charcoal)', lineHeight: 1.55, margin: 0 }}>
                {selectedReport.idea_text}
              </p>
            </div>

            {/* Features & Keywords */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                border: '1px solid var(--border-light)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charcoal-subtle)', display: 'block', marginBottom: '0.375rem' }}>
                  Extracted Features:
                </span>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--color-charcoal)' }}>
                  {selectedReport.idea_card.main_features.map((feat, i) => (
                    <li key={i}>{feat}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-charcoal-subtle)', display: 'block', marginBottom: '0.375rem' }}>
                  Keywords:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {selectedReport.idea_card.keywords.map((kw, i) => (
                    <span key={i} className="badge badge-charcoal" style={{ fontSize: '0.75rem' }}>
                      <Tag size={10} /> {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Uniqueness Score Gauge */}
          <UniquenessScoreGauge
            score={selectedReport.uniqueness_score}
            breakdown={selectedReport.score_breakdown}
          />

          {/* Feature Comparison Table */}
          <FeatureComparisonTable
            features={selectedReport.compare_table}
            matches={selectedReport.matches}
          />

          {/* Prior Art Matches */}
          <MatchesList matches={selectedReport.matches} />
        </div>
      )}
    </div>
  )
}
