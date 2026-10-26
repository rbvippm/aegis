import type { AnalyticsQuery } from '@/features/monitoring/analytics-model'
export type AnswerKind = 'sports' | 'funding' | 'clarify' | 'project'
export type DetailPanel = 'analysis' | 'sources' | 'quotes' | 'funding' | 'risk' | 'limits'
export interface ChatSource {
  id: string
  title: string
  type: string
  excerpt: string
  asOf: string
  status: string
}
export interface ChatAnswer {
  kind: AnswerKind
  project?: ProjectReport
  summary: string
  sources: ChatSource[]
  followups: string[]
}
export interface AiSportsEntry {
  source: 'sports'
  fixture: string
  market: string
  selection: number
  category?: string
  operator?: string
  revision?: number
}
export interface ChatMessage {
  entry?: AiSportsEntry
  id: string
  question: string
  context: string
  status: 'pending' | 'complete' | 'stopped' | 'error'
  stage: string
  answer?: ChatAnswer
  error?: string
}
export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
}

export type ProjectScenario =
  | 'match'
  | 'odds'
  | 'arbitrage'
  | 'movements'
  | 'monitor'
  | 'vip'
  | 'agents'
  | 'tickets'
  | 'binding'
  | 'analytics'
  | 'activity'
  | 'following'
  | 'invitation'
  | 'efficiency'
  | 'recommendation'
export interface ProjectSection {
  title: string
  text: string
}
export interface AiBusinessContext {
  follows: string[]
  platformUnread: number
}
export interface ProjectCommand {
  label: string
  kind: 'follow' | 'unfollow' | 'read-platform'
  platform?: string
}
export interface ProjectRecommendation {
  platform: string
  name: string
  badge: string
  reason: string
  facts: { label: string; value: string }[]
  to: string
}
export interface ProjectReport {
  query?: AnalyticsQuery
  sports?: AiSportsEntry
  recommendationGoal?: 'rating' | 'deposits'
  recommendations?: ProjectRecommendation[]
  scenario: ProjectScenario
  title: string
  scope: string
  takeaway: string
  reasons: ProjectSection[]
  table?: { title: string; columns: string[]; rows: string[][] }
  plan: string[]
  caveat: string
  actions: { label: string; to: string }[]
  commands?: ProjectCommand[]
  details: ProjectSection[]
}
