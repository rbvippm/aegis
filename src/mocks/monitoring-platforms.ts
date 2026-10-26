import type { ResearchPlatform } from '@/features/monitoring/research'
import { researchPlatforms } from './monitoring-research'

// Monitor-only fictional coverage. Other pages retain their established fixtures.
const additional: {
  id: string
  region: ResearchPlatform['region']
  score: number
  grade: 'S' | 'B'
  taint: number
  samples: number
  small: number
  large: number
}[] = [
  { id: 'D', region: 'asia', score: 8.6, grade: 'S', taint: 0.4, samples: 92, small: 4, large: 23 },
  {
    id: 'E',
    region: 'europe',
    score: 7.9,
    grade: 'B',
    taint: 2.7,
    samples: 68,
    small: 7,
    large: 32,
  },
  {
    id: 'F',
    region: 'asia',
    score: 8.9,
    grade: 'S',
    taint: 0.2,
    samples: 158,
    small: 3.5,
    large: 21,
  },
  { id: 'G', region: null, score: 7.6, grade: 'B', taint: 4.1, samples: 42, small: 9, large: 45 },
  {
    id: 'H',
    region: 'europe',
    score: 8.2,
    grade: 'S',
    taint: 0.3,
    samples: 98,
    small: 5,
    large: 27,
  },
  {
    id: 'I',
    region: 'asia',
    score: 6.9,
    grade: 'B',
    taint: 3.8,
    samples: 24,
    small: 12,
    large: 54,
  },
  {
    id: 'J',
    region: 'asia',
    score: 9.0,
    grade: 'S',
    taint: 0.1,
    samples: 220,
    small: 2.8,
    large: 16,
  },
]
export const monitoringPlatforms: ResearchPlatform[] = [
  ...researchPlatforms,
  ...additional.map((p, i): ResearchPlatform => ({
    id: p.id,
    name: p.id === 'J' ? '平台 J · 国际站' : `平台 ${p.id}`,
    region: p.region,
    score: p.score,
    chains: ['TRON', 'BSC', 'ETH'],
    grade: p.grade,
    taint: p.taint,
    wallet: null,
    flow: null,
    flowPercent: null,
    samples: p.samples,
    smallMinutes: p.small,
    largeMinutes: p.large,
    commission: 20 + i * 2,
    playerShare: 50,
    windows: {
      '24h': { deposit: '暂无数据', amount: 0, change: 0 },
      '7d': { deposit: '暂无数据', amount: 0, change: 0 },
      '30d': { deposit: '暂无数据', amount: 0, change: 0 },
    },
  })),
]
