<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Send } from '@lucide/vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { planningMatches, planningOperators } from '@/mocks/sports-planning'
import { useSportsTracking, type PlanningReminder } from './tracking'
import type { Fixture, Market } from './model'
const props = defineProps<{
  mode: 'settings' | 'center' | 'bot'
  fixture: Fixture
  market: Market
}>()
const store = useSportsTracking()
const editing = ref(props.mode === 'settings'),
  feedback = ref(''),
  message = ref('')
const draft = reactive<PlanningReminder>({
  id: crypto.randomUUID(),
  matchId: props.fixture.id,
  marketId: props.market.id,
  operator: 'A',
  selection: props.market.selections[0]!,
  type: 'price',
  target: '0.95',
  cooldown: '5分钟',
  window: '30秒',
  merge: true,
  enabled: true,
  telegram: false,
})
const selectedFixture = computed(() => planningMatches.find((f) => f.id === draft.matchId)!)
const selectedMarket = computed(
  () =>
    selectedFixture.value.markets.find((m) => m.id === draft.marketId) ??
    selectedFixture.value.markets[0]!,
)
function changeFixture() {
  draft.marketId = selectedFixture.value.markets[0]!.id
  draft.selection = selectedFixture.value.markets[0]!.selections[0]!
}
function changeMarket() {
  draft.selection = selectedMarket.value.selections[0]!
}
function chooseType(type: PlanningReminder['type']) {
  draft.type = type
  if (type === 'kickoff') draft.target = '15分钟'
  else if (type === 'price') draft.target = '0.95'
  else draft.target = ''
}
function save() {
  if (
    draft.type === 'price' &&
    (!Number.isFinite(Number(draft.target)) || Number(draft.target) <= 0)
  ) {
    feedback.value = '请输入有效的目标赔率。'
    return
  }
  store.save({ ...draft })
  feedback.value = '提醒设置已保存，详情已同步到消息中心。'
  editing.value = false
}
function edit(r: PlanningReminder) {
  Object.assign(draft, r)
  editing.value = true
  feedback.value = ''
}
function preview() {
  const sample = store.reminders[0] ?? draft
  store.notify(sample, true)
  message.value = `${planningMatches.find((f) => f.id === sample.matchId)!.home} vs ${planningMatches.find((f) => f.id === sample.matchId)!.away} · ${sample.selection} · ${sample.type === 'price' ? `赔率达到 ${sample.target}` : '状态变化'}。详情已同步站内消息中心。`
}
</script>
<template>
  <div class="pw-tracking">
    <template v-if="mode === 'bot'"
      ><div class="pw-bot-hero">
        <Send :size="28" />
        <h3>Telegram Bot 跟踪</h3>
        <p>把赛事、盘口与赔率提醒集中到同一会话。</p>
      </div>
      <div class="sp-setting-row">
        <span>预览关联状态</span><b>{{ store.botPreview ? '预览已关联' : '尚未配置' }}</b>
      </div>
      <button class="sp-primary sp-full" @click="store.botPreview = !store.botPreview">
        {{ store.botPreview ? '断开预览关联' : '开启 Bot 跟踪预览' }}</button
      ><template v-if="store.botPreview"
        ><label class="sp-field"
          >消息目标<GlassSelect v-model="store.target" label="Bot消息目标"
            ><option>私聊</option>
            <option>群组</option>
            <option>频道</option></GlassSelect
          ></label
        >
        <div class="pw-bot-message">
          <small>Aegis Bot · {{ store.target }}</small>
          <p>{{ message || '赛事提醒将在这里预览，可生成测试消息查看完整流程。' }}</p>
        </div>
        <button class="sp-secondary sp-full" @click="preview">生成测试通知</button>
        <p class="pw-muted">
          当前 {{ store.reminders.filter((r) => r.telegram && r.enabled).length }} 条提醒启用了 Bot
          预览。
        </p></template
      >
      <p class="pw-muted">当前为本地交互预览，未向 Telegram 发送消息。</p></template
    >
    <template v-else
      ><template v-if="editing"
        ><p class="pw-muted">选择具体赛事、玩法与提醒条件</p>
        <label class="sp-field"
          >提醒赛事<GlassSelect
            v-model="draft.matchId"
            label="提醒赛事"
            searchable
            @change="changeFixture"
            ><option v-for="f in planningMatches" :key="f.id" :value="f.id">
              {{ f.home }} vs {{ f.away }} · {{ f.league }}
            </option></GlassSelect
          ></label
        ><label class="sp-field"
          >提醒玩法<GlassSelect
            v-model="draft.marketId"
            label="提醒玩法"
            searchable
            @change="changeMarket"
            ><option v-for="m in selectedFixture.markets" :key="m.id" :value="m.id">
              {{ m.label }} · {{ m.period }} · {{ m.line }}
            </option></GlassSelect
          ></label
        >
        <div class="pw-two">
          <label class="sp-field"
            >提醒平台<GlassSelect v-model="draft.operator" label="提醒平台" searchable
              ><option v-for="p in planningOperators" :key="p.id" :value="p.id">
                {{ p.name }}
              </option></GlassSelect
            ></label
          ><label class="sp-field"
            >关注选项<GlassSelect v-model="draft.selection" label="关注选项"
              ><option v-for="name in selectedMarket.selections" :key="name">
                {{ name }}
              </option></GlassSelect
            ></label
          >
        </div>
        <div class="pw-tabs">
          <button
            v-for="(name, id) in {
              price: '赔率阈值',
              line: '盘口跨档',
              status: '锁盘恢复',
              kickoff: '开赛提醒',
            }"
            :key="id"
            :class="{ selected: draft.type === id }"
            @click="chooseType(id)"
          >
            {{ name }}
          </button>
        </div>
        <label v-if="draft.type === 'price'" class="sp-field"
          >目标赔率<input v-model="draft.target" inputmode="decimal" aria-label="目标赔率" /></label
        ><label v-else-if="draft.type === 'kickoff'" class="sp-field"
          >开赛前<GlassSelect v-model="draft.target" label="开赛提醒时间"
            ><option>5分钟</option>
            <option>15分钟</option>
            <option>30分钟</option></GlassSelect
          ></label
        >
        <div class="pw-two">
          <label class="sp-field"
            >观察窗口<GlassSelect v-model="draft.window"
              ><option>30秒</option>
              <option>1分钟</option>
              <option>5分钟</option></GlassSelect
            ></label
          ><label class="sp-field"
            >提醒冷却<GlassSelect v-model="draft.cooldown"
              ><option>1分钟</option>
              <option>5分钟</option>
              <option>15分钟</option></GlassSelect
            ></label
          >
        </div>
        <label class="sp-setting-row"
          >合并同一选项的连续变化<input
            v-model="draft.merge"
            type="checkbox"
            role="switch" /></label
        ><label class="sp-setting-row"
          >Telegram Bot 消息预览<input
            v-model="draft.telegram"
            type="checkbox"
            role="switch" /></label
        ><button class="sp-primary sp-full" @click="save">保存提醒设置</button></template
      >
      <template v-else
        ><p class="pw-muted">已保存 {{ store.reminders.length }} 条 · 应用内提醒</p>
        <article v-for="r in store.reminders" :key="r.id" class="sp-card pw-saved-alert">
          <h3>
            {{ planningMatches.find((f) => f.id === r.matchId)?.home }} vs
            {{ planningMatches.find((f) => f.id === r.matchId)?.away }}
          </h3>
          <p>
            {{ planningMatches.find((f) => f.id === r.matchId)?.league }} ·
            {{ planningOperators.find((p) => p.id === r.operator)?.name }}
          </p>
          <p>
            {{
              planningMatches
                .find((f) => f.id === r.matchId)
                ?.markets.find((m) => m.id === r.marketId)?.label
            }}
            · {{ r.selection }}
          </p>
          <strong>{{
            r.type === 'price'
              ? `赔率 ≥ ${r.target}`
              : r.type === 'line'
                ? '盘口跨档'
                : r.type === 'status'
                  ? '锁盘 / 恢复'
                  : `开赛前 ${r.target}`
          }}</strong
          ><small
            >观察 {{ r.window }} · 冷却 {{ r.cooldown }} ·
            {{ r.telegram ? '站内 + Bot预览' : '站内消息' }}</small
          ><label class="sp-setting-row"
            >启用提醒<input v-model="r.enabled" type="checkbox" role="switch"
          /></label>
          <div class="sp-split-actions">
            <button class="sp-secondary" @click="edit(r)">编辑提醒</button
            ><button class="sp-secondary" @click="store.remove(r.id)">删除提醒</button>
          </div>
        </article>
        <p v-if="!store.reminders.length" class="pw-muted">
          暂无提醒，选择具体比赛后设置。
        </p></template
      ><RouterLink class="sp-sheet-link" to="/me?section=messages"
        >前往消息中心 →</RouterLink
      ></template
    >
    <p v-if="feedback" class="sp-feedback" role="status">{{ feedback }}</p>
  </div>
</template>
