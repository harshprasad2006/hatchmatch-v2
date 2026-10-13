/**
 * HatchMatch API Type Definitions
 * Exact alignment with backend models in app/models/problem.py and app/models/report.py
 */

export interface ProblemCard {
  title: string
  who: string
  pain: string
  frequency: string
  workaround: string
  category: string
}

export interface ExistingSolution {
  name: string
  summary: string
  link: string
}

export interface ProblemRequest {
  raw_text: string
  language?: string
}

export interface ProblemResponse {
  id: string
  card: ProblemCard
  card_en?: ProblemCard | null
  existing_solutions: ExistingSolution[]
  shared: boolean
  created_at: string
  partial?: boolean
  errors?: string[]
}

export interface ShareProblemResponse {
  id: string
  shared: boolean
  message: string
}

export interface ProblemsListResponse {
  problems: ProblemResponse[]
}

export interface IdeaCheckRequest {
  idea_text: string
}

export interface IdeaCard {
  title: string
  main_features: string[]
  keywords: string[]
}

export interface Match {
  type: 'product' | 'research_paper' | 'patent' | string
  title: string
  link: string
  text: string
  similarity: number
}

export interface FeatureComparison {
  feature: string
  found: boolean
  found_in: number[]
}

export interface ScoreBreakdown {
  closest_match_deduction: number
  crowd_deduction: number
  feature_overlap_deduction: number
}

export interface IdeaReport {
  id: string
  idea_text: string
  idea_card: IdeaCard
  matches: Match[]
  compare_table: FeatureComparison[]
  uniqueness_score: number
  score_breakdown: ScoreBreakdown
  created_at: string
  partial?: boolean
  errors?: string[]
}

export interface HealthResponse {
  status: string
  service: string
}

export interface ApiErrorDetail {
  loc?: (string | number)[]
  msg?: string
  type?: string
}

export interface ApiErrorResponse {
  detail?: string | ApiErrorDetail[]
}
