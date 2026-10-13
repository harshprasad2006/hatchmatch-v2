import React, { useState } from 'react'
import {
  Hammer,
  Send,
  AlertCircle,
  Copy,
  Check,
  Tag,
  FileCheck,
} from 'lucide-react'
import { api, ApiError } from '../services/api'
import type { IdeaReport } from '../types/api'
import { UniquenessScoreGauge } from '../components/UniquenessScoreGauge'
import { FeatureComparisonTable } from '../components/FeatureComparisonTable'
import { MatchesList } from '../components/MatchesList'

interface BuilderCheckPageProps {
  initialIdeaText?: string
}

export const BuilderCheckPage: React.FC<BuilderCheckPageProps> = ({ initialIdeaText = '' }) => {
  const [projectTitle, setProjectTitle] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [coreProblem, setCoreProblem] = useState('')
  const [keyFeatures, setKeyFeatures] = useState('')
  const [solutionDetails, setSolutionDetails] = useState(initialIdeaText)
  
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<IdeaReport | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  // Construct structured pitch text to send to backend API
  const buildComposedText = () => {
    const parts: string[] = []
    if (projectTitle.trim()) parts.push(`Project Title: ${projectTitle.trim()}`)
    if (targetAudience.trim()) parts.push(`Target Users / Audience: ${targetAudience.trim()}`)
    if (coreProblem.trim()) parts.push(`Problem Solved: ${coreProblem.trim()}`)
    if (keyFeatures.trim()) parts.push(`Key Technical Features: ${keyFeatures.trim()}`)
    if (solutionDetails.trim()) parts.push(`Detailed Solution Pitch: ${solutionDetails.trim()}`)
    return parts.join('\n\n')
  }

  const composedText = buildComposedText()
  const charCount = composedText.length
  const isTooShort = charCount > 0 && charCount < 10
  const isTooLong = charCount > 5000

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    if (charCount < 10) {
      setError('Please provide at least 10 characters across your project fields.')
      return
    }

    setIsChecking(true)
    setError(null)

    try {
      const response = await api.checkIdea(composedText)
      setReport(response)

      // Save report summary into localStorage for User Dashboard
      try {
        const stored = JSON.parse(localStorage.getItem('hm_user_reports') || '[]')
        const newEntry = {
          id: response.id,
          title: response.idea_card?.title || projectTitle || 'Innovation Pitch',
          score: response.uniqueness_score,
          created_at: response.created_at || new Date().toISOString(),
          matches_count: response.matches?.length || 0,
          features_count: response.compare_table?.length || 0,
          idea_text: composedText,
        }
        const updated = [newEntry, ...stored.filter((r: any) => r.id !== response.id)]
        localStorage.setItem('hm_user_reports', JSON.stringify(updated))
      } catch {
        // Non-blocking storage
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setError(err.detail || 'This idea could not be processed safely.')
        } else if (err.status === 502) {
          setError(
            err.detail ||
              'Idea analysis could not be completed. Check server logs and API quota.'
          )
        } else if (err.status === 500) {
          setError(
            err.detail && err.detail !== 'Internal Server Error'
              ? err.detail
              : 'Backend error (500): Idea analysis failed. Please ensure GROQ_API_KEY is configured in the backend environment.'
          )
        } else if (err.status === 422) {
          setError(err.detail || 'Idea text validation error.')
        } else {
          setError(err.detail || `Server error (${err.status})`)
        }
      } else {
        setError(
          'Failed to connect to HatchMatch API. Ensure backend is running locally on port 8000.'
        )
      }
    } finally {
      setIsChecking(false)
    }
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-taupe-text)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
          }}
        >
          <Hammer size={14} />
          Student Innovation &amp; Novelty Check
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-charcoal-strong)' }}>
          I Am a Builder
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-charcoal-muted)', marginTop: '0.25rem' }}>
          Submit your project details. HatchMatch cross-references existing commercial products,
          OpenAlex academic papers, and Google Patents to compute an honest Uniqueness Score.
        </p>
      </div>

      {/* Input Pitch Card with Multiple Structured Fields */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          borderTop: '4px solid var(--color-taupe)',
        }}
      >
        <form onSubmit={handleCheck}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            {/* Field 1: Project Title */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span>Project / Solution Title</span>
                <span className="form-hint">e.g. Solar Audio Payment Box</span>
              </label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Name of your innovation..."
                className="form-input"
              />
            </div>

            {/* Field 2: Target Audience */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span>Target Users / Who is this for?</span>
                <span className="form-hint">e.g. Rural street vendors, bus commuters</span>
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Who will use or benefit from this?"
                className="form-input"
              />
            </div>
          </div>

          {/* Field 3: Problem Solved */}
          <div className="form-group">
            <label className="form-label">
              <span>Core Problem or Friction Addressed</span>
              <span className="form-hint">What specific frustration does this solve?</span>
            </label>
            <input
              type="text"
              value={coreProblem}
              onChange={(e) => setCoreProblem(e.target.value)}
              placeholder="e.g. Lack of 4G connectivity causing delayed payment notifications..."
              className="form-input"
            />
          </div>

          {/* Field 4: Key Features & Differentiators */}
          <div className="form-group">
            <label className="form-label">
              <span>Key Technical Features &amp; Differentiators</span>
              <span className="form-hint">List distinct mechanisms, hardware, or algorithms</span>
            </label>
            <textarea
              value={keyFeatures}
              onChange={(e) => setKeyFeatures(e.target.value)}
              placeholder="e.g. 1) Offline acoustic frequency verification, 2) Small solar harvesting panel, 3) Ultra-low-power microcontroller..."
              className="form-textarea"
              rows={3}
            />
          </div>

          {/* Field 5: Comprehensive Pitch Description */}
          <div className="form-group">
            <div className="form-label">
              <span>Detailed Solution Pitch &amp; Mechanism *</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: isTooShort || isTooLong ? 'var(--semantic-error-text)' : 'var(--color-charcoal-subtle)',
                  fontWeight: isTooShort || isTooLong ? 600 : 400,
                }}
              >
                {charCount} / 5,000 characters (min 10)
              </span>
            </div>
            <textarea
              value={solutionDetails}
              onChange={(e) => setSolutionDetails(e.target.value)}
              placeholder="Explain how the solution works end-to-end, what technologies it combines, and why existing solutions are insufficient..."
              className="form-textarea"
              rows={4}
              required
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Analysis Error</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <button
              type="submit"
              disabled={isChecking || charCount < 10 || isTooLong}
              className="btn btn-taupe"
              style={{ minWidth: '200px' }}
            >
              {isChecking ? (
                <>
                  <span className="spinner spinner-white" />
                  Analyzing Novelty...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Analyze Idea Uniqueness
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading Progress State */}
      {isChecking && (
        <div
          className="card"
          style={{
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            marginBottom: '2rem',
            backgroundColor: 'var(--bg-surface-subtle)',
          }}
        >
          <span className="spinner" style={{ width: 32, height: 32, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.125rem', color: 'var(--color-charcoal-strong)', marginBottom: '0.5rem' }}>
            Running Grounded Prior-Art Analysis
          </h3>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-charcoal-muted)',
              maxWidth: '520px',
              margin: '0 auto',
            }}
          >
            Extracting core features &bull; Querying commercial products &bull; Cross-referencing
            OpenAlex academic literature &bull; Searching Google Patents &bull; Computing mathematical uniqueness score
          </p>
        </div>
      )}

      {/* Generated Report Display */}
      {report && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Idea Card Header */}
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
                  Novelty Assessment Report
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-charcoal-strong)' }}>
                  {report.idea_card.title}
                </h2>
              </div>

              {/* Report ID & Copy */}
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
                  title="Copy full Report ID"
                >
                  {copiedId ? <Check size={12} style={{ color: 'var(--semantic-success-text)' }} /> : <Copy size={12} />}
                  {copiedId ? 'Copied' : 'Copy ID'}
                </button>
              </div>
            </div>

            {/* Original Idea Pitch */}
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

            {/* Extracted Core Features and Keywords */}
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
                  Extracted Core Features:
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
                  Search Keywords:
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

          {/* Uniqueness Score Gauge Component */}
          <UniquenessScoreGauge
            score={report.uniqueness_score}
            breakdown={report.score_breakdown}
          />

          {/* Feature Comparison Table Component */}
          <FeatureComparisonTable
            features={report.compare_table}
            matches={report.matches}
          />

          {/* Matches List Component */}
          <MatchesList matches={report.matches} />
        </div>
      )}
    </div>
  )
}
