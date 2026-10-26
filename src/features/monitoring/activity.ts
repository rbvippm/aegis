import type { LedgerTransfer } from './analytics-model'
import { day } from './analytics-model'
import type { ResearchPlatform } from './research'
export const whaleThreshold = 100000
export interface PlatformActivity {
  id: string
  platform: string
  kind: 'whale' | 'transfer' | 'outflow'
  title: string
  description: string
  time: number
  usd: number | null
  chain?: string
  token?: string
  wallet?: string
}
export function platformActivities(
  rows: LedgerTransfer[],
  platforms: ResearchPlatform[],
  asOf: number,
): PlatformActivity[] {
  const names = new Map(platforms.map((p) => [p.id, p.name]))
  const events: PlatformActivity[] = rows
    .filter(
      (r) =>
        names.has(r.platform) &&
        r.time <= asOf &&
        r.time > asOf - 7 * day &&
        (r.direction === 'internal' || (r.direction === 'withdrawal' && r.usd >= whaleThreshold)),
    )
    .map((r) => ({
      id: r.id,
      platform: r.platform,
      kind: r.direction === 'internal' ? 'transfer' : 'whale',
      title: r.direction === 'internal' ? '热钱包资金转移' : '大鳄提款',
      description:
        r.direction === 'internal'
          ? '已标记钱包之间的资金转移，内部转账不计入出款额。'
          : '单笔链上出款达到 $100,000；不据此识别玩家身份。',
      time: r.time,
      usd: r.usd,
      chain: r.chain,
      token: r.token,
      wallet: r.wallet,
    }))
  for (const p of platforms)
    if (p.flowPercent !== null && p.flowPercent <= -25)
      events.push({
        id: `outflow:${p.id}:${asOf}`,
        platform: p.id,
        kind: 'outflow',
        title: '资金异动',
        description: `快照余额变化 ${p.flowPercent}%，达到净流出 25% 的关注阈值。`,
        time: asOf,
        usd: null,
      })
  return events.sort((a, b) => b.time - a.time || a.id.localeCompare(b.id))
}
export function preferredPlatforms(platforms: ResearchPlatform[], follows: string[]) {
  const ranked = [...platforms].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  const followed = ranked.filter((p) => follows.includes(p.id))
  return followed.length ? followed : ranked.filter((p) => p.score !== null).slice(0, 3)
}
export function median(values: number[]) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length
    ? sorted.length % 2
      ? sorted[mid]!
      : (sorted[mid - 1]! + sorted[mid]!) / 2
    : null
}
