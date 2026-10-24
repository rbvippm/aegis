import type {
  PlatformBinding,
  ProfileTicket,
  SettlementRecord,
  ProfileNotice,
} from '@/features/profile/types'
// Standalone design examples; never used to infer a real identity, balance or eligibility.
export const profileBindings: PlatformBinding[] = [
  { id: 'A', name: '平台 A', uid: '2468128', eligibility: 'verified' },
  { id: 'B', name: '平台 B', uid: '8921368', eligibility: 'pending' },
  { id: 'C', name: '平台 C', uid: '', eligibility: 'unbound' },
]
export const profileSettlements: SettlementRecord[] = [
  {
    id: 'record-3',
    platform: 'B',
    label: '本期返水',
    cents: 12850,
    status: 'pending',
    date: '10/24 12:00',
  },
  {
    id: 'record-2',
    platform: 'A',
    label: '平台结算记录',
    cents: 38000,
    status: 'settled',
    date: '10/20 15:30',
  },
  {
    id: 'record-1',
    platform: 'A',
    label: '平台结算记录',
    cents: 180000,
    status: 'settled',
    date: '10/12 16:00',
  },
]
export const profileTickets: ProfileTicket[] = [
  {
    id: 'AE-0108',
    platform: 'B',
    category: '出金进度咨询',
    description: '请补充申请时间与链上交易记录。',
    status: 'materials',
    date: '10/24 14:20',
    example: true,
    evidence: [],
  },
  {
    id: 'AE-0103',
    platform: 'A',
    category: '奖励资格核验',
    description: '已收到资料，等待核验反馈。',
    status: 'processing',
    date: '10/23 16:45',
    example: true,
    evidence: [],
  },
]
export const profileNotices: ProfileNotice[] = [
  {
    id: 'notice-ticket',
    title: '工单待补充材料',
    description: '平台 B 出金进度咨询。',
    type: 'ticket',
    read: false,
    target: 'tickets',
  },
  {
    id: 'notice-platform',
    title: '奖励资格待验证',
    description: '绑定 UID 不代表奖励资格已经通过。',
    type: 'platform',
    read: false,
    target: 'earnings',
  },
  {
    id: 'notice-system',
    title: '欢迎使用个人中心',
    description: '账户与收益可在这里查看。',
    type: 'system',
    read: true,
    target: '',
  },
]
