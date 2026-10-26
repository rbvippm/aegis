import { describe, expect, it } from 'vitest'
import {
  change,
  dailyRecords,
  day,
  firstActivity,
  selectTransfers,
  summarize,
  timeSeries,
  walletBalances,
  wallets,
  type AnalyticsQuery,
  type LedgerTransfer,
} from '@/features/monitoring/analytics-model'
const asOf = Date.parse('2026-10-26T12:00:00Z')
const query: AnalyticsQuery = { period: '24h', platforms: ['A'], chains: ['ETH'], tokens: ['USDT'] }
const transfer = (id: string, values: Partial<LedgerTransfer> = {}): LedgerTransfer => ({
  id,
  platform: 'A',
  chain: 'ETH',
  token: 'USDT',
  wallet: 'wallet-one',
  time: asOf - 1000,
  usd: 100,
  direction: 'deposit',
  ...values,
})
describe('监测统一账本口径', () => {
  it('当前与前一个等长窗口互不重叠；过滤内部转账、公链、币种与平台', () => {
    const rows = [
      transfer('now'),
      transfer('boundary', { time: asOf - day }),
      transfer('previous', { time: asOf - day - 1 }),
      transfer('future', { time: asOf }),
      transfer('internal', { direction: 'internal' }),
      transfer('chain', { chain: 'SOL' }),
      transfer('token', { token: 'ETH' }),
      transfer('platform', { platform: 'B' }),
    ]
    expect(selectTransfers(rows, query, asOf).map((r) => r.id)).toEqual(['now', 'boundary'])
    expect(selectTransfers(rows, query, asOf, true).map((r) => r.id)).toEqual(['previous'])
    expect(selectTransfers(rows, { ...query, chains: [] }, asOf)).toEqual([])
  })
  it('钱包跨币种去重；首次活动使用完整历史而不是筛选后的第一笔', () => {
    const rows = [
      transfer('old', { time: asOf - 2 * day, token: 'ETH' }),
      transfer('one'),
      transfer('two', { token: 'USDC' }),
      transfer('new', { wallet: 'wallet-two' }),
      transfer('withdrawal', { direction: 'withdrawal', usd: 70 }),
      transfer('internal', { direction: 'internal', usd: 10000 }),
    ]
    const current = selectTransfers(rows, { ...query, tokens: ['USDT', 'USDC'] }, asOf)
    const stats = summarize(current, firstActivity(rows), asOf - day)
    expect(stats).toMatchObject({
      deposits: 300,
      withdrawals: 70,
      net: 230,
      depositCount: 3,
      uniqueDepositors: 2,
      newDepositors: 1,
      averageDeposit: 100,
    })
    expect(
      wallets(current, firstActivity(rows), asOf - day).find((w) => w.wallet === 'wallet-one'),
    ).toMatchObject({ deposits: 2, amount: 200, isNew: false })
  })
  it('净流量图表各时间桶合计等于账本净额；负值不丢失', () => {
    const rows = [
      transfer('deposit', { time: asOf - (23 * day) / 24, usd: 20 }),
      transfer('withdrawal', { usd: 90, direction: 'withdrawal' }),
    ]
    const series = timeSeries(rows, query, asOf, 'platform', 'net')
    expect(series.times).toHaveLength(24)
    expect(series.series[0]!.values.reduce((s, v) => s + v, 0)).toBe(-70)
    expect(series.series[0]!.values.some((v) => v < 0)).toBe(true)
  })
  it('余额由期初余额和指定时刻之前的同范围净流量计算', () => {
    const rows = [
      transfer('deposit', { usd: 100 }),
      transfer('withdrawal', { direction: 'withdrawal', usd: 40 }),
      transfer('internal', { direction: 'internal', usd: 1000 }),
      transfer('other', { chain: 'SOL', usd: 900 }),
      transfer('future', { time: asOf, usd: 800 }),
    ]
    const opening = [
      { platform: 'A', chain: 'ETH', token: 'USDT', usd: 500 },
      { platform: 'A', chain: 'SOL', token: 'USDT', usd: 1000 },
    ]
    expect(walletBalances(rows, opening, query, asOf)).toEqual([
      { platform: 'A', chain: 'ETH', usd: 560 },
    ])
  })
  it('以UTC+8划分记录日，不将提款地址计为存款钱包', () => {
    const rows = [
      transfer('before', { time: Date.parse('2026-10-25T15:59:59Z') }),
      transfer('after', { time: Date.parse('2026-10-25T16:00:00Z') }),
      transfer('withdrawal', {
        direction: 'withdrawal',
        wallet: 'different',
        time: Date.parse('2026-10-25T16:00:00Z'),
        usd: 40,
      }),
    ]
    const records = dailyRecords(rows)
    expect(records.map((r) => r.date)).toEqual(['2026-10-25', '2026-10-26'])
    expect(records[1]).toMatchObject({
      deposits: 100,
      withdrawals: 40,
      net: 60,
      count: 1,
      unique: 1,
    })
  })
  it('无基期不伪装0%增长；负净流量以基期绝对值比较', () => {
    expect(change(100, 0)).toBeNull()
    expect(change(null, 100)).toBeNull()
    expect(change(100, null)).toBeNull()
    expect(change(0, 0)).toBeNull()
    expect(change(-20, -100)).toBe(80)
    expect(summarize([], new Map(), asOf - day).averageDeposit).toBeNull()
  })
})

