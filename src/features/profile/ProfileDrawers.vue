<script setup lang="ts">
import PlatformAccountLink from '@/shared/ui/PlatformAccountLink.vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { computed, ref, watch } from 'vue'
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Clipboard,
  Database,
  FileText,
  Globe,
  Headphones,
  Info,
  LockKeyhole,
  Mail,
  Monitor,
  Send,
  ShieldCheck,
  UserRound,
} from '@lucide/vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import { dataMode } from '@/shared/api/config'
import { useProfile } from './store'
import { maskUid, validateEvidence } from './logic'
import type { EvidenceFile, ProfilePanel } from './types'
const props = defineProps<{ panel: ProfilePanel | null; platformId: string; ticketId: string }>()
const emit = defineEmits<{ close: []; open: [panel: ProfilePanel]; navigate: [section: string] }>()
const profile = useProfile()
const titles: Record<ProfilePanel, string> = {
  settings: '账户与隐私',
  identity: '个人资料',
  login: '登录与身份',
  email: '邮箱登录',
  telegram: 'Telegram 登录',
  devices: '登录设备',
  notifications: '通知渠道与偏好',
  binding: '绑定平台 UID',
  bindingInfo: '平台绑定详情',
  method: '收益与资格说明',
  ticketForm: '新建私密工单',
  ticketInfo: '工单详情与补充材料',
  feedback: '意见反馈',
  about: '关于我们',
  help: '帮助与客服',
  invite: '邀请好友',
  language: '语言',
  logout: '退出登录',
}
const title = computed(() => (props.panel ? titles[props.panel] : ''))
const platform = computed(() => profile.bindings.find((item) => item.id === props.platformId))
const ticket = computed(() => profile.tickets.find((item) => item.id === props.ticketId))
function enterPreview() {
  profile.previewIdentity = true
  emit('close')
}
function exitPreview() {
  profile.logout()
  emit('close')
}
const status = ref('')
const error = ref('')
const nickname = ref('')
const email = ref('')
const uid = ref('')
const selectedPlatform = ref('C')
watch(selectedPlatform, (id) => {
  if (props.panel === 'binding') {
    uid.value = profile.bindings.find((item) => item.id === id)?.uid ?? ''
    status.value = ''
    error.value = ''
  }
})
const ticketPlatform = ref('B')
const category = ref('出金进度咨询')
const description = ref('')
const amount = ref('')
const evidence = ref<EvidenceFile[]>([])
const supplement = ref('')
const feedbackCategory = ref('产品建议')
const feedbackContent = ref('')
const feedbackContact = ref('')
const notificationDraft = ref({ ...profile.preferences })
watch(
  () => [props.panel, props.platformId, props.ticketId],
  () => {
    status.value = ''
    error.value = ''
    nickname.value = profile.nickname
    if (props.panel === 'binding') {
      selectedPlatform.value = props.platformId
      uid.value = platform.value?.uid ?? ''
    }
    if (props.panel === 'ticketInfo') {
      supplement.value = ticket.value?.supplement ?? ''
      evidence.value = (ticket.value?.evidence ?? []).map((item) => ({ ...item }))
    }
    if (props.panel === 'ticketForm') evidence.value = []
    if (props.panel === 'notifications') notificationDraft.value = { ...profile.preferences }
  },
  { immediate: true },
)
function bind() {
  error.value = profile.bind(selectedPlatform.value, uid.value)
  if (!error.value) status.value = 'UID 已保存，奖励资格待验证。'
}
function filesChanged(event: Event) {
  const input = event.target as HTMLInputElement
  const next = Array.from(input.files ?? []).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type,
  }))
  error.value = validateEvidence(next)
  if (!error.value) evidence.value = next
  else {
    evidence.value = []
    input.value = ''
  }
}
function saveTicket() {
  const result = profile.saveTicket({
    platform: ticketPlatform.value,
    category: category.value,
    description: description.value,
    amount: amount.value,
    evidence: evidence.value,
  })
  error.value = result.error
  if (result.id) {
    status.value = '工单已保存。'
    description.value = ''
    amount.value = ''
    evidence.value = []
  }
}
function saveSupplement() {
  error.value = profile.supplement(props.ticketId, supplement.value, evidence.value)
  if (!error.value) status.value = '补充材料已保存。'
}
function saveFeedback() {
  error.value = profile.saveFeedback(
    feedbackCategory.value,
    feedbackContent.value,
    feedbackContact.value,
  )
  if (!error.value) {
    status.value = '反馈已保存。'
    feedbackContent.value = ''
    feedbackContact.value = ''
  }
}
function saveProfile() {
  if (dataMode !== 'demo' || !profile.previewIdentity) {
    error.value = '暂时无法修改账户资料。'
    return
  }
  if (!nickname.value.trim() || nickname.value.trim().length > 20) {
    error.value = '请输入 1–20 字昵称。'
    return
  }
  profile.nickname = nickname.value.trim()
  status.value = '昵称已保存。'
}
function validateEmail() {
  error.value = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : '请输入有效邮箱。'
  if (!error.value) status.value = '邮箱格式有效。'
}
function saveNotifications() {
  if (dataMode !== 'demo') {
    error.value = '暂时无法保存通知设置。'
    return
  }
  profile.preferences = { ...notificationDraft.value }
  status.value = '通知偏好已保存。'
}
async function copyUid() {
  try {
    if (!navigator.clipboard) throw new Error('Unavailable')
    await navigator.clipboard.writeText(platform.value?.uid ?? '')
    status.value = 'UID 已复制。'
  } catch {
    error.value = '当前浏览器无法复制，可手动查看绑定输入框。'
  }
}
</script>
<template>
  <BottomDrawer :open="panel !== null" :title="title" @close="emit('close')">
    <div class="pf-drawer-content">
      <template v-if="panel === 'settings'">
        <h3 class="pf-group-label">登录与绑定</h3>
        <div class="pf-setting-group">
          <button class="pf-setting-row" @click="emit('open', 'telegram')">
            <Send :size="18" /><span>Telegram</span
            ><small>{{ profile.previewIdentity ? '已关联' : '未登录' }}</small
            ><ChevronRight :size="15" />
          </button>
          <button class="pf-setting-row" @click="emit('open', 'email')">
            <Mail :size="18" /><span>邮箱登录</span
            ><small class="pf-badge pf-badge--amber">待验证</small><ChevronRight :size="15" />
          </button>
        </div>
        <p class="pf-helper">支持 Telegram 或邮箱登录。</p>
        <h3 class="pf-group-label">隐私与安全</h3>
        <div class="pf-setting-group">
          <button class="pf-setting-row" @click="emit('open', 'devices')">
            <Monitor :size="18" /><span>登录设备</span><ChevronRight :size="15" />
          </button>
          <div class="pf-setting-row">
            <LockKeyhole :size="18" /><span>工单证据</span
            ><small class="pf-badge pf-badge--green">始终私密</small>
          </div>
        </div>
        <h3 class="pf-group-label">通知设置</h3>
        <div class="pf-setting-group">
          <button class="pf-setting-row" @click="emit('open', 'notifications')">
            <Bell :size="18" /><span>通知渠道与偏好</span><small>站内 / TG / 邮箱</small
            ><ChevronRight :size="15" />
          </button>
        </div>
        <p class="pf-helper">赔率变化、平台异动、工单进度分开订阅。</p>
        <h3 class="pf-group-label">显示与帮助</h3>
        <div class="pf-setting-group">
          <button class="pf-setting-row" @click="emit('open', 'language')">
            <Globe :size="18" /><span>语言</span><small>简体中文</small
            ><ChevronRight :size="15" /></button
          ><button class="pf-setting-row" @click="emit('open', 'feedback')">
            <FileText :size="18" /><span>意见反馈</span><ChevronRight :size="15" /></button
          ><button class="pf-setting-row" @click="emit('open', 'about')">
            <Info :size="18" /><span>关于我们</span><ChevronRight :size="15" />
          </button>
        </div>
        <button
          class="pf-outline pf-wide"
          @click="emit('open', profile.previewIdentity ? 'logout' : 'login')"
        >
          {{ profile.previewIdentity ? '退出登录' : '登录' }}
        </button>
      </template>
      <template v-else-if="panel === 'identity'"
        ><div class="pf-info"><UserRound :size="18" /><span>当前账号</span></div>
        <form @submit.prevent="saveProfile">
          <label class="pf-field"
            >昵称<input v-model="nickname" maxlength="20" autocomplete="off" /></label
          ><button class="pf-primary pf-wide">保存昵称</button>
        </form>
        <button class="pf-text-button" @click="emit('open', 'settings')">
          账户与隐私<ChevronRight :size="16" /></button
      ></template>
      <template v-else-if="panel === 'login'"
        ><div class="pf-info">
          <ShieldCheck :size="18" /><span>支持 Telegram 或邮箱登录。</span>
        </div>
        <button class="pf-outline pf-wide" @click="emit('open', 'telegram')">
          <Send :size="16" />Telegram 登录说明</button
        ><button class="pf-outline pf-wide" @click="emit('open', 'email')">
          <Mail :size="16" />邮箱登录说明</button
        ><button v-if="dataMode === 'demo'" class="pf-primary pf-wide" @click="enterPreview">
          进入我的账号
        </button>
        <p class="pf-helper">登录后可查看绑定、收益和工单。</p></template
      >
      <template v-else-if="panel === 'email'"
        ><p class="pf-body-text">填写邮箱并检查格式。</p>
        <form @submit.prevent="validateEmail">
          <label class="pf-field"
            >邮箱<input
              v-model="email"
              type="email"
              maxlength="254"
              autocomplete="email"
              placeholder="name@example.com"
              required /></label
          ><button class="pf-primary pf-wide">校验邮箱格式</button>
        </form></template
      >
      <template v-else-if="panel === 'telegram'"
        ><section class="pf-card">
          <h3>Telegram 登录</h3>
          <p>登录后可同步账号、收益和工单。</p>
        </section></template
      >
      <template v-else-if="panel === 'devices'"
        ><section class="pf-empty">
          <Monitor :size="30" />
          <h3>暂无真实设备记录</h3>
          <p>暂无其他登录设备。</p>
        </section></template
      >
      <template v-else-if="panel === 'language'"
        ><section class="pf-card">
          <h3>简体中文</h3>
          <p>当前为简体中文。</p>
        </section></template
      >
      <template v-else-if="panel === 'notifications'"
        ><div class="pf-info"><Bell :size="18" /><span>选择需要接收的提醒。</span></div>
        <form @submit.prevent="saveNotifications">
          <h3 class="pf-group-label">提醒内容</h3>
          <label
            v-for="(label, key) in {
              odds: '赔率变化',
              platform: '平台异动',
              ticket: '工单进度',
              system: '系统消息',
            }"
            :key="key"
            class="pf-check-row"
            ><span>{{ label }}</span
            ><input v-model="notificationDraft[key]" type="checkbox"
          /></label>
          <h3 class="pf-group-label">外部渠道</h3>
          <label class="pf-check-row"
            ><span>Telegram</span
            ><input v-model="notificationDraft.telegram" type="checkbox" /></label
          ><label class="pf-check-row"
            ><span>邮箱</span><input v-model="notificationDraft.email" type="checkbox" /></label
          ><button class="pf-primary pf-wide">保存</button>
        </form></template
      >
      <template v-else-if="panel === 'binding'"
        ><div class="pf-info">
          <LockKeyhole :size="18" /><span>绑定 UID 后，奖励资格仍需单独核验。</span>
        </div>
        <form @submit.prevent="bind">
          <label class="pf-field"
            >平台<GlassSelect v-model="selectedPlatform">
              <option v-for="item in profile.bindings" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </GlassSelect></label
          ><label class="pf-field"
            >平台 UID<input
              v-model="uid"
              maxlength="40"
              autocomplete="off"
              placeholder="输入平台 UID"
              required
          /></label>
          <p class="pf-helper">修改 UID 后，奖励资格回到待验证。</p>
          <button class="pf-primary pf-wide">保存 UID</button>
        </form></template
      >
      <template v-else-if="panel === 'bindingInfo'"
        ><section v-if="platform" class="pf-card">
          <h3>
            {{ platform.name }}<PlatformAccountLink :platform="platform.id" :name="platform.name" />
          </h3>
          <dl class="pf-definition">
            <div>
              <dt>UID</dt>
              <dd>{{ maskUid(platform.uid) || '尚未绑定' }}</dd>
            </div>
            <div>
              <dt>奖励资格</dt>
              <dd>{{ platform.eligibility === 'verified' ? '已验证' : '待验证' }}</dd>
            </div>
            <div>
              <dt>验证方式</dt>
              <dd>待核验</dd>
            </div>
            <div>
              <dt>比例与结算规则</dt>
              <dd>以核验结果为准</dd>
            </div>
          </dl>
          <p class="pf-helper">不要求投注验证，不接收登录密码、验证码或钱包私钥。</p>
          <button v-if="platform.uid" class="pf-text-button" @click="copyUid">
            <Clipboard :size="16" />复制 UID
          </button>
        </section></template
      >
      <template v-else-if="panel === 'method'"
        ><section class="pf-card">
          <h3>收益是记录，不是钱包</h3>
          <p>
            展示待结算和已结算记录，由平台或人工在站外结算。本产品不保管资金，不提供充值或提现。
          </p>
          <p>UID 绑定、渠道奖励资格和实际结算是独立状态。比例、周期及资格未核验时显示待确认。</p>
          <p>此页展示各平台的结算记录。</p>
        </section></template
      >
      <template v-else-if="panel === 'ticketForm' || panel === 'ticketInfo'">
        <div class="pf-info">
          <LockKeyhole :size="18" /><span>请勿填写助记词、私钥或其他敏感信息。</span>
        </div>
        <section v-if="panel === 'ticketInfo' && ticket" class="pf-card">
          <h3>{{ ticket.id }} · 平台 {{ ticket.platform }}</h3>
          <p>{{ ticket.description }}</p>
          <p v-if="ticket.amount">争议金额：{{ ticket.amount }} USDT</p>
          <p v-if="ticket.supplement">补充说明：{{ ticket.supplement }}</p>
        </section>
        <form @submit.prevent="panel === 'ticketForm' ? saveTicket() : saveSupplement()">
          <template v-if="panel === 'ticketForm'"
            ><label class="pf-field"
              >涉及平台<GlassSelect v-model="ticketPlatform">
                <option v-for="id in ['A', 'B', 'C']" :key="id" :value="id">平台 {{ id }}</option>
              </GlassSelect></label
            ><label class="pf-field"
              >问题类别<GlassSelect v-model="category">
                <option
                  v-for="label in ['出金进度咨询', '奖励资格核验', '入金问题', '结算问题', '其他']"
                  :key="label"
                >
                  {{ label }}
                </option>
              </GlassSelect></label
            ><label class="pf-field"
              >问题描述<textarea
                v-model="description"
                rows="4"
                minlength="10"
                maxlength="3000"
                placeholder="请说明时间、平台、链与资产等事实，至少10字。"
                required
              ></textarea></label
            ><label class="pf-field"
              >争议金额（USDT，可选）<input
                v-model="amount"
                inputmode="decimal"
                placeholder="仅记录，不发起资金操作" /></label
          ></template>
          <label v-else class="pf-field"
            >补充描述<textarea
              v-model="supplement"
              rows="4"
              minlength="10"
              maxlength="3000"
              required
            ></textarea>
          </label>
          <label class="pf-field"
            >证据文件（可选）<input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              multiple
              @change="filesChanged"
          /></label>
          <p class="pf-helper">最多 5 个，每个 10MB 以内。请勿上传助记词、私钥或其他敏感文件。</p>
          <ul v-if="evidence.length" class="pf-file-list">
            <li v-for="(file, index) in evidence" :key="index">
              {{ file.name }}<button type="button" @click="evidence.splice(index, 1)">移除</button>
            </li>
          </ul>
          <button class="pf-primary pf-wide">
            {{ panel === 'ticketForm' ? '保存工单' : '保存补充' }}
          </button>
        </form>
        <RouterLink
          to="/ai?analyze=1&amp;q=帮我整理一份出金进度咨询需要提供的事实和材料，不要自动提交"
          class="pf-text-button"
          @click="emit('close')"
          >让 AI 整理材料<ChevronRight :size="16"
        /></RouterLink>
      </template>
      <template v-else-if="panel === 'feedback'"
        ><p class="pf-body-text">欢迎提出问题或建议。不要填写密码、验证码、私钥或完整资金信息。</p>
        <form @submit.prevent="saveFeedback">
          <label class="pf-field"
            >反馈类别<GlassSelect v-model="feedbackCategory">
              <option>产品建议</option>
              <option>界面问题</option>
              <option>数据问题</option>
              <option>其他</option>
            </GlassSelect></label
          ><label class="pf-field"
            >反馈内容<textarea
              v-model="feedbackContent"
              rows="5"
              minlength="10"
              maxlength="2000"
              required
              placeholder="请描述遇到的问题或建议，至少10字。"
            ></textarea></label
          ><label class="pf-field"
            >联系方式（可选）<input
              v-model="feedbackContact"
              maxlength="100"
              placeholder="邮箱或 Telegram 用户名"
          /></label>
          <p class="pf-helper">我们会查看你的反馈。</p>
          <button class="pf-primary pf-wide">保存反馈</button>
        </form></template
      >
      <template v-else-if="panel === 'about'"
        ><section class="pf-about">
          <Database :size="34" />
          <h3>Aegis · 御盾</h3>
          <p>看清平台，再做选择。</p>
        </section>
        <section class="pf-card">
          <h3>我们提供什么</h3>
          <p>
            通过链上资金监测、同盘口报价对比和可追溯的 AI
            分析，帮助用户理解数据与规则。不保管用户资金，不承诺收益或赔付。
          </p>
        </section>
        <button class="pf-text-button" @click="emit('open', 'feedback')">
          意见反馈<ChevronRight :size="16" />
        </button>
      </template>
      <template v-else-if="panel === 'help'"
        ><section class="pf-card">
          <h3>帮助与客服</h3>
          <p>可通过意见反馈或 Aegis AI 获取帮助。</p>
        </section>
        <button class="pf-text-button" @click="emit('navigate', 'tickets')">
          <FileText :size="18" />我的工单<ChevronRight :size="16" /></button
        ><RouterLink
          to="/ai?analyze=1&amp;q=如何核对平台UID、奖励资格和出金记录？"
          class="pf-text-button"
          @click="emit('close')"
          ><CircleHelp :size="18" />询问 Aegis AI<ChevronRight :size="16" /></RouterLink
        ><button class="pf-text-button" @click="emit('open', 'feedback')">
          <Headphones :size="18" />意见反馈<ChevronRight :size="16" /></button
      ></template>
      <template v-else-if="panel === 'invite'"
        ><section class="pf-empty">
          <Send :size="30" />
          <h3>邀请奖励</h3>
          <p>奖励以活动规则为准。</p>
        </section></template
      >
      <template v-else-if="panel === 'logout'"
        ><section class="pf-card">
          <h3>切换为游客浏览？</h3>
          <p>退出后将以游客身份浏览，昵称、UID 和草稿会被清空。</p>
        </section>
        <button class="pf-primary pf-wide" @click="exitPreview">切换为游客</button></template
      >
      <p v-if="error" class="pf-error" role="alert">{{ error }}</p>
      <p v-if="status" class="pf-feedback" role="status">{{ status }}</p>
    </div>
  </BottomDrawer>
</template>
