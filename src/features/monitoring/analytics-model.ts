import type { ResearchWindow } from './research'

export type AnalyticsWindow = ResearchWindow | '90d' | '365d'
export type FlowMetric = 'deposit' | 'withdrawal' | 'net'
export type GroupBy = 'platform' | 'chain' | 'token'
export interface AnalyticsPlatform {
  id: string
  name: string
  category: 'crypto' | 'cases'
  region: 'asia' | 'europe' | null
  complete: boolean
}
export interface LedgerTransfer {
  id: string
  platform: string
  chain: string
  token: string
  wallet: string
  time: number
  usd: number
  direction: 'deposit' | 'withdrawal' | 'internal'
}
export interface OpeningBalance {
  platform: string
  chain: string
  token: string
  usd: number
}
export interface AnalyticsQuery {
  period: AnalyticsWindow
  chains: string[]
  tokens: string[]
  platforms: string[]
}
export interface FlowStats {
  deposits: number
  withdrawals: number
  net: number
  depositCount: number
  withdrawalCount: number
  transactions: number
  uniqueDepositors: number
  uniqueWithdrawers: number
  newDepositors: number
  newWithdrawers: number
  averageDeposit: number | null
  averageWithdrawal: number | null
}
export const analyticsPeriods: AnalyticsWindow[] = ['24h', '7d', '30d', '90d', '365d']
export const analyticsChains = ['TRON', 'BSC', 'ETH', 'SOL']
export const analyticsTokens = ['USDT', 'USDC', 'TRX', 'BNB', 'ETH', 'SOL']
export const day = 86400000
export const duration = (period: AnalyticsWindow) =>
  period === '24h' ? day : Number(period.slice(0, -1)) * day
export const money = (value: number | null) =>
  value === null || !Number.isFinite(value)
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
        maximumFractionDigits: 2,
      }).format(value)
export const count = (value: number) =>
  new Intl.NumberFormat('zh-CN', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
export const change = (current: number | null, previous: number | null) =>
  current === null || previous === null || previous === 0
    ? null
    : ((current - previous) / Math.abs(previous)) * 100
export const percent = (value: number | null) =>
  value === null ? '无可比基期' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
export const dateLabel = (time: number, hourly = false) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    ...(hourly ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  }).format(time)
export const flowValue = (row: LedgerTransfer, metric: FlowMetric) =>
  row.direction === 'internal'
    ? 0
    : metric === 'net'
      ? row.direction === 'deposit'
        ? row.usd
        : -row.usd
      : row.direction === metric
        ? row.usd
        : 0