describe('扩展监测样本', () => {
  it('保留样本不足平台，新增平台均有流水并遵循支持的链和币种', async () => {
    const { analyticsCatalog, analyticsLedger } = await import('@/mocks/monitoring-analytics')
    const { analyticsChains, analyticsTokens } =
      await import('@/features/monitoring/analytics-model')
    expect(analyticsCatalog.filter((p) => p.category === 'crypto')).toHaveLength(10)
    expect(analyticsCatalog.filter((p) => p.category === 'cases')).toHaveLength(3)
    expect(analyticsCatalog.find((p) => p.id === 'C')?.complete).toBe(false)
    expect(new Set(analyticsCatalog.map((p) => p.id)).size).toBe(analyticsCatalog.length)
    expect(analyticsChains).toEqual(['TRON', 'BSC', 'ETH', 'SOL'])
    expect(
      analyticsLedger.every(
        (t) => analyticsChains.includes(t.chain) && analyticsTokens.includes(t.token),
      ),
    ).toBe(true)
    for (const p of analyticsCatalog.filter((p) => p.complete))
      expect(analyticsLedger.some((t) => t.platform === p.id && t.direction === 'deposit')).toBe(
        true,
      )
  })
})

it('监测样本包含各链的USDT活动，资产余额可对账且不发生样本透支', async () => {
  const { analyticsCatalog, analyticsLedger, analyticsOpening, analyticsAsOf } =
    await import('@/mocks/monitoring-analytics')
  const { analyticsChains, analyticsTokens } = await import('@/features/monitoring/analytics-model')
  const scope = {
    period: '30d' as const,
    platforms: analyticsCatalog.filter((p) => p.complete).map((p) => p.id),
    chains: analyticsChains,
    tokens: analyticsTokens,
  }
  for (const chain of analyticsChains)
    expect(
      selectTransfers(
        analyticsLedger,
        { ...scope, chains: [chain], tokens: ['USDT'] },
        analyticsAsOf,
      ).some((t) => t.direction === 'deposit'),
    ).toBe(true)
  for (const token of analyticsTokens)
    expect(
      walletBalances(
        analyticsLedger,
        analyticsOpening,
        { ...scope, tokens: [token] },
        analyticsAsOf,
      ).every((b) => b.usd >= 0),
    ).toBe(true)
  const single = { ...query, period: '365d' as const }
  const actual = walletBalances(analyticsLedger, analyticsOpening, single, analyticsAsOf).reduce(
    (s, r) => s + r.usd,
    0,
  )
  const start = analyticsOpening
    .filter((b) => b.platform === 'A' && b.chain === 'ETH' && b.token === 'USDT')
    .reduce((s, r) => s + r.usd, 0)
  const net = analyticsLedger
    .filter(
      (t) =>
        t.platform === 'A' && t.chain === 'ETH' && t.token === 'USDT' && t.direction !== 'internal',
    )
    .reduce((s, t) => s + (t.direction === 'deposit' ? t.usd : -t.usd), 0)
  expect(actual).toBe(start + net)
})
