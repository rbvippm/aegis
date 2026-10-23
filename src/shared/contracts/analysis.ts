import { z } from 'zod'

const iso = z.string().datetime({ offset: true })
export const MarketSchema = z.object({
  fixtureId: z.string(),
  market: z.string(),
  selection: z.string(),
  line: z.string(),
  period: z.string(),
  phase: z.enum(['prematch', 'live']),
  settlementRuleId: z.string(),
})
const evidence = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(['fixture', 'odds', 'onchain', 'knowledge-base']),
  observedAt: iso,
  freshness: z.enum(['fresh', 'stale', 'unknown']),
  excerpt: z.string(),
})
const odds = z.object({
  merchantId: z.string(),
  merchantName: z.string(),
  market: MarketSchema,
  decimalOdds: z.number().gt(1),
  asOf: iso,
  freshness: z.enum(['fresh', 'stale', 'unknown']),
  eligible: z.boolean(),
  terms: z.string(),
  sourceIds: z.array(z.string()),
})
const stats = z.object({
  sampleCount: z.number().int().nonnegative(),
  medianSeconds: z.number().int().nonnegative().nullable(),
})
const funding = z.object({
  merchantId: z.string(),
  merchantName: z.string(),
  deposit: stats,
  withdrawal: stats,
  freshness: z.enum(['fresh', 'stale', 'unknown']),
  sourceIds: z.array(z.string()),
})
export const AnalysisSchema = z.object({
  requestId: z.string(),
  snapshotId: z.string(),
  demo: z.boolean(),
  asOf: iso,
  fixture: z.object({ id: z.string(), home: z.string(), away: z.string(), kickoffAt: iso }),
  dimensions: z.array(
    z.object({ label: z.string(), summary: z.string().nullable(), sourceIds: z.array(z.string()) }),
  ),
  conclusion: z.object({
    market: MarketSchema,
    tendency: z.string().nullable(),
    support: z.enum(['low', 'medium', 'high', 'insufficient']),
    uncertainties: z.array(z.string()),
    sourceIds: z.array(z.string()),
  }),
  odds: z.array(odds),
  funding: z.object({
    cohort: z.object({
      chain: z.string(),
      asset: z.string(),
      amountBand: z.string(),
      windowStart: iso,
      windowEnd: iso,
      measurementMethodId: z.string(),
      measurementLabel: z.string(),
    }),
    minimumSamples: z.number().int().positive(),
    rows: z.array(funding),
    coverageNote: z.string(),
  }),
  sources: z.array(evidence),
})
export type Analysis = z.infer<typeof AnalysisSchema>
export type Market = z.infer<typeof MarketSchema>
export type OddsQuote = z.infer<typeof odds>
export type FundingRow = z.infer<typeof funding>
export interface AnalysisRequest {
  message: string
  requestId: string
  timezone: string
}
export type AnalysisStage = 'retrieving' | 'analyzing' | 'ranking'
export interface AnalysisService {
  analyze: (
    request: AnalysisRequest,
    options: { signal: AbortSignal; onStage: (stage: AnalysisStage) => void },
  ) => Promise<Analysis>
}
