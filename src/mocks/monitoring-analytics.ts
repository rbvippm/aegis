import { monitoringPlatforms } from './monitoring-platforms'
import {
  analyticsChains,
  day,
  type AnalyticsPlatform,
  type LedgerTransfer,
  type OpeningBalance,
} from '@/features/monitoring/analytics-model'

// Reproducible fictional ledger; never a source for API mode or real explorer links.
export const analyticsAsOf = Date.parse('2026-10-25T12:00:00Z')
export const analyticsCatalog: AnalyticsPlatform[] = [
  ...monitoringPlatforms.map((p) => ({
    id: p.id,
    name: p.name,
    category: 'crypto' as const,
    region: p.region,
    complete: p.score !== null,
  })),
  { id: 'case-1', name: '饰品平台 甲', category: 'cases', region: 'europe', complete: true },
  { id: 'case-2', name: '饰品平台 乙', category: 'cases', region: 'asia', complete: true },
  { id: 'case-3', name: '饰品平台 丙', category: 'cases', region: null, complete: true },
]
const chainTokens: Record<string, string[]> = {
  ETH: ['ETH', 'USDT', 'USDC'],
  TRON: ['TRX', 'USDT'],
  BSC: ['BNB', 'USDT', 'USDC'],
  SOL: ['SOL', 'USDT', 'USDC'],
}
function hash(seed: number) {
  let n = seed >>> 0
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b)
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b)
  return (n ^ (n >>> 16)) >>> 0
}
export const analyticsLedger: LedgerTransfer[] = []
export const analyticsOpening: OpeningBalance[] = []
for (const [p, platform] of analyticsCatalog.filter((p) => p.complete).entries()) {
  for (const [c, chain] of analyticsChains.entries()) {
    for (const [t, token] of chainTokens[chain]!.entries())
      analyticsOpening.push({
        platform: platform.id,
        chain,
        token,
        usd: 90000 * (p + 1) + c * 4000 + t * 300,
      })
  }
  for (let d = 0; d < 730; d++) {
    const wave = 1 + Math.sin((d + p * 8) / 13) * 0.4
    for (let slot = 0; slot < 6; slot++) {
      const seed = (d + 1) * 131 + (p + 1) * 979 + slot * 1223
      const chain = analyticsChains[(d + slot + p) % analyticsChains.length]!
      const native = p === 0 && d % 7 === 0 && slot < 4 && chain === 'ETH'
      const stable = d % 7 === 0 && slot < 4 && chain === 'TRON'
      const token = native
        ? 'ETH'
        : stable
          ? 'USDT'
          : chainTokens[chain]![hash(seed + 12345) % chainTokens[chain]!.length]!
      const direction =
        slot === 5 && d % 7 === 0 ? 'internal' : slot >= 4 ? 'withdrawal' : 'deposit'
      const epoch = Math.floor((729 - d) / 28) - (slot % 2 === 0 ? 0 : 1)
      analyticsLedger.push({
        id: `sample-${platform.id}-${String(d).padStart(3, '0')}-${slot}`,
        platform: platform.id,
        chain,
        token,
        wallet: `sample:${platform.id}:${chain}:${Math.max(0, epoch)}:${hash(seed + 3467) % 12}`,
        time: analyticsAsOf - d * day - ((slot * 3 + 1) * day) / 24,
        usd: Math.round(
          (120 + ((d * 197 + slot * 1729 + p * 571) % 90000)) *
            wave *
            (p + 1) *
            (direction === 'withdrawal' ? (p === 1 && d < 7 ? 3 : 1.4) : 1),
        ),
        direction,
      })
    }
  }
}

// Pre-fund fictional assets to cover the entire replay, rather than clamping negative balances.
const replay = new Map<string, { value: number; minimum: number }>()
for (const t of [...analyticsLedger].sort((a, b) => a.time - b.time)) {
  if (t.direction === 'internal') continue
  const key = `${t.platform}:${t.chain}:${t.token}`
  const state = replay.get(key) ?? { value: 0, minimum: 0 }
  state.value += t.direction === 'deposit' ? t.usd : -t.usd
  state.minimum = Math.min(state.minimum, state.value)
  replay.set(key, state)
}
for (const balance of analyticsOpening)
  balance.usd -= replay.get(`${balance.platform}:${balance.chain}:${balance.token}`)?.minimum ?? 0
