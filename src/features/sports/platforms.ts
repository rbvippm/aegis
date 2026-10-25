export interface SportsPlatform {
  id: string
  name: string
  mark: string
  type: 'sports' | 'web3'
  score: number | null
}
export const sportsPlatforms: SportsPlatform[] = [
  { id: 'A', name: '平台 A', mark: 'A', type: 'sports', score: 9.2 },
  { id: 'B', name: '平台 B', mark: 'B', type: 'sports', score: 8.7 },
  { id: 'C', name: '平台 C', mark: 'C', type: 'sports', score: 8.1 },
  { id: 'D', name: '平台 D', mark: 'D', type: 'sports', score: 8.5 },
  { id: 'E', name: '平台 E', mark: 'E', type: 'sports', score: null },
  { id: 'F', name: '平台 F', mark: 'F', type: 'sports', score: null },
  { id: 'azuro', name: 'Azuro', mark: 'Az', type: 'web3', score: null },
  { id: 'overtime', name: 'Overtime', mark: 'OT', type: 'web3', score: null },
  { id: 'polymarket', name: 'Polymarket', mark: 'P', type: 'web3', score: null },
]
export const getSportsPlatform = (id: string) => sportsPlatforms.find((p) => p.id === id)
export const platformName = (id: string) => getSportsPlatform(id)?.name ?? `平台 ${id}`
