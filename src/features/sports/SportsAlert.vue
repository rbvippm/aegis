<script setup lang="ts">
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { ref } from 'vue'
import { Info } from '@lucide/vue'
import type { AlertSetting, OddsFormat, SportsMarket, SportsMatch } from './types'
import { platformName } from './platforms'
import { formatOdds, toDecimal } from './logic'
const props = defineProps<{
  match: SportsMatch
  market: SportsMarket
  format: OddsFormat
  initial?: AlertSetting
}>()
const emit = defineEmits<{ save: [setting: AlertSetting] }>()
const type = ref<AlertSetting['type']>(props.initial?.type ?? 'price')
const platform = ref(props.initial?.platform ?? 'A')
const target = ref('0.95')
const windowSeconds = ref(props.initial?.windowSeconds ?? 30)
const cooldownMinutes = ref(props.initial?.cooldownMinutes ?? 5)
const merge = ref(props.initial?.merge ?? true)
const selection = ref(props.initial?.selection ?? props.market.selections[0])
const error = ref('')
const labels = { HK: '港盘', MY: '马盘', ID: '印尼盘', DEC: '十进制' }
// The target uses the selected display format; switching format never changes its comparison basis.
const defaults = { HK: '0.95', MY: '0.95', ID: '-1.05', DEC: '1.95' }
target.value = props.initial?.target
  ? formatOdds(props.initial.target, props.format).replace('−', '-')
  : defaults[props.format]
function save() {
  const decimal = type.value === 'price' ? toDecimal(Number(target.value), props.format) : null
  if (type.value === 'price' && decimal === null) {
    error.value = '目标赔率不符合当前显示格式，请检查正负号与数值。'
    return
  }
  error.value = ''
  emit('save', {
    matchId: props.match.id,
    marketId: props.market.id,
    platform: platform.value,
    type: type.value,
    target: decimal,
    windowSeconds: windowSeconds.value,
    cooldownMinutes: cooldownMinutes.value,
    merge: merge.value,
    selection: selection.value,
  })
}
</script>
<template>
  <form class="sp-alert" @submit.prevent="save">
    <p class="sp-tool-subtitle">区分水位、盘口和报价状态</p>
    <div class="sp-card sp-context">
      <h3>{{ match.home }} <span>VS</span> {{ match.away }}</h3>
      <p>{{ platformName(platform) }} · {{ market.scope }} · {{ market.line }}</p>
    </div>
    <section class="sp-card">
      <h3>提醒类型</h3>
      <label class="sp-field"
        >提醒平台<GlassSelect v-model="platform" label="提醒平台"
          ><option v-for="q in market.quotes" :key="q.platform" :value="q.platform">
            {{ platformName(q.platform) }}
          </option></GlassSelect
        ></label
      >
      <div class="sp-pill-tabs">
        <button
          v-for="(label, key) in { price: '水位变动', line: '盘口跨档', status: '锁盘恢复' }"
          :key="key"
          type="button"
          :class="{ active: type === key }"
          :aria-pressed="type === key"
          @click="type = key"
        >
          {{ label }}
        </button>
      </div>
      <label class="sp-field"
        >关注选项<GlassSelect v-model="selection">
          <option v-for="option in market.selections" :key="option">{{ option }}</option>
        </GlassSelect></label
      >
      <div v-if="type === 'price'" class="sp-two-fields">
        <label class="sp-field"
          >当前{{ labels[format]
          }}<output>{{
            formatOdds(
              market.quotes.find((q) => q.platform === platform)?.[
                selection === market.selections[0] ? 'home' : 'away'
              ] ?? null,
              format,
            )
          }}</output></label
        ><label class="sp-field"
          >目标{{ labels[format]
          }}<input v-model="target" inputmode="decimal" aria-label="目标赔率"
        /></label>
      </div>
      <p class="sp-small-note">
        {{
          type === 'price'
            ? '达到或高于目标回报时提醒；按十进制比较。'
            : type === 'line'
              ? '盘口线跨档时记录旧盘口和新盘口。'
              : '平台锁盘或恢复报价时记录状态。'
        }}
      </p>
    </section>
    <section class="sp-card">
      <h3>频率与窗口</h3>
      <label class="sp-setting-row"
        >观察窗口<GlassSelect v-model.number="windowSeconds">
          <option :value="30">30秒</option>
          <option :value="60">1分钟</option>
          <option :value="300">5分钟</option>
        </GlassSelect></label
      ><label class="sp-setting-row"
        >提醒冷却<GlassSelect v-model.number="cooldownMinutes">
          <option :value="1">1分钟</option>
          <option :value="5">5分钟</option>
          <option :value="15">15分钟</option>
        </GlassSelect></label
      ><label class="sp-setting-row"
        >合并同一选项的连续变化<input v-model="merge" type="checkbox" role="switch"
      /></label>
    </section>
    <section class="sp-card">
      <h3>通知方式</h3>
      <div class="sp-setting-row">
        <span>应用内提醒</span><span class="sp-status-chip">已开启</span>
      </div>
    </section>
    <p class="sp-notice sp-notice--blue"><Info :size="17" />比分与报价不同步时，暂停机会提醒</p>
    <p v-if="error" class="sp-notice" role="alert">{{ error }}</p>
    <button class="sp-primary sp-full" type="submit">保存提醒设置</button>
  </form>
</template>
