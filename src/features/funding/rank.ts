import type { FundingRow } from '@/shared/contracts/analysis'
export function rankFunding(rows: FundingRow[], minimumSamples: number) {
  const valid = rows
    .filter(
      (row) =>
        row.freshness === 'fresh' &&
        row.withdrawal.sampleCount >= minimumSamples &&
        row.withdrawal.medianSeconds !== null,
    )
    .sort((a, b) => a.withdrawal.medianSeconds! - b.withdrawal.medianSeconds!)
  return valid.map((row) => ({
    ...row,
    rank: valid.findIndex((r) => r.withdrawal.medianSeconds === row.withdrawal.medianSeconds) + 1,
  }))
}
