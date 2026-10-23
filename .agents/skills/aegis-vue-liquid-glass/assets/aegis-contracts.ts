/** Proposed DTOs; validate external JSON at runtime. Not an implemented API. */
export type ISODateTime = string;
export type Freshness = 'fresh' | 'stale' | 'unknown';
export type EvidenceKind = 'fixture' | 'odds' | 'onchain' | 'knowledge-base';
export interface Evidence {
  id: string;
  label: string;
  kind: EvidenceKind;
  observedAt: ISODateTime | null;
  retrievedAt: ISODateTime;
  freshness: Freshness;
  excerpt?: string;
  publicUrl?: string;
}
export interface MarketKey {
  fixtureId: string;
  market: string;
  selection: string;
  line: string | null; // canonical server value; e.g. '-0.25'
  period: string;
  phase: 'prematch' | 'live';
  settlementRuleId: string;
}
export interface OddsQuote {
  merchantId: string;
  merchantName: string;
  market: MarketKey;
  decimalOdds: number;
  asOf: ISODateTime;
  expiresAt: ISODateTime;
  eligibility: 'eligible' | 'restricted' | 'unknown';
  termsSummary: string | null;
  sourceIds: string[];
}
export interface FundingCohort {
  chain: string;
  assetId: string;
  amountMinInclusive: string; // decimal string in asset units
  amountMaxExclusive: string | null;
  windowStart: ISODateTime;
  windowEnd: ISODateTime;
  measurementMethodId: string;
  depositStartEvent: string;
  depositEndEvent: string;
  withdrawalStartEvent: string;
  withdrawalEndEvent: string;
}
export interface TimingStats {
  sampleCount: number;
  medianSeconds: number | null;
  p95Seconds: number | null;
}
export interface FundingObservation {
  merchantId: string;
  merchantName: string;
  deposit: TimingStats;
  withdrawal: TimingStats;
  observedAt: ISODateTime;
  freshness: Freshness;
  sourceIds: string[];
}
export type Ranked<T> = T & (
  | { status: 'ranked'; rank: number }
  | { status: 'excluded'; rank: null; reason: string }
);
export interface AnalysisResult {
  requestId: string;
  conversationId: string;
  snapshotId: string;
  demo: boolean;
  asOf: ISODateTime;
  fixture: { id: string; home: string; away: string; kickoffAt: ISODateTime; timezone: string };
  dimensions: Array<{ label: string; summary: string | null; sourceIds: string[] }>;
  conclusion: {
    market: MarketKey | null;
    tendency: string | null;
    support: 'low' | 'medium' | 'high' | 'insufficient';
    uncertainties: string[];
    sourceIds: string[];
  };
  oddsRanking: {
    market: MarketKey;
    sortBy: 'decimal-odds-desc';
    rows: Array<Ranked<OddsQuote>>;
  } | null;
  fundingRanking: {
    cohort: FundingCohort;
    sortBy: 'withdrawal-median-seconds-asc';
    minimumSamples: number;
    rows: Array<Ranked<FundingObservation>>;
    coverageNote: string;
  } | null;
  sources: Evidence[];
}
export interface AnalysisRequest {
  message: string;
  timezone: string;
  locale: string;
  conversationId?: string;
  fixtureId?: string;
}
export type AnalysisEvent = {
  requestId: string;
  sequence: number;
} & (
  | { type: 'status'; stage: 'retrieving' | 'analyzing' | 'ranking' }
  | { type: 'text_delta'; text: string }
  | { type: 'result'; result: AnalysisResult }
  | { type: 'error'; code: string; message: string; retryable: boolean }
  | { type: 'done' }
);