export function matchTransfer(row: LedgerTransfer, query: AnalyticsQuery) {
  return (
    query.platforms.includes(row.platform) &&
    query.chains.includes(row.chain) &&
    query.tokens.includes(row.token) &&
    row.direction !== 'internal'
  )
}
export function selectTransfers(
  rows: LedgerTransfer[],
  query: AnalyticsQuery,
  asOf: number,
  previous = false,
) {
  const end = asOf - (previous ? duration(query.period) : 0)
  return rows.filter(
    (row) =>
      matchTransfer(row, query) && row.time >= end - duration(query.period) && row.time < end,
  )
}
export function firstActivity(rows: LedgerTransfer[]) {
  const first = new Map<string, number>()
  for (const row of rows) {
    if (row.direction === 'internal') continue
    const key = `${row.direction}:${row.wallet}`
    first.set(key, Math.min(first.get(key) ?? Infinity, row.time))
  }
  return first
}
export function summarize(
  rows: LedgerTransfer[],
  first: Map<string, number>,
  from: number,
): FlowStats {
  const deposits = rows.filter((row) => row.direction === 'deposit')
  const withdrawals = rows.filter((row) => row.direction === 'withdrawal')
  const depositWallets = new Set(deposits.map((row) => row.wallet))
  const withdrawalWallets = new Set(withdrawals.map((row) => row.wallet))
  const total = (items: LedgerTransfer[]) => items.reduce((sum, row) => sum + row.usd, 0)
  const depositAmount = total(deposits),
    withdrawalAmount = total(withdrawals)
  return {
    deposits: depositAmount,
    withdrawals: withdrawalAmount,
    net: depositAmount - withdrawalAmount,
    depositCount: deposits.length,
    withdrawalCount: withdrawals.length,
    transactions: deposits.length + withdrawals.length,
    uniqueDepositors: depositWallets.size,
    uniqueWithdrawers: withdrawalWallets.size,
    newDepositors: [...depositWallets].filter(
      (wallet) => (first.get(`deposit:${wallet}`) ?? -Infinity) >= from,
    ).length,
    newWithdrawers: [...withdrawalWallets].filter(
      (wallet) => (first.get(`withdrawal:${wallet}`) ?? -Infinity) >= from,
    ).length,
    averageDeposit: deposits.length ? depositAmount / deposits.length : null,
    averageWithdrawal: withdrawals.length ? withdrawalAmount / withdrawals.length : null,
  }
}
export interface Series {
  key: string
  values: number[]
}
export function timeSeries(
  rows: LedgerTransfer[],
  query: AnalyticsQuery,
  asOf: number,
  group: GroupBy,
  metric: FlowMetric,
) {
  const from = asOf - duration(query.period)
  const size = query.period === '24h' ? day / 24 : query.period === '365d' ? day * 7 : day
  const length = Math.ceil(duration(query.period) / size)
  const series = new Map<string, number[]>()
  for (const row of rows) {
    const value = flowValue(row, metric)
    if (!value && row.direction !== metric) continue
    const index = Math.floor((row.time - from) / size)
    if (index < 0 || index >= length) continue
    const key = row[group]
    if (!series.has(key)) series.set(key, Array<number>(length).fill(0))
    series.get(key)![index]! += value
  }
  return {
    times: Array.from({ length }, (_, i) => from + i * size),
    series: [...series].map(([key, values]) => ({ key, values })),
  }
}
export function walletBalances(
  rows: LedgerTransfer[],
  opening: OpeningBalance[],
  query: AnalyticsQuery,
  at: number,
) {
  const balances = new Map<string, number>()
  for (const row of opening) {
    if (
      query.platforms.includes(row.platform) &&
      query.chains.includes(row.chain) &&
      query.tokens.includes(row.token)
    ) {
      const key = `${row.platform}:${row.chain}`
      balances.set(key, (balances.get(key) ?? 0) + row.usd)
    }
  }
  for (const row of rows) {
    if (row.time >= at || !matchTransfer(row, query)) continue
    const key = `${row.platform}:${row.chain}`
    balances.set(key, (balances.get(key) ?? 0) + flowValue(row, 'net'))
  }
  return [...balances].map(([key, usd]) => {
    const [platform, chain] = key.split(':')
    return { platform: platform!, chain: chain!, usd }
  })
}
export function wallets(rows: LedgerTransfer[], first: Map<string, number>, from: number) {
  const result = new Map<
    string,
    {
      wallet: string
      chain: string
      platform: string
      amount: number
      deposits: number
      isNew: boolean
    }
  >()
  for (const row of rows) {
    if (row.direction !== 'deposit') continue
    const value = result.get(row.wallet) ?? {
      wallet: row.wallet,
      chain: row.chain,
      platform: row.platform,
      amount: 0,
      deposits: 0,
      isNew: (first.get(`deposit:${row.wallet}`) ?? -Infinity) >= from,
    }
    value.amount += row.usd
    value.deposits++
    result.set(row.wallet, value)
  }
  return [...result.values()]
}
export function dailyRecords(rows: LedgerTransfer[]) {
  const records = new Map<
    string,
    {
      platform: string
      date: string
      deposits: number
      withdrawals: number
      count: number
      wallets: Set<string>
    }
  >()
  for (const row of rows) {
    if (row.direction === 'internal') continue
    const date = new Date(row.time + day / 3).toISOString().slice(0, 10)
    const key = `${row.platform}:${date}`
    const value = records.get(key) ?? {
      platform: row.platform,
      date,
      deposits: 0,
      withdrawals: 0,
      count: 0,
      wallets: new Set<string>(),
    }
    if (row.direction === 'deposit') {
      value.deposits += row.usd
      value.count++
      value.wallets.add(row.wallet)
    } else value.withdrawals += row.usd
    records.set(key, value)
  }
  return [...records.values()].map((row) => ({
    ...row,
    unique: row.wallets.size,
    net: row.deposits - row.withdrawals,
  }))
}
