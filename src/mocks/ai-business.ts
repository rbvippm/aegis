import type {
  AiBusinessContext,
  ChatAnswer,
  ProjectReport,
  ProjectScenario,
} from '@/features/ai/conversation-types'
import { readMonitorQuery, monitorScope, monitorTarget } from '@/features/ai/monitor-query'
import { analyticsAsOf, analyticsLedger, analyticsOpening } from './monitoring-analytics'
import { monitoringPlatforms } from './monitoring-platforms'
import { withdrawalObservations } from './monitoring-withdrawals'
import { median, platformActivities, preferredPlatforms } from '@/features/monitoring/activity'
import {
  duration,
  firstActivity,
  selectTransfers,
  summarize,
  walletBalances,
  money,
  dateLabel,
  type AnalyticsQuery,
} from '@/features/monitoring/analytics-model'
export function resolveCapability(text: string): ProjectScenario | undefined {
  if (/关注.*(?:比赛|赛事)|(?:比赛|赛事).*关注/.test(text)) return
  if (/邀请|邀请码|分享.*(WhatsApp|Telegram|好友)/i.test(text)) return 'invitation'
  if (/关注|取消关注|消息.*(已读|通知)|异常消息/.test(text))
    return /动态|解读|有哪些/.test(text) && !/帮我关注|取消关注|标为已读/.test(text)
      ? 'activity'
      : 'following'
  if (/中位数|S级.*盾牌|盾牌.*S级/.test(text)) return 'efficiency'
  if (/大鳄|资金转移|异常动态|大额出款/.test(text)) return 'activity'
  if (/存款|出款额|净流量|净流出|净流入|资金表现|钱包分析|独立钱包|资金流水|热钱包余额/.test(text))
    return 'analytics'
}
export function capabilityAnswer(
  scenario: ProjectScenario,
  text: string,
  context: AiBusinessContext = { follows: [], platformUnread: 0 },
): ChatAnswer | undefined {
  if (!['analytics', 'activity', 'following', 'invitation', 'efficiency'].includes(scenario)) return
  const named = [...text.matchAll(/平台\s*([a-z])(?:\b|(?=[\u4e00-\u9fff]))/gi)].map((m) =>
    m[1]!.toUpperCase(),
  )
  const missing = named.filter((id) => !monitoringPlatforms.some((p) => p.id === id))
  const preferred = /全部平台|全平台/.test(text)
    ? monitoringPlatforms
    : preferredPlatforms(monitoringPlatforms, context.follows)
  const chosen = named.length ? monitoringPlatforms.filter((p) => named.includes(p.id)) : preferred
  const first = chosen[0]
  const r: ProjectReport = {
    scenario,
    title: '平台数据与办事助手',
    scope: '10/25 20:00 UTC+8 · 项目快照',
    takeaway: '',
    reasons: [],
    plan: [],
    actions: [],
    details: [],
    caveat: '基于现有项目快照；链上分析不是安全或到账承诺。',
  }
  const events = platformActivities(analyticsLedger, monitoringPlatforms, analyticsAsOf).filter(
    (e) => chosen.some((p) => p.id === e.platform),
  )
  if (missing.length) {
    r.title = '先确认平台'
    r.takeaway = `没有平台 ${missing.join('、')} 的可用记录，不能套用其他平台的数据或操作。`
    r.reasons = [{ title: '平台范围', text: '当前监测支持平台 A 至 J，缺失记录不记作零。' }]
    r.plan = ['打开平台监测选择有记录的平台。']
    r.actions = [{ label: '选择监测平台', to: '/monitor' }]
  } else if (scenario === 'analytics') {
    const parsed = readMonitorQuery(
      text,
      chosen.map((p) => p.id),
    )
    if (parsed.issue) {
      r.title = '先确认监测范围'
      r.takeaway = parsed.issue
      r.reasons = [{ title: '保留原始条件', text: parsed.issue }]
      r.plan = ['选择当前支持的链、币种与窗口，再继续分析。']
      r.actions = [{ label: '打开监测选择范围', to: '/monitor' }]
      return {
        kind: 'project',
        project: r,
        summary: r.takeaway,
        followups: ['比较平台 A 与平台 B 近30天资金表现'],
        sources: [],
      }
    }
    const { period, chains, tokens } = parsed.query
    r.query = parsed.query
    r.title = chosen.length > 1 ? '平台资金表现对比' : `${first?.name ?? '平台'} · 资金分析`
    r.scope = monitorScope(parsed.query)
    const firsts = firstActivity(analyticsLedger)
    const rows = chosen.map((p) => {
      const q: AnalyticsQuery = {
        period,
        chains,
        tokens,
        platforms: [p.id],
      }
      const records = selectTransfers(analyticsLedger, q, analyticsAsOf)
      const stats = summarize(records, firsts, analyticsAsOf - duration(period))
      const balances = walletBalances(analyticsLedger, analyticsOpening, q, analyticsAsOf)
      return {
        p,
        stats,
        available: p.score !== null,
        balance: balances.length ? balances.reduce((sum, b) => sum + b.usd, 0) : null,
        records,
      }
    })
    r.takeaway =
      rows
        .map(({ p, stats, available }) =>
          !available
            ? `${p.name}暂无完整台账，不能作为零值参与对比`
            : `${p.name}存款 ${money(stats.deposits)}、出款 ${money(stats.withdrawals)}，${stats.net >= 0 ? '净流入' : '净流出'} ${money(Math.abs(stats.net))}`,
        )
        .join('；') + '。净流出需要结合转移去向核验，不能直接认定偿付异常。'
    r.table = {
      title: '同窗口资金指标',
      columns: ['平台', '存款 / 出款', '净流量 / 热钱包余额'],
      rows: rows.map(({ p, stats, balance, available }) => [
        p.name,
        available ? `${money(stats.deposits)} / ${money(stats.withdrawals)}` : '暂无数据',
        available ? `${money(stats.net)} / ${money(balance)}` : '暂无数据',
      ]),
    }
    r.reasons = [
      {
        title: '同源计算',
        text: '与监测资金流水共用台账、快照与聚合函数；内部转账剔除出入金。未提供负债数据，不能从余额推出储备充足率。',
      },
      {
        title: '钱包与笔数分开',
        text:
          rows
            .map(({ p, stats, available }) =>
              !available
                ? `${p.name}：样本不足`
                : `${p.name}：${stats.depositCount} 笔存款，${stats.withdrawalCount} 笔出款，${stats.uniqueDepositors} 个独立存款地址`,
            )
            .join('；') + '。地址数量不等于客户人数。',
      },
    ]
    const leaders = rows
      .filter((row) => row.available)
      .sort((a, b) => b.stats.deposits - a.stats.deposits)
    r.reasons.push({
      title: '下一步优先看什么',
      text: leaders.length
        ? `${leaders[0]!.p.name}在当前范围存款规模较高，先查看其逐笔来源及净流量，再对照其他平台；该优先顺序只反映资金活跃度。`
        : '当前缺少完整台账，先补齐来源，不给出资金活跃度排序。',
    })
    r.plan = [
      '核对同窗口资金指标，再查看逐笔流水与钱包来源。',
      '平台评分与出款耗时单独查看，不把存款多解释成安全。',
    ]
    r.actions = chosen.map((p) => ({
      label: `查看${p.name}完整资金详情`,
      to: monitorTarget(parsed.query, p.id),
    }))
  } else if (scenario === 'activity') {
    const requested = readMonitorQuery(
      text,
      chosen.map((p) => p.id),
    )
    if (
      requested.issue ||
      (/\d+\s*(?:天|d|h|小时)/i.test(text) && requested.query.period !== '7d') ||
      requested.query.chains.length < 4 ||
      requested.query.tokens.length < 6
    ) {
      const message =
        requested.issue ??
        '异常动态当前提供全链、全部币种的近7天快照，不能把其他窗口或单链筛选当作同一结果。可查看平台详情中的资金流水进行对应范围分析。'
      r.title = '先确认动态范围'
      r.takeaway = message
      r.reasons = [{ title: '保持观测口径', text: message }]
      r.plan = ['选择近7天全链动态，或进入资金流水按链、币种和窗口查看。']
      r.actions = [
        {
          label: '打开平台资金详情',
          to: chosen[0] ? `/monitor?platform=${chosen[0].id}` : '/monitor',
        },
      ]
      return {
        kind: 'project',
        project: r,
        summary: r.takeaway,
        followups: ['查看我关注平台的近7天异常动态'],
        sources: [],
      }
    }

    r.title = '平台异常动态解读'
    r.scope = `近7天 · ${chosen.map((p) => p.name).join(' / ')} · 10/25 20:00 UTC+8`
    r.takeaway = `当前范围共 ${events.length} 条动态：大鳄提款 ${events.filter((e) => e.kind === 'whale').length} 笔，热钱包转移 ${events.filter((e) => e.kind === 'transfer').length} 笔，余额异动预警 ${events.filter((e) => e.kind === 'outflow').length} 条。${named.length ? '' : context.follows.length ? '已优先使用关注平台。' : '未关注平台时使用盾牌分前三家。'}`
    r.reasons = [
      {
        title: '大鳄提款口径',
        text: '单笔链上出款 ≥ $100,000，不据此识别玩家身份或断言平台挤兑。',
      },
      {
        title: '转移与净流出分开',
        text: '已标记钱包之间的转移不计入出款额；余额净流出达到25%触发独立观察信号，需要核验地址归属和资金去向。',
      },
    ]
    r.table = {
      title: '最近动态（最多5条）',
      columns: ['平台 / 类型', '金额', '时间 UTC+8'],
      rows: events
        .slice(0, 5)
        .map((e) => [
          `${monitoringPlatforms.find((p) => p.id === e.platform)?.name} / ${e.title}`,
          money(e.usd),
          dateLabel(e.time, true),
        ]),
    }
    r.plan = [
      '先查看对应动态与来源，再决定是否关注。',
      '关注后的近24小时快照异常进入站内消息；实时链上推送尚未接入。',
    ]
    r.actions = events.slice(0, 2).map((e) => ({
      label: `查看${monitoringPlatforms.find((p) => p.id === e.platform)?.name}${e.title}`,
      to: `/monitor?platform=${e.platform}&event=${encodeURIComponent(e.id)}`,
    }))
    if (!events.length) r.actions = [{ label: '查看平台监测', to: '/monitor' }]
  } else if (scenario === 'following') {
    r.title = /已读/.test(text) ? '处理平台异常消息' : '管理平台关注'
    r.takeaway = `当前已关注 ${context.follows.length} 家平台，平台类未读消息 ${context.platformUnread} 条。下方操作由你点击后执行，提问不会自动修改关注或消息状态。`
    r.reasons = [
      {
        title: '通知范围',
        text: '大额链上出款、已标记热钱包转移和余额异动进入站内消息。取消关注停止新增提醒，保留已收到的历史消息。',
      },
      {
        title: '办理边界',
        text: '关注与已读状态在当前项目本地保存；遵循“我的”中的平台通知偏好，不启用系统通知或外部推送。',
      },
    ]
    r.plan = ['核对目标平台，然后执行下方操作。', '执行后可打开我的关注或消息中心，查看实际结果。']
    if (/已读/.test(text)) r.commands = [{ label: '将平台消息标为已读', kind: 'read-platform' }]
    else if (named.length)
      r.commands = chosen.map((p) => ({
        label: `${/取消关注/.test(text) ? '取消关注' : '关注'}${p.name}`,
        kind: /取消关注/.test(text) ? 'unfollow' : 'follow',
        platform: p.id,
      }))
    else r.plan.unshift('尚未指定要关注的平台，请继续输入“帮我关注平台 A”。')
    r.actions = [
      { label: '打开消息中心', to: '/me?section=messages' },
      { label: '查看我的平台关注', to: '/me?section=follows&tab=platforms' },
    ]
  } else if (scenario === 'invitation') {
    r.title = '邀请好友与分享助手'
    r.scope = 'Aegis · https://aegisuu.vercel.app/'
    r.takeaway =
      '可以准备专属邀请二维码海报、复制个人邀请码与邀请链接，并通过系统分享、WhatsApp 或 Telegram 发送。每位用户使用独立邀请码，分享不会计作好友注册。'
    r.reasons = [
      {
        title: '分享内容',
        text: '海报使用 Aegis 品牌、昵称、个人码与二维码，介绍链上资金监测、体育数据对比及 AI 解读；链接使用 aegisuu.vercel.app 域名。',
      },
      {
        title: '图文发送方式',
        text: '系统分享支持时可携带海报、邀请文案和链接，并在系统菜单中选择 WhatsApp 或 Telegram。最终选择联系人和发送由你操作。',
      },
    ]
    r.plan = [
      '打开邀请页，核对自己的邀请码与链接。',
      '选择复制、保存海报或系统分享；无系统分享能力时复制链接或保存海报后自行分享。',
    ]
    r.caveat = '本地示例码已独立保存；正式用户发码、注册归属与邀请统计需后端接入。'
    r.actions = [{ label: '准备我的专属邀请海报', to: '/me?panel=invite' }]
  } else {
    r.title = '出款效率与评级口径'
    r.scope = `近7天实测 · ${chosen.map((p) => p.name).join(' / ')} · 小额 <1,000 U / 大额 ≥1,000 U`
    const observations = withdrawalObservations.filter((o) =>
      chosen.some((p) => p.id === o.platform),
    )
    r.takeaway = `当前范围 ${chosen.length} 家平台中，小额出款中位数 ≤3分钟的有 ${observations.filter((o) => (median(o.small) ?? Infinity) <= 3).length} 家，大额中位数 ≤10分钟的有 ${observations.filter((o) => (median(o.large) ?? Infinity) <= 10).length} 家；S级出金纯净度 ${chosen.filter((p) => p.grade === 'S').length} 家，盾牌分 ≥9 的 ${chosen.filter((p) => (p.score ?? 0) >= 9).length} 家。`
    r.reasons = [
      {
        title: '两个评级不能混用',
        text: 'S级是出金纯净度等级，盾牌分为10分制；出款速度、纯净度与综合评分分别查看。',
      },
      {
        title: '中位数不是平均值',
        text: '中位数来自近7天已完成实测，各平台小额、大额各5笔。它与平台卡片的平均耗时是独立样本口径，不拼接排名或推断成功率。',
      },
    ]
    r.table = {
      title: '实测样本中位数',
      columns: ['平台', '小额 / 大额中位数', '样本'],
      rows: observations.map((o) => [
        monitoringPlatforms.find((p) => p.id === o.platform)!.name,
        `${median(o.small)} / ${median(o.large)} min`,
        `${o.small.length} / ${o.large.length} 笔`,
      ]),
    }
    r.plan = [
      '先核对统计金额档、样本与起止点，再理解中位数。',
      '不同链与币种未拆分，不将该结果称为某条链的出款排名。',
    ]
    r.actions = [
      { label: '查看首页出金效率与口径', to: '/' },
      { label: '打开平台监测', to: '/monitor' },
    ]
  }
  r.details = [
    ...(scenario === 'analytics'
      ? [
          {
            title: '计算口径',
            text: '存款额、出款额分别汇总符合条件的外部流水；净流量 = 存款额 − 出款额。热钱包余额由期初余额加快照前累计净流量计算，与所选窗口的净流量不是同一个量。独立钱包按地址去重，不代表独立客户。',
          },
        ]
      : []),
    {
      title: '来源与办理状态',
      text: '分析引用现有固定台账、平台风险记录、出款观测与本次本地关注状态；未连接真实模型或链上服务。操作按钮执行后单独显示结果，分析本身不代替业务办理。',
    },
  ]
  return {
    kind: 'project',
    project: r,
    summary: r.takeaway,
    followups: [],
    sources: [
      {
        id: `capability-${scenario}`,
        title: `${r.title} · 项目业务数据`,
        type: '监测台账 / 本地状态 / 功能契约',
        excerpt: [r.scope, ...r.reasons.map((x) => `${x.title}：${x.text}`)].join('\n'),
        asOf: '2026-10-25 20:00 UTC+8 · 固定资金快照；关注及未读状态为本次查询',
        status: 'mock · 非实时外部服务',
      },
    ],
  }
}
