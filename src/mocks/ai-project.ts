import { recommendationAnswer, monitorReportAnswer } from './ai-recommendations'
import { capabilityAnswer, resolveCapability } from './ai-business'
import type {
  AiBusinessContext,
  ChatAnswer,
  ProjectReport,
  ProjectScenario,
} from '@/features/ai/conversation-types'
import { sportsMatches, sportsMovements } from './sports'
import { vipOffers, agentPolicies, serviceSnapshot } from './services'
import { formatOdds, bestPrice } from '@/features/sports/logic'
import { findOpportunities } from '@/features/home/overview'

export function resolveProjectScenario(text: string): ProjectScenario | undefined {
  // Keep the separate Villa/City fixture in its own existing answer contract.
  if (
    /维拉|曼城/.test(text) &&
    !sportsMatches.some((m) => text.includes(m.home) || text.includes(m.away))
  )
    return
  if (
    /vs|对阵|.{2,12}对(?!比|冲|账|应).{2,12}(?:怎么看|赔率|报价|推荐|比赛)/i.test(text) &&
    !sportsMatches.some((m) => text.includes(m.home) || text.includes(m.away)) &&
    !/维拉|曼城/.test(text)
  )
    return
  if (
    /推荐|优先了解|候选|怎么选|选哪家/.test(text) &&
    /平台|盾牌|资金活跃/.test(text) &&
    !/赔率|报价|VIP|代理|套餐/.test(text)
  )
    return 'recommendation'
  const capability = resolveCapability(text)
  if (capability) return capability
  if (/整理.*(材料|事实)|工单|维权|卡款|申诉/.test(text)) return 'tickets'
  if (/UID|奖励资格|绑定|返水资格/i.test(text)) return 'binding'
  if (/代理|佣金|场馆费|锁佣|扣费|团队/.test(text)) return 'agents'
  if (/VIP|Lossback|待遇|返现条款/i.test(text)) return 'vip'
  if (/滚球|水位变化|盘口变化|盘口变动|变动提醒/.test(text)) return 'movements'
  if (/套利|对冲|分配试算|预算分配/.test(text)) return 'arbitrage'
  if (sportsMatches.some((m) => text.includes(m.home) || text.includes(m.away)))
    return /报价|哪家|比价|赔率/.test(text) ? 'odds' : 'match'
  if (/同盘口|赔率|平台排名|报价/.test(text)) return 'odds'
  if (
    /哪家.*(出金|稳定)|热钱包|盾牌|纯净度|资金异动|储备|平台.*(评级|风险|出金)|监测|出入金/.test(
      text,
    )
  )
    return 'monitor'
}
const followups: Record<ProjectScenario, string[]> = {
  match: ['比较这场同盘口报价', '这场比赛有哪些待确认项？'],
  odds: ['为什么过期报价不能参与排名？', '查看平台综合评级'],
  arbitrage: ['试算费用和限额应该怎么核对？', '查看当前滚球变化'],
  movements: ['这些变化能说明什么？', '比较同盘口报价'],
  monitor: [
    '这些平台应该先核对哪些风险？',
    '按盾牌分推荐值得优先了解的平台',
    '查看这些平台近7天资金表现',
  ],
  recommendation: ['为什么这些平台排在前面？', '改按资金活跃度推荐', '查看候选平台近30天资金表现'],
  vip: ['对比两家 VIP 的流水和封顶', '应该如何选择 VIP 方案？'],
  agents: ['按净收益 10000U 试算佣金', '代理合作如何核对锁佣条款？'],
  tickets: ['帮我列一份工单材料清单', '整理一份出金进度咨询模板'],
  analytics: ['比较平台 A 与平台 B 近30天资金表现', '查看我关注平台的近7天异常动态'],
  activity: ['帮我关注平台 A，接收异常消息', 'S级纯净度和盾牌分有什么区别？'],
  following: ['查看我关注平台的近7天异常动态', '帮我把平台异常消息标为已读'],
  invitation: ['邀请链接和邀请码有什么区别？', '帮我邀请好友，并分享到 Telegram'],
  efficiency: ['S级纯净度和盾牌分有什么区别？', '比较平台 A 与平台 B 近30天资金表现'],
  binding: ['为什么绑定 UID 不等于奖励开通？', '帮我整理出金进度咨询的事实和材料，不要自动提交'],
}
export function projectFollowup(text: string, previous?: ChatAnswer): ProjectScenario | undefined {
  return previous?.project && previous.followups.includes(text.trim())
    ? (resolveProjectScenario(text) ?? previous.project.scenario)
    : undefined
}
export function mockProjectAnswer(
  scenario: ProjectScenario,
  text: string,
  context?: AiBusinessContext,
): ChatAnswer {
  if (scenario === 'recommendation') return recommendationAnswer(text, context)
  if (scenario === 'monitor') return monitorReportAnswer(text)
  const capability = capabilityAnswer(scenario, text, context)
  if (capability) return { ...capability, followups: [...followups[scenario]] }
  const event =
    sportsMatches.find((m) => text.includes(m.home) || text.includes(m.away)) ??
    sportsMatches.find((m) => m.id === 'harbor-mountain')!
  const market =
    event.markets.find((m) => text.includes(m.line)) ??
    event.markets.find((m) => /大小球|大小分|总进球|总分/.test(text) && m.kind === 'total') ??
    event.markets.find((m) => /胜负|主胜|客胜/.test(text) && m.kind === 'winner') ??
    event.markets[0]!
  const side = /客队|客胜|小球|小分/.test(text) ? ('away' as const) : ('home' as const)
  const selection = market.selections[side === 'home' ? 0 : 1]
  const sportLabel = event.sport === 'football' ? '足球' : '篮球'
  const defaultReport: ProjectReport = {
    scenario,
    title: '数据解读',
    scope: '当前固定记录',
    takeaway: '先比较同一口径，再核验限制。',
    reasons: [],
    plan: [],
    caveat: '固定样例用于体验分析流程，真实服务尚未接入。',
    actions: [],
    details: [],
  }
  const r = defaultReport
  let snapshot = serviceSnapshot
  if (scenario === 'match' || scenario === 'odds') {
    snapshot = '2026-10-24 · 固定赛事记录 · UTC+8'
    const best = bestPrice(market, side)
    const leaders = market.quotes
      .filter((q) => q.status === 'active' && q[side] === best)
      .map((q) => `平台 ${q.platform}`)
      .join('、')
    const excluded = market.quotes
      .filter((q) => q.status !== 'active')
      .map((q) => `平台 ${q.platform}${q.status === 'stale' ? '已过期' : '暂停报价'}`)
      .join('，')
    r.title = `${event.home} vs ${event.away}`
    r.scope = `${event.league} · ${sportLabel} · ${event.stage} · ${market.scope} · ${market.line}`
    r.takeaway =
      scenario === 'match'
        ? `${event.home}当前 ${event.score}，已知比分只能描述比赛进程，不能直接推出下一阶段胜率。建议先比较同盘口有效报价，再核对比赛时间和阵容。`
        : `在${selection}这一侧，${leaders}的港盘 ${formatOdds(best, 'HK')} 为当前有效样例中的较优价格。${excluded}，均不参与比较。`
    r.reasons = [
      {
        title: '比分与盘口分开看',
        text: `当前记录 ${event.score}，盘口为 ${market.line}，结算范围为${market.scope}。比分领先不等于让球或让分一定获胜。`,
      },
      {
        title: '价格优势来自同一市场',
        text: `平台 A 港盘 ${formatOdds(market.quotes[0]![side], 'HK')}，平台 B ${formatOdds(market.quotes[1]![side], 'HK')}。仅比较相同方向、时段和结算规则，不把另一侧报价混入排序。`,
      },
      {
        title: '不补造基本面',
        text: '本项目未提供本场首发、伤停、射门、控球和历史交锋，不能据此编造战术优势或胜率。当前结论以规则解释和报价比较为主。',
      },
    ]
    r.table = {
      title: `同盘口${selection}报价`,
      columns: ['平台', '港盘', '参与比较'],
      rows: market.quotes.map((q) => [
        `平台 ${q.platform}`,
        formatOdds(q[side], 'HK'),
        q.status === 'active' ? '有效' : q.status === 'stale' ? '过期排除' : '暂停排除',
      ]),
    }
    r.plan = [
      `优先核验${leaders}的当前价格与可用限额，而非仅看最高名义报价。`,
      `确认${market.scope}与${market.line}后再比较；行情过期时重新取价。`,
      '若需资金参考，进入平台监测单独核对纯净度、余额和出款样本。',
    ]
    r.caveat = '缺少首发、伤停及连续比赛统计，不输出确定胜负或保证盈利。滚球报价可能迅速失效。'
    r.actions = [
      { label: '打开本场完整对比', to: `/compare?view=odds&match=${event.id}&market=${market.id}` },
      { label: '查看平台出金监测', to: '/monitor' },
    ]
    r.details = [
      {
        title: '样例范围',
        text: `${event.home}与${event.away}是项目固定赛事，并非真实实时赛程。比分、时钟和报价来自同一份固定记录。`,
      },
      {
        title: '结算说明',
        text:
          market.kind !== 'handicap'
            ? `本次比较${market.label}、${selection}，需核对${market.scope}、${market.line}及完整结果覆盖；不套用让球或让分的结算规则。`
            : event.sport === 'football'
              ? '主队 -0.5：主队获胜才赢，平局或失利输。全场90分钟与含加时市场不能混比。'
              : '主队 -3.5：计入加时后需净胜4分或以上才赢；净胜3分或以下、打平或失利不赢此选项。',
      },
    ]
  } else if (scenario === 'arbitrage') {
    const opportunity = findOpportunities(sportsMatches)[0]!
    r.title = '平台价差与预算分配'
    r.scope = `${opportunity.match.home} vs ${opportunity.match.away} · ${opportunity.market.scope} · ${opportunity.market.label}`
    r.takeaway =
      '当前样例存在完整双结果的理论价差，但费用、限额和执行时差未确认，不能将其直接视为可执行净收益。'
    r.reasons = [
      {
        title: '覆盖两项完整结果',
        text: '样例采用篮球全场含加时的主胜与客胜，属于互斥且完整的两个结果。足球胜平负若缺平局不适用。',
      },
      {
        title: '只使用有效价格',
        text: '主胜取平台 A 十进制 2.10，客胜取平台 B 2.10；暂停、过期和不同盘口不能混算。',
      },
    ]
    r.table = {
      title: '1000 USDT 理论分配',
      columns: ['方向', '平台 / 十进制', '分配'],
      rows: [
        ['主胜', 'A / 2.10', `${opportunity.result.stakes[0]!.toFixed(2)} U`],
        ['客胜', 'B / 2.10', `${opportunity.result.stakes[1]!.toFixed(2)} U`],
        ['理论毛差额', '未计费用', `${opportunity.result.gross.toFixed(2)} U`],
      ],
    }
    r.plan = [
      '逐一确认两侧实际限额、余额、最小金额与报价有效期。',
      '核对手续费、场馆费、结算规则与异常订单条款，再核算净值。',
      '若某一侧降价、暂停或无法确认，不沿用旧试算。',
    ]
    r.caveat = '不提供自动下注或下单；当前预算仅为数学试算，净收益待核算。'
    r.actions = [
      {
        label: '打开机会核验与试算',
        to: `/compare?view=arbitrage&match=${opportunity.match.id}&market=${opportunity.market.id}&panel=opportunity`,
      },
    ]
    r.details = [
      {
        title: '计算口径',
        text: '按两侧十进制赔率倒数的归一化比例分配预算，再以最小返还额减预算计算理论毛差额；按分取整，未计费用。',
      },
      {
        title: '费用与执行风险',
        text: '限额不足、赔率滑移、两边规则不一致和订单取消都可能破坏覆盖。费用未知时不能输出确定净收益。',
      },
    ]
  } else if (scenario === 'movements') {
    r.title = '滚球盘口与水位变化'
    r.scope = '北辰队 vs 南岳队 · 固定事件记录 · 港盘'
    r.takeaway =
      '平台 A 主队水位由 0.94 降至 0.90，盘口由主让 -2.5 调整至 -3.5；价格和让分门槛是两种变化，不能把它们当成同一报价走势。'
    r.reasons = [
      {
        title: '水位下降',
        text: '同盘口水位降低意味着单位本金对应的盈利倍数降低，不能仅凭这一点认定主队必胜。',
      },
      {
        title: '盘口变化',
        text: '主让加深要求更多净胜分才能赢盘。对比前后报价时必须同时记录盘口线与结算时段。',
      },
      { title: '暂停排除', text: '平台 C 暂停报价，等待恢复，不用暂停价参与最优价计算。' },
    ]
    r.table = {
      title: '变动记录',
      columns: ['类型', '变化', '时间'],
      rows: sportsMovements.map((m) => [m.type, m.description, m.time]),
    }
    r.plan = [
      '同时关注盘口、价格和报价状态，不把单次变动解读为确定方向。',
      '在对比页按平台、方向和阈值设置本机提醒。',
      '提醒目前只保存本机偏好，不会真实推送 TG 或邮箱。',
    ]
    r.actions = [{ label: '查看滚球变化与提醒', to: '/compare?panel=movements&match=north-south' }]
    r.details = [
      {
        title: '记录范围',
        text: '三条变动均来自项目篮球赛事固定记录，不代表当前真实市场或连续盘口曲线。',
      },
    ]
  } else if (scenario === 'vip') {
    r.title = 'VIP 待遇与条款对比'
    r.scope = '平台 A / B · Lossback、返水、封顶与流水'
    r.takeaway =
      '平台 B 的10%高于平台 A 的8%，但周期、上限和流水条件不同。不能只看名义返现比例，需按自己的同一损失区间和使用周期比较实际权益。'
    r.reasons = [
      {
        title: '返现周期不同',
        text: 'A按月8%、封顶2000U；B按周10%、封顶1000U。周周期不能直接乘四作为月度保证收益。',
      },
      {
        title: '兑现条件不同',
        text: 'A要求1倍流水；B要求3倍流水，且有部分场馆与玩法排除。更高的名义比例可能伴随更高兑现门槛。',
      },
      {
        title: '日返水另算',
        text: 'A为0.8%、B为0.6%，需先确认有效投注定义、可叠加权益与结算条件。',
      },
    ]
    r.table = {
      title: 'VIP方案',
      columns: ['平台 / 等级', 'Lossback / 封顶', '日返水 / 流水'],
      rows: vipOffers.map((o) => [
        `${o.name} / VIP${o.level}`,
        `${o.lossback}% / ${o.period} / ${o.cap}U`,
        `${o.cashback}% / ${o.id === 'A' ? '1' : '3'}倍`,
      ]),
    }
    r.plan = [
      '偏重较低流水门槛时先了解 A；偏重周结返现时可比较 B，并核对实际可兑金额。',
      '将适用场馆、排除玩法、封顶和有效期加入同一比较表。',
      '可保存匿名需求后自主比较；当前需求不会发送给真实平台。',
    ]
    r.actions = [{ label: '打开 VIP 完整条款与方案', to: '/me?section=vip' }]
    r.details = vipOffers.map((o) => ({
      title: `${o.name}完整条款摘录`,
      text: `VIP ${o.level}；${o.period}Lossback ${o.lossback}%，上限${o.cap}U，日返水${o.cashback}%。${o.rollover}。`,
    }))
  } else if (scenario === 'agents') {
    r.title = '代理佣金与扣减解读'
    r.scope = '净收益10,000U · 其他扣减为0 · 同一计算示例'
    r.takeaway =
      '在同一净收益和零其他扣减前提下，平台 A 试算3680U、B为3960U，B高280U；但B有负盈利结转和额外扣减条款，不能据此认定实际应收一定更高。'
    r.reasons = [
      {
        title: '先扣场馆费，再计算佣金',
        text: 'A：10000 × (1−8%) × 40% = 3680U；B：10000 × (1−12%) × 45% = 3960U。不能直接用10000乘返佣率。',
      },
      {
        title: '结算及跨期差异',
        text: 'A周结、不结转负盈利；B日结、存在负盈利结转。实际返佣需要带入跨期条件，当前示例未计。',
      },
      {
        title: '锁佣条件需要书面核验',
        text: 'A争议订单对应佣金可冻结7日；B异常流量可暂停当期结算，复核周期需另行约定。没有真实履约样本，不给信誉高分。',
      },
    ]
    r.table = {
      title: '佣金政策',
      columns: ['平台', '佣金 / 场馆费', '周期 / 负盈利结转'],
      rows: agentPolicies.map((p) => [
        p.name,
        `${p.commission}% / ${p.venueFee}%`,
        `${p.settlement === 'daily' ? '日结' : '周结'} / ${p.carryover ? '有' : '无'}`,
      ]),
    }
    r.plan = [
      '统一净收益定义、扣费次序、支付费、活动费和跨期负盈利。',
      '把锁佣范围、复核周期和证据要求写入明确条款。',
      '到代理页输入自己的数据重新试算；不自动提交团队资料或发起真实竞价。',
    ]
    r.actions = [{ label: '打开代理政策与试算', to: '/me?section=agents' }]
    r.details = agentPolicies.map((p) => ({
      title: `${p.name}扣减与锁佣`,
      text: `其他扣减：${p.deductions}。${p.lockTerms}`,
    }))
  } else if (scenario === 'tickets') {
    r.title = '出金咨询与工单材料整理'
    r.scope = '私密工单 · 先核实事实 · 用户确认后保存草稿'
    r.takeaway =
      '建议把“申请时间—平台状态—链上记录—当前诉求”整理成一条时间线，再附必要证据。缺少的事实留空，不替用户编造金额、交易哈希或平台答复。'
    r.reasons = [
      {
        title: '明确测量起点',
        text: '分别记录申请出款、平台审核完成、广播交易及到账时刻，避免把链上确认时间当作全流程耗时。',
      },
      {
        title: '区分平台卡款与链上延迟',
        text: '有交易哈希则核对链和地址；没有哈希时先确认平台是否已广播，不能直接认定资金丢失。',
      },
    ]
    r.table = {
      title: '材料清单',
      columns: ['材料', '填写内容'],
      rows: [
        ['基本信息', '平台、脱敏UID、链、资产、金额'],
        ['时间线', '申请时间、当前状态、历次沟通时间'],
        ['资金证据', '交易哈希或平台申请截图；未知填待补充'],
        ['诉求', '请求核实审核/广播进度与预计处理方式'],
      ],
    }
    r.plan = [
      '模板：我于【时间/时区】在【平台】申请【金额/资产/链】出款，当前显示【状态】，交易哈希为【待补充】，希望核查【具体进度】。',
      '上传前遮盖无关身份和地址；不要提供密码、验证码、助记词或私钥。',
      '工单支持最多5个文件、单个10MB内的PNG/JPEG/WebP/PDF；当前只保留文件元数据和本地草稿，不上传、不代为提交。',
    ]
    r.actions = [{ label: '前往我的工单整理草稿', to: '/me?section=tickets' }]
    r.details = [
      {
        title: '处理边界',
        text: 'AI仅提供可编辑的整理建议，不代表已联系平台、发起仲裁或承诺赔付。工单与证据默认私密。',
      },
    ]
  } else {
    r.title = 'UID、奖励资格与记录核对'
    r.scope = '绑定身份与权益验证分别处理'
    r.takeaway =
      'UID 已绑定只表示保存了平台账号标识，不代表专属渠道归属、奖励资格或返水已经开通。修改UID后，奖励资格需重新验证。'
    r.reasons = [
      {
        title: '第一步核对 UID',
        text: '核对平台名称与UID原始值，避免昵称与UID混淆。对外截图使用脱敏标识。',
      },
      {
        title: '第二步核对资格',
        text: '确认专属代码归属、活动时间、历史绑定限制与有效投注口径；资格以核验结果为准。',
      },
      {
        title: '第三步核对收益记录',
        text: '待结算与已结算分开；个人中心仅展示记录，由平台或人工站外结算，不是可提现的平台钱包余额。',
      },
    ]
    r.plan = [
      '打开收益与绑定，逐平台核对UID及资格状态。',
      '资格待验证时补齐必要资料，不因客户端保存就标记通过。',
      '需要咨询时生成私密工单草稿，人工核对后再处理。',
    ]
    r.actions = [
      { label: '打开收益与绑定', to: '/me?section=earnings' },
      { label: '查看结算记录', to: '/me?section=earnings&tab=records' },
    ]
    r.details = [
      {
        title: '本地处理范围',
        text: '当前绑定和资格为本地样例，未完成真实认证或后台核验。不会读取或复制其他真实平台账号，也不执行资金操作。',
      },
    ]
  }
  return {
    kind: 'project',
    project: r,
    summary: r.takeaway,
    followups: [...followups[scenario]],
    sources: [
      {
        id: `project-${scenario}`,
        title: `${r.title} · 项目数据`,
        type: '项目固定数据 / 规则摘录',
        excerpt: [r.scope, ...r.reasons.map((x) => `${x.title}：${x.text}`)].join('\n'),
        asOf: snapshot,
        status: 'mock · 非实时外部服务',
      },
    ],
  }
}
