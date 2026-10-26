export const aiDemoGroups = ['精选', '看数据', '做分析', '帮办事'] as const
export type AiDemoGroup = (typeof aiDemoGroups)[number]
export const aiCapabilityPrompts = [
  { group: '看数据', text: '查看我关注平台的近7天异常动态' },
  { group: '看数据', text: '平台 A 近30天的存款、出款和净流量是多少？' },
  { group: '看数据', text: '比较平台 A 和平台 J 近7天 TRON USDT 存款' },
  { group: '看数据', text: '解读平台 F 的盾牌分、热钱包、纯净度与出金评级' },
  { group: '看数据', text: '哪些平台小额出款中位数在3分钟内？' },
  { group: '做分析', text: '按盾牌分推荐值得优先了解的平台' },
  { group: '做分析', text: '按资金活跃度推荐平台，说明推荐理由和风险' },
  { group: '做分析', text: '比较平台 A 与平台 B 近30天资金表现' },
  { group: '做分析', text: '帮我解读平台 B 的大鳄提款与热钱包转移' },
  { group: '做分析', text: 'S级纯净度和盾牌分有什么区别？' },
  { group: '帮办事', text: '帮我关注平台 A，接收异常消息' },
  { group: '帮办事', text: '帮我把平台异常消息标为已读' },
  { group: '帮办事', text: '帮我邀请好友，并分享到 WhatsApp 或 Telegram' },
  { group: '做分析', text: '比较 VIP 方案时，应该核对哪些条款？' },
  { group: '做分析', text: '比较代理佣金时，应该核对哪些扣费与结算条款？' },
  { group: '帮办事', text: '如何核对平台UID、奖励资格和出金记录？' },
  { group: '帮办事', text: '帮我整理出金进度咨询的事实和材料，不要自动提交' },
] as const
