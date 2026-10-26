import type { AiBusinessContext, ChatAnswer, ProjectReport } from '@/features/ai/conversation-types'
import { readMonitorQuery, monitorScope, monitorTarget } from '@/features/ai/monitor-query'
import { monitoringPlatforms } from './monitoring-platforms'
import { researchSnapshot } from './monitoring-research'
import { analyticsAsOf, analyticsLedger, analyticsOpening } from './monitoring-analytics'
import {
  firstActivity,
  selectTransfers,
  summarize,
  walletBalances,
  duration,
  money,
} from '@/features/monitoring/analytics-model'
export function recommendationAnswer(
  text: string,
  context: AiBusinessContext = { follows: [], platformUnread: 0 },
): ChatAnswer {
  const scope = /关注/.test(text)
    ? monitoringPlatforms.filter((p) => context.follows.includes(p.id))
    : monitoringPlatforms
  const parsed = readMonitorQuery(
      text,
      scope.map((p) => p.id),
    ),
    q = parsed.query
  const unknown = q.platforms.filter((id) => !monitoringPlatforms.some((p) => p.id === id))
  const goal = /资金活跃|存款(?:额|规模)|入金(?:规模|活跃)/.test(text) ? 'deposits' : 'rating'
  const candidates = scope.filter((p) => q.platforms.includes(p.id))
  const first = firstActivity(analyticsLedger)
  const values = candidates.map((p) => {
    const own = { ...q, platforms: [p.id] },
      records = selectTransfers(analyticsLedger, own, analyticsAsOf),
      stats = summarize(records, first, analyticsAsOf - duration(q.period))
    return {
      p,
      stats,
      available: analyticsOpening.some(
        (r) => r.platform === p.id && q.chains.includes(r.chain) && q.tokens.includes(r.token),
      ),
    }
  })
  const eligible = values.filter((r) => (goal === 'rating' ? r.p.score !== null : r.available))
  const ranked = [...eligible]
    .sort(
      (a, b) =>
        (goal === 'rating' ? b.p.score! - a.p.score! : b.stats.deposits - a.stats.deposits) ||
        a.p.id.localeCompare(b.p.id),
    )
    .slice(0, 3)
  const unsupportedGoal =
    /出金|出款|到账|提现|速度/.test(text) && !/盾牌|资金活跃|存款额|存款规模/.test(text)
      ? '当前实测未按同链、同币种和同金额档完整拆分，不能直接按到账速度推荐平台。可先查看出款观测，明确测量条件后再比较。'
      : undefined
  const issue =
    parsed.issue ??
    unsupportedGoal ??
    (unknown.length ? `没有平台 ${unknown.join('、')} 的记录，不能替换成其他平台。` : undefined)
  const excluded = values
    .filter((r) => !eligible.includes(r))
    .map((r) => `${r.p.name}：${goal === 'rating' ? '评分样本不足' : '当前链与币种缺少台账覆盖'}`)
  const r: ProjectReport = {
    scenario: 'recommendation',
    title: '平台候选与推荐依据',
    scope: monitorScope(q),
    query: q,
    recommendationGoal: goal,
    takeaway: '',
    reasons: [],
    plan: [],
    actions: [],
    details: [],
    caveat: '候选排序用于查看与核验，不是资金安全保证、收益承诺或自动开户建议。',
  }
  r.takeaway =
    issue ??
    (!candidates.length
      ? '当前没有符合范围的平台。请先关注平台，或改为查看全部平台。'
      : !ranked.length
        ? '当前范围没有满足排序条件的平台，暂不推荐。'
        : `按${goal === 'rating' ? '综合盾牌分' : '同窗口存款额'}排序，建议先了解${ranked.map((row) => row.p.name).join('、')}。${goal === 'deposits' ? '这是资金活跃度排序，不代表更安全。' : '综合评分与资金流向、出款效率分别核验。'}`)
  if (!issue)
    r.recommendations = ranked.map(({ p, stats }, i) => ({
      platform: p.id,
      name: p.name,
      badge: i === 0 ? '优先了解' : '备选对照',
      reason:
        goal === 'rating'
          ? `盾牌分 ${p.score}/10，${p.grade ?? '待检测'}级纯净度；${p.flowPercent !== null && p.flowPercent <= -25 ? '存在净流出观察信号，先核验异动来源。' : '仍需查看完整评级证据与资金快照。'}`
          : `${q.period} 存款 ${money(stats.deposits)}，${stats.net >= 0 ? '净流入' : '净流出'} ${money(Math.abs(stats.net))}；${stats.net < 0 ? '继续核验出款去向，不直接判定为违约。' : '净流入不能替代负债或偿付数据。'}`,
      facts: [
        { label: '盾牌分', value: p.score === null ? '样本不足' : `${p.score}/10` },
        { label: `${q.period} 存款`, value: money(stats.deposits) },
      ],
      to: monitorTarget(q, p.id),
    }))
  r.reasons = [
    {
      title: '先说明推荐目标',
      text:
        goal === 'rating'
          ? '当前以已有综合盾牌分降序列出至多3家，评分缺失不补零、不参与排序。可继续追问“改按资金活跃度推荐”。'
          : '同平台范围、同链、同币种、同窗口的存款额降序比较；内部转账剔除，不把存款规模等同客户数或偿付能力。',
    },
    {
      title: '哪些内容仍待核验',
      text: '缺少平台负债、连续失败订单与真实实时服务，不能据此断言平台绝对安全。出款均值与中位数不是同一口径，未拆分链币种的实测不参与跨链推荐。',
    },
  ]
  r.details = [
    {
      title: '未参与排序',
      text:
        issue ??
        (excluded.length ? excluded.join('；') : '当前候选范围没有因该排序规则被排除的平台。'),
    },
    {
      title: '时间口径',
      text: `资金台账为10/25 20:00 UTC+8；评级记录为 ${researchSnapshot}。两个来源分别展示，不冒充同一实时观测。`,
    },
  ]
  r.plan = [
    '先查看候选平台详情，核对分数依据、地址清单和资金动态。',
    '再比较自己的使用条件；需要到账数据时指定链、币种、金额档和统计窗口。',
    '确认值得继续观察后再关注，异常提醒进入站内消息。',
  ]
  r.actions =
    issue || !ranked.length
      ? [{ label: '打开平台监测重新选择', to: '/monitor' }]
      : [
          {
            label: '用同一范围打开平台对比',
            to: `${monitorTarget(q)}&compare=${ranked.map((x) => x.p.id).join(',')}`,
          },
        ]
  return {
    kind: 'project',
    project: r,
    summary: r.takeaway,
    followups: ['为什么这些平台排在前面？', '改按资金活跃度推荐', '查看候选平台近30天资金表现'],
    sources: [
      {
        id: 'recommendation-rating',
        title: '平台综合评级与纯净度',
        type: '项目评级记录',
        excerpt: `${values.map((x) => `${x.p.name}：${x.p.score ?? '评分缺失'}/10`).join('；')}。${excluded.join('；')}`,
        asOf: researchSnapshot,
        status: 'mock · 非实时外部服务',
      },
      {
        id: 'recommendation-ledger',
        title: '同范围监测台账',
        type: '链上资金固定记录',
        excerpt: `${r.scope}。与监测页共用selectTransfers与summarize，排除内部转账。${ranked.map((row) => `${row.p.name}存款 ${money(row.stats.deposits)}、出款 ${money(row.stats.withdrawals)}、净流量 ${money(row.stats.net)}`).join('；')}`,
        asOf: '10/25 20:00 UTC+8',
        status: 'mock · 非实时外部服务',
      },
    ],
  }
}
export function monitorReportAnswer(text: string): ChatAnswer {
  const parsed = readMonitorQuery(text, ['A', 'B', 'C']),
    q = parsed.query
  const platforms = monitoringPlatforms.filter((p) => q.platforms.includes(p.id))
  const unknown = q.platforms.filter((id) => !platforms.some((p) => p.id === id))
  const issue =
    parsed.issue ??
    (unknown.length ? `没有平台 ${unknown.join('、')} 的记录，不能套用平台 A/B/C。` : undefined)
  const first = firstActivity(analyticsLedger)
  const rows = platforms.map((p) => {
    const own = { ...q, platforms: [p.id] },
      stats = summarize(
        selectTransfers(analyticsLedger, own, analyticsAsOf),
        first,
        analyticsAsOf - duration(q.period),
      )
    const balance = walletBalances(analyticsLedger, analyticsOpening, own, analyticsAsOf)
    return {
      p,
      stats,
      balance: balance.length ? balance.reduce((sum, row) => sum + row.usd, 0) : null,
    }
  })
  const r: ProjectReport = {
    scenario: 'monitor',
    title: '平台出入金与风险解读',
    scope: monitorScope(q),
    query: q,
    takeaway:
      issue ??
      rows
        .map(({ p }) =>
          p.smallMinutes === null
            ? `${p.name}样本不足，暂不评分`
            : `${p.name}盾牌分 ${p.score}/10，小额平均出款 ${p.smallMinutes} 分钟、大额 ${p.largeMinutes} 分钟`,
        )
        .join('；') + '。出款效率与资金风险分别查看。',
    reasons: [
      {
        title: '平台资料与资金台账分别核对',
        text: rows
          .map(
            ({ p, stats, balance }) =>
              `${p.name}：${p.score === null ? '台账覆盖不足' : `${q.period} 存款 ${money(stats.deposits)}、出款 ${money(stats.withdrawals)}，热钱包余额 ${money(balance)}`}`,
          )
          .join('；'),
      },
      {
        title: '异动与安全结论分开',
        text: rows.some((x) => (x.p.flowPercent ?? 0) <= -25)
          ? '范围内有余额净流出达到25%的平台风险记录，应核验去向与地址标记；该记录不是资金短缺或违约证明。'
          : '当前评级记录未包含达到25%的净流出观察信号，不能因此认定没有其他风险。',
      },
    ],
    table: {
      title: '出款与资金观察',
      columns: ['平台', '小额 / 大额平均', '样本 / 纯净度'],
      rows: platforms.map((p) => [
        p.name,
        p.smallMinutes === null ? '样本不足' : `${p.smallMinutes} / ${p.largeMinutes} min`,
        `${p.samples}笔 / ${p.grade ?? '待检测'}`,
      ]),
    },
    plan: [
      '核对当前平台详情、评分依据及资金来源。',
      '出款样本未按当前链、币种拆分，不能把均值用于某条链的到账保证。',
      '需要候选平台时，可继续追问推荐目标。',
    ],
    actions: issue
      ? [{ label: '选择平台范围', to: '/monitor' }]
      : platforms.map((p) => ({ label: `查看${p.name}完整详情`, to: monitorTarget(q, p.id) })),
    details: [
      {
        title: '平均与中位数',
        text: '当前平台卡片复用平均出款耗时。首页实测中位数与旧 TRON USDT 小额记录属于另一组条件，不混合排序。',
      },
      {
        title: '记录时间',
        text: `综合评级记录 ${researchSnapshot}；资金台账 10/25 20:00 UTC+8，均为固定项目记录。`,
      },
    ],
    caveat: '样本不足时不补造评分、余额或成功率；出款快慢不代表安全评级。',
  }
  if (issue) {
    r.table = undefined
    r.reasons = [{ title: '先确认可用范围', text: issue }]
  }
  return {
    kind: 'project',
    project: r,
    summary: r.takeaway,
    followups: [
      '这些平台应该先核对哪些风险？',
      '按盾牌分推荐值得优先了解的平台',
      '查看这些平台近7天资金表现',
    ],
    sources: [
      {
        id: 'monitor-rating',
        title: '当前平台目录与评级',
        type: '项目固定评级记录',
        excerpt: rows
          .map(
            ({ p }) =>
              `${p.name} 盾牌分 ${p.score ?? '缺失'}，小额均值 ${p.smallMinutes ?? '缺失'} 分钟；${p.samples}笔样本`,
          )
          .join('；'),
        asOf: researchSnapshot,
        status: 'mock · 非实时外部服务',
      },
      {
        id: 'monitor-funds',
        title: '当前范围的资金台账',
        type: '资金快照',
        excerpt: r.scope,
        asOf: '10/25 20:00 UTC+8',
        status: 'mock · 非实时外部服务',
      },
    ],
  }
}
