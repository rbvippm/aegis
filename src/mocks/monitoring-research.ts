import type { ResearchPlatform, ResearchWindow } from '@/features/monitoring/research'

// Fixed fictional snapshots. Never consumed in API mode.
export const researchSnapshot = '10/22 19:32 UTC+8'
export const researchPlatforms: ResearchPlatform[] = [
  {
    id: 'A',
    name: '平台 A',
    region: 'asia',
    score: 9.2,
    chains: ['TRON', 'BSC', 'Arbitrum', 'TON', 'ETH'],
    grade: 'S',
    taint: 0.3,
    wallet: '$45.8M',
    flow: '+$2.1M',
    flowPercent: 4.6,
    samples: 126,
    smallMinutes: 3,
    largeMinutes: 18,
    commission: 30,
    playerShare: 50,
    windows: {
      '24h': { deposit: '$82M', amount: 82e6, change: 6.2 },
      '7d': { deposit: '$548M', amount: 548e6, change: 12.5 },
      '30d': { deposit: '$2.05B', amount: 2.05e9, change: 18.2 },
    },
  },
  {
    id: 'B',
    name: '平台 B',
    region: 'europe',
    score: 7.1,
    chains: ['TRON', 'BSC', 'ETH'],
    grade: 'B',
    taint: 3.4,
    wallet: '$21.6M',
    flow: '−$6.0M',
    flowPercent: -28,
    samples: 64,
    smallMinutes: 8,
    largeMinutes: 36,
    commission: 25,
    playerShare: 40,
    windows: {
      '24h': { deposit: '$37M', amount: 37e6, change: -8.1 },
      '7d': { deposit: '$208M', amount: 208e6, change: -6.2 },
      '30d': { deposit: '$860M', amount: 860e6, change: -4.3 },
    },
  },
  {
    id: 'C',
    name: '平台 C',
    region: 'asia',
    score: null,
    chains: ['TON', 'Arbitrum'],
    grade: null,
    taint: null,
    wallet: null,
    flow: null,
    flowPercent: null,
    samples: 8,
    smallMinutes: null,
    largeMinutes: null,
    commission: null,
    playerShare: null,
    windows: {
      '24h': { deposit: '样本不足', amount: 0, change: 0 },
      '7d': { deposit: '样本不足', amount: 0, change: 0 },
      '30d': { deposit: '样本不足', amount: 0, change: 0 },
    },
  },
]
// Each point is a daily deposit total in USD millions, not cumulative deposits.
export const researchSeries: Record<ResearchWindow, { labels: string[]; values: number[][] }> = {
  '30d': {
    labels: ['09/23', '09/28', '10/03', '10/08', '10/13', '10/18', '10/22'],
    values: [
      [28, 46, 42, 64, 71, 76, 82],
      [15, 25, 23, 39, 34, 45, 37],
    ],
  },
  '7d': {
    labels: ['10/16', '10/17', '10/18', '10/19', '10/20', '10/21', '10/22'],
    values: [
      [68, 74, 76, 83, 78, 87, 82],
      [29, 24, 31, 27, 32, 28, 37],
    ],
  },
  '24h': {
    labels: ['10/21 20h', '00h', '04h', '08h', '12h', '16h', '10/22 19h'],
    values: [
      [12, 10, 8, 14, 11, 15, 12],
      [4, 6, 3, 7, 5, 8, 4],
    ],
  },
}
