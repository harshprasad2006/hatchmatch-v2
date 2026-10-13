import React, { useState } from 'react'
import {
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react'
import { api, ApiError } from '../services/api'
import type { ProblemResponse } from '../types/api'
import { ProblemCardView } from '../components/ProblemCardView'
import { ExistingSolutionsList } from '../components/ExistingSolutionsList'

interface ProblemSubmitPageProps {
  onNavigateToBoard: () => void
}

export const ProblemSubmitPage: React.FC<ProblemSubmitPageProps> = ({ onNavigateToBoard }) => {
  const [rawText, setRawText] = useState('')
  const [language, setLanguage] = useState('auto')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProblemResponse | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState<string | null>(null)
  const [autoShare, setAutoShare] = useState(true)

  // Real-world sample prompts in different languages
  const examplePrompts = [
    {
      lang: 'Hinglish / Hindi',
      text: 'Dukaan pe customer QR scan karke payment karta hai par mere phone pe 10 minute tak SMS ya notification nahi aata, customer chala jata hai aur bohot confusion hota hai.',
    },
    {
      lang: 'Marathi',
      text: 'गावातील एसटी बसची वेळ कधीच समजत नाही, बस स्टँडवर तास न तास थांबावे लागते आणि खाजगी गाड्या अवाजवी जास्त पैसे घेतात.',
    },
    {
      lang: 'English',
      text: 'Small vegetable vendors cannot afford commercial cold storage, causing produce to spoil within 36 hours during extreme summer heat.',
    },
    {
      lang: 'Hindi',
      text: 'सरकारी अस्पताल में दवाई की पर्ची लेकर खिड़की पर 3 घंटे लाइन लगानी पड़ती है और फिर पता चलता है कि स्टॉक खत्म हो गया है।',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rawText.trim().length < 10) {
      setError('Please provide at least 10 characters describing the problem.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setShareSuccess(null)

    try {
      let response = await api.submitProblem(rawText, language)
      if (autoShare && response.id) {
        try {
          const shareRes = await api.shareProblem(response.id)
          if (shareRes.shared) {
            response = { ...response, shared: true }
            setShareSuccess('Problem structured and automatically shared with builders on the Real Problems Board!')
          }
        } catch {
          // If auto-share fails, user still has the problem and can manually share
        }
      }

      // Save to localStorage for User Dashboard
      try {
        const stored = JSON.parse(localStorage.getItem('hm_user_problems') || '[]')
        const newEntry = {
          id: response.id,
          title: response.card?.title || 'Submitted Problem',
          pain: response.card?.pain || '',
          category: response.card?.category || 'General',
          shared: response.shared,
          created_at: response.created_at || new Date().toISOString(),
        }
        const updated = [newEntry, ...stored.filter((p: any) => p.id !== response.id)]
        localStorage.setItem('hm_user_problems', JSON.stringify(updated))
      } catch {
        // Non-blocking
      }

      setResult(response)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setError(err.detail || 'This content could not be processed safely.')
        } else if (err.status === 422) {
          setError(
            err.detail ||
              'Please describe a real problem you face (greetings, trivia, or general chatter cannot be structured).'
          )
        } else if (err.status === 500) {
          setError(
            err.detail && err.detail !== 'Internal Server Error'
              ? err.detail
              : 'Backend error (500): AI processing could not be completed. Please ensure GROQ_API_KEY is configured in the backend environment.'
          )
        } else {
          setError(err.detail || `Server error (${err.status})`)
        }
      } else {
        setError(
          'Failed to connect to HatchMatch API. Ensure backend is running locally on port 8000.'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = async (problemId: string) => {
    setIsSharing(true)
    setError(null)
    try {
      const shareRes = await api.shareProblem(problemId)
      if (shareRes.shared) {
        setShareSuccess(shareRes.message || 'Problem shared successfully with builders!')
        if (result) {
          setResult({ ...result, shared: true })
        }
        try {
          const stored = JSON.parse(localStorage.getItem('hm_user_problems') || '[]')
          const updated = stored.map((p: any) => p.id === problemId ? { ...p, shared: true } : p)
          localStorage.setItem('hm_user_problems', JSON.stringify(updated))
        } catch {
          // Non-blocking
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Failed to share: ${err.detail}`)
      } else {
        setError('Network error while sharing problem.')
      }
    } finally {
      setIsSharing(false)
    }
  }

  const handleApplyExample = (text: string) => {
    setRawText(text)
    setError(null)
  }

  const charCount = rawText.length
  const isTooShort = charCount > 0 && charCount < 10
  const isTooLong = charCount > 5000

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Page Title */}
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
          <Sparkles size={14} />
          Grassroots Problem Capture
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-charcoal-strong)' }}>
          I Have a Problem
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-charcoal-muted)', marginTop: '0.25rem' }}>
          Describe a daily frustration, broken process, or workplace hassle in your own natural words.
          You can write in Hindi, Marathi, English, or Hinglish.
        </p>
      </div>

      {/* Input Form */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          borderTop: '4px solid var(--color-violet)',
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Language Selection */}
          <div className="form-group">
            <div className="form-label">
              <span>Input Language</span>
              <span className="form-hint">HatchMatch AI auto-detects English, Hindi &amp; Marathi</span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="form-select"
              style={{ maxWidth: '240px' }}
            >
              <option value="auto">Auto-detect language</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिंदी / Hinglish)</option>
              <option value="Marathi">Marathi (मराठी)</option>
            </select>
          </div>

          {/* Text Area */}
          <div className="form-group">
            <div className="form-label">
              <span>What problem or frustration do you experience?</span>
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
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g., Duukaan pe customer QR scan karke payment karta hai par confirmation SMS 10 minute late aata hai... or describe who is affected and what you do right now."
              className="form-textarea"
              rows={5}
              style={{
                borderColor:
                  isTooShort || isTooLong ? 'var(--semantic-error-border)' : undefined,
              }}
              required
            />
            <div
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-charcoal-subtle)',
                marginTop: '0.375rem',
              }}
            >
              Tip: Mention <strong>who</strong> faces the pain, <strong>how often</strong> it happens,
              and any <strong>workarounds</strong> you currently use.
            </div>
          </div>

          {/* Example prompt pills */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-charcoal-subtle)',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <HelpCircle size={12} /> Click to test with real example inputs:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {examplePrompts.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyExample(ex.text)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    padding: '0.35rem 0.65rem',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--color-violet)' }}>
                    [{ex.lang}]
                  </span>{' '}
                  {ex.text.slice(0, 48)}...
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Submission Error</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Action Row: Auto share checkbox & Submit Button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-light)',
            }}
          >
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--color-charcoal)',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={autoShare}
                onChange={(e) => setAutoShare(e.target.checked)}
                style={{ accentColor: 'var(--color-violet)', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <span>Share publicly on the <strong>Real Problems Board</strong> for builders</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting || rawText.trim().length < 10 || isTooLong}
              className="btn btn-primary"
              style={{ minWidth: '160px' }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner spinner-white" />
                  Structuring with AI...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Analyze &amp; Structure Problem
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Structured Result Display */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Share confirmation banner if shared */}
          {shareSuccess && (
            <div className="alert alert-success">
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <strong>{shareSuccess}</strong>
                <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Builders can now view this problem on the public board.
                </div>
              </div>
              <button
                onClick={onNavigateToBoard}
                className="btn btn-secondary btn-sm"
                style={{ alignSelf: 'center' }}
              >
                View on Board <ArrowRight size={13} />
              </button>
            </div>
          )}

          {/* Structured Problem Card */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.75rem',
              }}
            >
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                Structured Problem Card
              </h3>
              <span className="badge badge-violet">Backend Verified</span>
            </div>
            <ProblemCardView
              problem={result}
              onShare={handleShare}
              isSharing={isSharing}
              showShareButton={!result.shared}
            />
          </div>

          {/* Existing Solutions Discovered */}
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
                  color: 'var(--color-charcoal)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Sparkles size={16} style={{ color: 'var(--color-violet)' }} />
                Discovered Solutions &amp; Prior Work
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-charcoal-muted)' }}>
                Products, academic papers, and patents cataloged by the backend for this problem space.
              </p>
            </div>

            <ExistingSolutionsList
              solutions={result.existing_solutions}
              errors={result.errors}
            />
          </div>
        </div>
      )}
    </div>
  )
}
