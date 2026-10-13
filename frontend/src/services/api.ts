import type {
  HealthResponse,
  IdeaCheckRequest,
  IdeaReport,
  ProblemRequest,
  ProblemResponse,
  ProblemsListResponse,
  ShareProblemResponse,
  ApiErrorResponse,
} from '../types/api'

// Configurable base URL: falls back to empty string for same-origin dev proxy
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

export class ApiError extends Error {
  status: number
  detail: string
  raw?: unknown

  constructor(status: number, detail: string, raw?: unknown) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.raw = raw
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status} (${response.statusText})`
    let rawData: unknown

    if (isJson) {
      try {
        const errorData = (await response.json()) as ApiErrorResponse
        rawData = errorData

        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail
        } else if (Array.isArray(errorData.detail)) {
          // FastAPI pydantic validation errors
          errorMessage = errorData.detail
            .map((err) => {
              const field = err.loc ? err.loc.join('.') : 'field'
              return `${field}: ${err.msg || 'Invalid value'}`
            })
            .join('; ')
        }
      } catch {
        // Fall back to status message
      }
    } else {
      try {
        const text = await response.text()
        if (text) errorMessage = text
      } catch {
        // Keep generic message
      }
    }

    throw new ApiError(response.status, errorMessage, rawData)
  }

  if (response.status === 204) {
    return {} as T
  }

  return (await response.json()) as T
}

export const api = {
  /**
   * Health check to confirm backend availability
   * GET /api/v1/health
   */
  async checkHealth(): Promise<HealthResponse> {
    const url = `${API_BASE_URL}/api/v1/health`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
    return handleResponse<HealthResponse>(res)
  },

  /**
   * Submit an unstructured problem statement
   * POST /api/v1/problems
   */
  async submitProblem(rawText: string, language = 'auto'): Promise<ProblemResponse> {
    const url = `${API_BASE_URL}/api/v1/problems`
    const payload: ProblemRequest = {
      raw_text: rawText.trim(),
      language,
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return handleResponse<ProblemResponse>(res)
  },

  /**
   * Mark a problem as shared on the public board
   * POST /api/v1/problems/{problem_id}/share
   */
  async shareProblem(problemId: string): Promise<ShareProblemResponse> {
    const url = `${API_BASE_URL}/api/v1/problems/${encodeURIComponent(problemId)}/share`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    })
    return handleResponse<ShareProblemResponse>(res)
  },

  /**
   * Retrieve all shared problems
   * GET /api/v1/problems
   */
  async listSharedProblems(): Promise<ProblemsListResponse> {
    const url = `${API_BASE_URL}/api/v1/problems`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
    return handleResponse<ProblemsListResponse>(res)
  },

  /**
   * Check a project idea against existing products, papers, and patents
   * POST /api/v1/ideas/check
   */
  async checkIdea(ideaText: string): Promise<IdeaReport> {
    const url = `${API_BASE_URL}/api/v1/ideas/check`
    const payload: IdeaCheckRequest = {
      idea_text: ideaText.trim(),
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    return handleResponse<IdeaReport>(res)
  },

  /**
   * Retrieve a previously generated report by ID from Firestore
   * GET /api/v1/reports/{report_id}
   */
  async getReport(reportId: string): Promise<IdeaReport> {
    const url = `${API_BASE_URL}/api/v1/reports/${encodeURIComponent(reportId)}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })
    return handleResponse<IdeaReport>(res)
  },

  /**
   * Save a complete IdeaReport to Firestore
   * POST /api/v1/reports
   */
  async saveReport(report: IdeaReport): Promise<IdeaReport> {
    const url = `${API_BASE_URL}/api/v1/reports`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(report),
    })
    return handleResponse<IdeaReport>(res)
  },
}
