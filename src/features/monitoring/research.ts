export type ResearchWindow = '24h' | '7d' | '30d'
export type ResearchChain = 'TRON' | 'BSC' | 'Arbitrum' | 'TON' | 'ETH'
export interface ResearchPlatform {
  id: string
  name: string
  region: 'asia' | 'europe' | null
  score: number | null
  chains: ResearchChain[]
  grade: 'S' | 'B' | null
  taint: number | null
  wallet: string | null
  flow: string | null
  flowPercent: number | null
  samples: number
  smallMinutes: number | null
  largeMinutes: number | null
  commission: number | null
  playerShare: number | null
  windows: Record<ResearchWindow, { deposit: string; amount: number; change: number }>
}
export const researchChains: ResearchChain[] = ['TRON', 'BSC', 'Arbitrum', 'TON', 'ETH']

export const researchRegionLabel = (region: ResearchPlatform['region']) =>
  region === 'asia' ? '亚洲平台' : region === 'europe' ? '欧洲平台' : '地区未标注'
