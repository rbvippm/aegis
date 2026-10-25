export type ServiceKind = 'vip' | 'agents'
export type PlatformId = 'A' | 'B'

export interface VipOffer {
  id: PlatformId
  name: string
  level: number
  lossback: number
  cashback: number
  period: string
  cap: number
  rollover: string
}

export interface AgentPolicy {
  id: PlatformId
  name: string
  commission: number
  venueFee: number
  settlement: 'daily' | 'weekly'
  carryover: boolean
  deductions: string
  lockTerms: string
}

export interface AnonymousRequest {
  subscriptionLevel?: 'L1' | 'L2' | 'L3'
  kind: ServiceKind
  volume: string
  tier: string
  preference: string
  note: string
}
