<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { Download } from '@lucide/vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import {
  categoryNames,
  rankOperators,
  metricNames,
  number,
  type Fixture,
  type Operator,
  type Metric,
} from './model'
import { planningSnapshot } from '@/mocks/sports-planning'
const props = defineProps<{
  fixtures: Fixture[]
  operators: Operator[]
  metric: Metric
  scope: string
}>()
const template = ref('ranking'),
  layout = ref('portrait'),
  first = ref(props.operators[0]?.id ?? ''),
  second = ref(props.operators[1]?.id ?? '')
const preview = ref(''),
  error = ref('')
const rows = computed(() => rankOperators(props.fixtures, props.operators, props.metric))
const selectedRows = computed(() =>
  template.value === 'ranking'
    ? rows.value.slice(0, 8)
    : rows.value.filter(
        (r) =>
          r.operator.id === first.value ||
          (template.value === 'compare' && r.operator.id === second.value),
      ),
)
let canvas: HTMLCanvasElement | undefined,
  objectUrl = ''
function paint() {
  canvas = document.createElement('canvas')
  canvas.width = layout.value === 'portrait' ? 1080 : 1920
  canvas.height = layout.value === 'portrait' ? 1920 : 1080
  const c = canvas.getContext('2d')
  if (!c) return
  const w = canvas.width,
    h = canvas.height,
    p = 70
  const bg = c.createLinearGradient(0, 0, w, h)
  bg.addColorStop(0, '#f9fcff')
  bg.addColorStop(1, '#dceeff')
  c.fillStyle = bg
  c.fillRect(0, 0, w, h)
  function text(value: string, x: number, y: number, size = 28, color = '#14213d', bold = false) {
    c!.font = `${bold ? '650' : '400'} ${size}px -apple-system, BlinkMacSystemFont, sans-serif`
    c!.fillStyle = color
    c!.fillText(value, x, y)
  }
  function wrap(
    value: string,
    x: number,
    y: number,
    width: number,
    size: number,
    color = '#627c9d',
  ) {
    c!.font = `400 ${size}px -apple-system, sans-serif`
    let line = ''
    for (const char of value) {
      if (c!.measureText(line + char).width > width) {
        text(line, x, y, size, color)
        y += size * 1.5
        line = ''
      }
      line += char
    }
    text(line, x, y, size, color)
    return y + size * 1.5
  }
  text('Aegis', p, 110, 44, '#0965e6', true)
  text(
    template.value === 'ranking'
      ? '平台赔率排行榜'
      : template.value === 'operator'
        ? '平台赔率报告'
        : '平台赔率对比',
    p,
    190,
    48,
    '#14213d',
    true,
  )
  let y = wrap(
    `${props.scope} · ${metricNames[props.metric]} · ${props.fixtures.length} 场赛事`,
    p,
    245,
    w - 2 * p,
    26,
  )
  text(planningSnapshot, p, y + 20, 24)
  y += 90
  if (template.value === 'ranking') {
    for (const [i, row] of selectedRows.value.entries()) {
      c.fillStyle = '#ffffff'
      c.beginPath()
      c.roundRect(p, y, w - 2 * p, layout.value === 'portrait' ? 125 : 65, 18)
      c.fill()
      text(
        `${i + 1}   ${row.operator.name}`,
        p + 25,
        y + (layout.value === 'portrait' ? 52 : 42),
        layout.value === 'portrait' ? 32 : 28,
        '#14213d',
        true,
      )
      text(
        `${number(row.value)}%`,
        w - p - 180,
        y + (layout.value === 'portrait' ? 52 : 42),
        32,
        '#0965e6',
        true,
      )
      if (layout.value === 'portrait')
        text(`${row.games} 场赛事 · ${row.lines.length} 条盘口`, p + 70, y + 93, 23)
      y += layout.value === 'portrait' ? 142 : 77
    }
  } else {
    const gap = 30,
      cw =
        (w - 2 * p - gap * (selectedRows.value.length - 1)) / Math.max(1, selectedRows.value.length)
    selectedRows.value.forEach((row, i) => {
      const x = p + i * (cw + gap)
      c.fillStyle = '#fff'
      c.beginPath()
      c.roundRect(x, y, cw, layout.value === 'portrait' ? 560 : 440, 24)
      c.fill()
      text(row.operator.name, x + 28, y + 75, 36, '#14213d', true)
      text(`${number(row.value)}%`, x + 28, y + 170, 54, '#0965e6', true)
      text(`${row.games} 场赛事`, x + 28, y + 240, 27)
      text(`${row.lines.length} 条盘口`, x + 28, y + 300, 27)
      wrap(`平台类型 · ${categoryNames[row.operator.category]}`, x + 28, y + 370, cw - 56, 26)
    })
  }
  if (!selectedRows.value.length) text('当前筛选暂无可展示数据', p, y + 70, 32)
  text('产品功能规划 · 本地示例数据', p, h - 90, 24, '#7188a7')
  text('同范围比较，理论结果不等于实际收益。', p, h - 48, 22, '#7188a7')
  preview.value = canvas.toDataURL('image/png')
}
watch(
  () => [
    template.value,
    layout.value,
    first.value,
    second.value,
    props.fixtures,
    props.operators,
    props.metric,
    props.scope,
  ],
  () => void nextTick(paint),
  { immediate: true },
)
function download() {
  error.value = ''
  if (!canvas) return
  canvas.toBlob((blob) => {
    if (!blob) {
      error.value = '图片生成失败，请重试。'
      return
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `aegis-sports-${template.value}-${layout.value}.png`
    link.click()
  }, 'image/png')
}
onBeforeUnmount(() => {
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})
</script>
<template>
  <div class="pw-report">
    <div class="pw-tabs">
      <button
        v-for="(name, id) in { ranking: '排行榜', operator: '单平台', compare: '平台对比' }"
        :key="id"
        :class="{ selected: template === id }"
        @click="template = id"
      >
        {{ name }}
      </button>
    </div>
    <div v-if="template !== 'ranking'" class="pw-two">
      <label class="sp-field"
        >平台一<GlassSelect v-model="first" label="报告平台一" searchable
          ><option v-for="p in operators" :key="p.id" :value="p.id">
            {{ p.name }}
          </option></GlassSelect
        ></label
      ><label v-if="template === 'compare'" class="sp-field"
        >平台二<GlassSelect v-model="second" label="报告平台二" searchable
          ><option v-for="p in operators" :key="p.id" :value="p.id">
            {{ p.name }}
          </option></GlassSelect
        ></label
      >
    </div>
    <div class="pw-tabs">
      <button :class="{ selected: layout === 'portrait' }" @click="layout = 'portrait'">
        竖版 9:16</button
      ><button :class="{ selected: layout === 'landscape' }" @click="layout = 'landscape'">
        横版 16:9
      </button>
    </div>
    <button class="sp-primary sp-full" @click="download"><Download :size="16" />下载 PNG</button>
    <p v-if="error" role="alert">{{ error }}</p>
    <img v-if="preview" :src="preview" alt="体育赔率报告预览" class="pw-report-image" />
    <p class="pw-muted">报告内容跟随当前体育、联赛、平台类型与排名指标。</p>
  </div>
</template>
