import type { ChatAnswer, ProjectReport } from '@/features/ai/conversation-types'
import {
  planningScopeError,
  scopedPlanningMarket,
  type PlanningScope,
} from '@/features/sports/planning/ai-scope'
import type { Quote } from '@/features/sports/planning/model'
import { planningMatches, planningOperators, planningSnapshot } from './sports-planning'
import { formatOdds } from '@/features/sports/logic'

export interface PlanningAiContext extends PlanningScope {
  fixture: string
  market: string
  selection: number
}
const operatorName = (id: string) =>
  planningOperators.find((operator) => operator.id === id)?.name ?? `未标注平台（${id}）`
function excludeReason(quote: Quote, selection: number) {
  const reasons: string[] = []
  if (!quote.matched) reasons.push('结算范围未匹配')
  if (quote.status === 'stale') reasons.push('报价过期')
  if (quote.status === 'suspended') reasons.push('暂停报价')
  const price = quote.prices[selection]
  if (price == null || !Number.isFinite(price) || price <= 1) reasons.push('该选项无有效报价')
  return reasons.join('、')
}
function clarify(summary: string): ChatAnswer {
  return {
    kind: 'clarify',
    summary,
    followups: [],
    sources: [],
  }
}
/** IDs from the sports entry are validated against one fixed catalog; no default fixture or market. */
export function planningAnswer(input: PlanningAiContext): ChatAnswer {
  const scopeError = planningScopeError(input)
  if (scopeError) return clarify(scopeError)
  const fixture = planningMatches.find((row) => row.id === input.fixture)
  if (!fixture)
    return clarify('未找到这场比赛的可用记录，请返回赔率页重新选择比赛。不会套用其他赛事的数据。')
  const originalMarket = fixture.markets.find((row) => row.id === input.market)
  if (!originalMarket)
    return clarify(
      `未找到${fixture.home} vs ${fixture.away}的指定市场，请返回赔率页确认玩法、时段与盘口线。`,
    )
  const market = scopedPlanningMarket(originalMarket, input)
  const index = input.selection
  if (!Number.isInteger(index) || index < 0 || index >= market.selections.length)
    return clarify(
      '未找到指定的结果选项，请返回赔率页重新选择主客方向或对应结果。不会默认替换为主队。',
    )
  const selection = market.selections[index]!
  const eligible = market.quotes
    .filter((quote) => !excludeReason(quote, index))
    .sort((a, b) => b.prices[index]! - a.prices[index]!)
  const excluded = market.quotes.filter((quote) => excludeReason(quote, index))
  const best = eligible[0]?.prices[index] ?? null
  const leaders = best === null ? [] : eligible.filter((quote) => quote.prices[index] === best)
  const title = `${fixture.home} vs ${fixture.away}`
  const kickoff = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fixture.startsAt))
  const category =
    { all: '全部平台', crypto: '加密平台', sportsbooks: '体育平台', prediction: '预测平台' }[
      input.category ?? 'all'
    ] ?? '全部平台'
  const scope = `${fixture.league} · ${market.label} · ${market.scope} · ${market.line} · ${selection} · ${input.operator ? operatorName(input.operator) : category} · 版本 ${input.revision ?? 0}`
  const target = new URLSearchParams({
    view: 'odds',
    match: fixture.id,
    market: market.id,
    panel: 'market',
    category: input.category ?? 'all',
    operator: input.operator ?? '',
    revision: String(input.revision ?? 0),
    selection: String(index),
    ...(input.operator ? { platform: input.operator } : {}),
  })
  const report: ProjectReport = {
    scenario: 'odds',
    title,
    scope,
    takeaway:
      best === null
        ? `“${selection}”当前没有可参与比较的有效报价，不能给出较优平台或沿用旧价格。请回到对应市场核验报价。`
        : `在${market.scope}、${market.line}的“${selection}”选项中，${leaders.map((row) => operatorName(row.operator)).join('、')}以十进制 ${formatOdds(best, 'DEC')}（港盘 ${formatOdds(best, 'HK')}）并列较优或位于首位。该排序只比较价格，不代表比赛胜率、平台安全或可执行净收益。`,
    reasons: [
      {
        title: '先锁定同一比较对象',
        text: `赛事 ${fixture.id}，市场 ${market.id}，选项 ${index + 1}/${market.selections.length}：${selection}。开赛记录 ${kickoff} UTC+8，当前状态 ${fixture.stage}，比分 ${fixture.score}；这些固定记录不能当作当前实时赛况。`,
      },
      {
        title: '有效报价与排除原因分别展示',
        text: `共 ${eligible.length} 家可比较、${excluded.length} 家排除。仅使用状态有效、结算范围匹配且该结果价格完整的报价；暂停、过期、不匹配和缺失结果均不进入价格排序。`,
      },
      {
        title: '盘口解读与预测分开',
        text: `${market.rule} 当前未提供首发、伤停、近期体能、成交量或校准胜率，不据静态报价编造球队优势或确定赛果。`,
      },
    ],
    table: {
      title: `同市场“${selection}”报价`,
      columns: ['平台', '十进制 / 港盘', '排名或排除原因'],
      rows: [
        ...eligible.map((quote) => [
          operatorName(quote.operator),
          `${formatOdds(quote.prices[index] ?? null, 'DEC')} / ${formatOdds(quote.prices[index] ?? null, 'HK')}`,
          `第 ${eligible.findIndex((row) => row.prices[index] === quote.prices[index]) + 1} 名`,
        ]),
        ...excluded.map((quote) => [
          operatorName(quote.operator),
          `${formatOdds(quote.prices[index] ?? null, 'DEC')} / ${formatOdds(quote.prices[index] ?? null, 'HK')}`,
          excludeReason(quote, index),
        ]),
      ],
    },
    plan: [
      best === null
        ? '当前没有可推荐核验的价格，先回到原市场确认有效报价。'
        : `优先核验${leaders.map((row) => operatorName(row.operator)).join('、')}的当前价格、可用限额和适用费用；并列时不强行分出唯一平台。`,
      `确认${market.scope}、${market.line}与“${selection}”的结算规则一致，不拿另一时段、盘口线或结果方向补价。`,
      '需要平台资金参考时，单独查看出金样本、纯净度和评分依据；不把较优赔率当作平台安全结论。',
    ],
    caveat:
      '这里复用赔率页相同平台范围、玩法选项与快照版本的固定报价。具名平台也是项目样例，并非实际集成或实时报价；不执行下注或下单。',
    actions: [
      { label: '返回同场同市场核对', to: `/compare?${target}` },
      { label: '独立查看平台资金监测', to: '/monitor' },
    ],
    details: [
      {
        title: '多结果玩法边界',
        text: `本市场有 ${market.selections.length} 个结果：${market.selections.join(' / ')}。只解释所选结果的价格；${market.calculable ? '即使完整结果可以进行数学试算，也需另行核对费用、限额与执行时差。' : '该玩法当前不参与对冲收益试算，不输出保证盈利或套利收益。'}`,
      },
      {
        title: '来源范围',
        text: `引用 sports-planning 固定记录并应用相同的平台范围与报价场景，快照 ${planningSnapshot}。具名平台也是项目报价样例，缺失的抓取时间、真实限额与费用不能补造。`,
      },
    ],
  }
  report.sports = {
    source: 'sports',
    fixture: fixture.id,
    market: market.id,
    selection: index,
    category: input.category ?? 'all',
    operator: input.operator ?? '',
    revision: input.revision ?? 0,
  }
  return {
    kind: 'project',
    project: report,
    summary: report.takeaway,
    followups: ['为什么这些报价可以参与比较？', '这个盘口有哪些核对项？', '这份推荐还缺哪些信息？'],
    sources: [
      {
        id: `planning:${fixture.id}:${market.id}:${index}`,
        title: `${title} · ${market.label} · ${selection}`,
        type: '赔率页同范围固定报价 / 结算规则',
        excerpt: [
          scope,
          `可比较 ${eligible.length} 家，排除 ${excluded.length} 家。`,
          ...report.table!.rows.map((row) => row.join(' · ')),
        ].join('\n'),
        asOf: `2026-10-25 · ${planningSnapshot} · 版本 ${input.revision ?? 0}`,
        status: 'mock · 非实时外部服务',
      },
    ],
  }
}

export const planningSuggestions = [
  {
    text: '海港队对山城队，主队 -0.5 哪家有效报价更值得核验？',
    entry: {
      source: 'sports' as const,
      fixture: 'harbor-mountain',
      market: 'handicap',
      selection: 0,
      category: 'all',
      operator: '',
      revision: 0,
    },
  },
  {
    text: '北辰队对南岳队，总分市场的大分报价怎么选？',
    entry: {
      source: 'sports' as const,
      fixture: 'north-south',
      market: 'total',
      selection: 0,
      category: 'all',
      operator: '',
      revision: 0,
    },
  },
] as const
