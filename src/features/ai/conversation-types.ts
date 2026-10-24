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
export interface ChatMessage {
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
export interface ProjectSection {
  title: string
  text: string
}
export interface ProjectReport {
  scenario: ProjectScenario
  title: string
  scope: string
  takeaway: string
  reasons: ProjectSection[]
  table?: { title: string; columns: string[]; rows: string[][] }
  plan: string[]
  caveat: string
  actions: { label: string; to: string }[]
  details: ProjectSection[]
}
