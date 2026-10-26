export interface PlatformBinding {
  id: string
  name: string
  uid: string
  eligibility: 'verified' | 'pending' | 'unbound'
}
export interface SettlementRecord {
  id: string
  platform: string
  label: string
  cents: number
  status: 'pending' | 'settled'
  date: string
}
export interface EvidenceFile {
  name: string
  size: number
  type: string
}
export interface ProfileTicket {
  id: string
  platform: string
  category: string
  description: string
  status: 'materials' | 'processing' | 'closed' | 'draft'
  date: string
  example: boolean
  evidence: EvidenceFile[]
  amount?: string
  supplement?: string
}
export interface TicketInput {
  platform: string
  category: string
  description: string
  amount: string
  evidence: EvidenceFile[]
}
export interface ProfileNotice {
  id: string
  title: string
  description: string
  type: 'platform' | 'ticket' | 'system'
  read: boolean
  target: string
}
export type ProfilePanel =
  | 'settings'
  | 'identity'
  | 'login'
  | 'email'
  | 'telegram'
  | 'devices'
  | 'notifications'
  | 'binding'
  | 'bindingInfo'
  | 'method'
  | 'ticketForm'
  | 'ticketInfo'
  | 'feedback'
  | 'about'
  | 'changelog'
  | 'help'
  | 'invite'
  | 'language'
  | 'logout'
