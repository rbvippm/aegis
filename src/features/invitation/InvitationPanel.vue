<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Copy, Download, Share2, RefreshCw, UsersRound } from '@lucide/vue'
import { useProfile } from '@/features/profile/store'
import { copyInvitation, downloadInvitation, shareInvitation } from '@/platform/share'
import { getInvitation } from './service'
import { invitationDescription, invitationLink, invitationText, invitationTitle } from './links'
import './invitation.css'
const emit = defineEmits<{ login: [] }>()
const profile = useProfile()
const code = ref(''),
  posterUrl = ref(''),
  poster = ref<File>(),
  loading = ref(false),
  rendering = ref(false),
  sharing = ref(false),
  error = ref(''),
  status = ref('')
const link = computed(() => (code.value ? invitationLink(code.value) : ''))
const nickname = computed(() => profile.nickname || 'Aegis 用户')
let generation = 0
let controller: AbortController | undefined
function clearPoster() {
  if (posterUrl.value) URL.revokeObjectURL(posterUrl.value)
  posterUrl.value = ''
  poster.value = undefined
}
async function prepare() {
  const token = ++generation
  controller?.abort()
  controller = new AbortController()
  clearPoster()
  error.value = ''
  status.value = ''
  code.value = ''
  if (!profile.previewIdentity) return
  loading.value = true
  try {
    const invitation = await getInvitation(controller.signal)
    if (token !== generation) return
    code.value = invitation.code
    loading.value = false
    rendering.value = true
    const { makeInvitationPoster } = await import('./poster')
    if (token !== generation) return
    const file = await makeInvitationPoster(code.value, nickname.value)
    if (token !== generation) return
    poster.value = file
    posterUrl.value = URL.createObjectURL(file)
  } catch (cause) {
    if (token === generation && !controller.signal.aborted)
      error.value = cause instanceof Error ? cause.message : '邀请信息暂不可用，请重试。'
  } finally {
    if (token === generation) {
      loading.value = false
      rendering.value = false
    }
  }
}
watch(() => [profile.previewIdentity, profile.nickname], prepare, { immediate: true })
onBeforeUnmount(() => {
  generation++
  controller?.abort()
  clearPoster()
})
async function copy(value: string, label: string) {
  status.value = ''
  error.value = ''
  try {
    await copyInvitation(value)
    status.value = `${label}已复制`
  } catch {
    error.value = '复制失败，请长按内容手动复制。'
  }
}
async function share() {
  if (!code.value || sharing.value) return
  error.value = ''
  status.value = ''
  sharing.value = true
  try {
    const result = await shareInvitation(
      { title: invitationTitle, text: invitationText(nickname.value, code.value), url: link.value },
      poster.value,
    )
    status.value =
      result === 'shared'
        ? '已交给系统分享'
        : result === 'unsupported'
          ? '当前浏览器不支持系统分享，可复制邀请链接或保存海报后分享。'
          : ''
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : '无法打开系统分享，请复制邀请链接或保存海报后分享。'
  } finally {
    sharing.value = false
  }
}
function save() {
  if (poster.value) {
    downloadInvitation(poster.value)
    status.value = '海报已准备下载，可在文件或下载列表中查看。'
  }
}
</script>
<template>
  <div class="pf-invite">
    <div v-if="!profile.previewIdentity" class="iv-empty">
      <UsersRound :size="30" />
      <h3>获取你的专属邀请</h3>
      <p>登录后查看个人邀请码，与朋友分享 Aegis。</p>
      <button class="iv-primary" @click="emit('login')">登录与身份</button>
    </div>
    <div v-else-if="loading" class="iv-loading" role="status">正在准备你的邀请信息…</div>
    <template v-else>
      <section v-if="code" class="iv-hero">
        <div class="iv-preview">
          <div class="iv-preview-copy">
            <span class="iv-preview-tag">专属邀请</span>
            <h3>邀请好友，<br />一起看清数据</h3>
            <p>{{ invitationDescription }}</p>
          </div>
          <img
            v-if="posterUrl"
            class="iv-poster"
            :src="posterUrl"
            :alt="`Aegis 专属邀请海报，邀请码 ${code}，扫描二维码打开邀请链接。`"
            width="1080"
            height="1350"
          />
          <div v-else class="iv-poster-placeholder" :aria-busy="rendering">
            <Share2 :size="24" /><span>{{ rendering ? '正在生成海报…' : '专属邀请海报' }}</span>
          </div>
        </div>
        <div class="iv-hero-actions">
          <button class="iv-primary" :disabled="sharing || rendering" @click="share">
            <Share2 :size="18" />{{ sharing ? '正在打开分享…' : '邀请好友' }}</button
          ><button class="iv-save" :disabled="!poster" aria-label="保存邀请海报" @click="save">
            <Download :size="18" /><span>保存海报</span>
          </button>
        </div>
      </section>
      <section v-if="code" class="iv-card iv-details" aria-label="邀请信息">
        <label class="iv-link-field"
          >邀请链接<input :value="link" aria-label="邀请链接" readonly :title="link" /><button
            aria-label="复制邀请链接"
            title="复制邀请链接"
            @click="copy(link, '邀请链接')"
          >
            <Copy :size="17" /></button
        ></label>
        <div class="iv-code-row">
          <span>专属邀请码</span><code>{{ code }}</code
          ><button aria-label="复制邀请码" title="复制邀请码" @click="copy(code, '邀请码')">
            <Copy :size="17" />
          </button>
        </div>
      </section>
      <p v-if="status" class="iv-status" role="status">{{ status }}</p>
      <div v-if="error" class="iv-error" role="alert">
        <p>{{ error }}</p>
        <button @click="prepare"><RefreshCw :size="15" />重试</button>
      </div>
    </template>
  </div>
</template>
