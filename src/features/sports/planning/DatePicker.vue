<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight, Clock3 } from '@lucide/vue'
import { planningDate } from '@/mocks/sports-planning'
const props = defineProps<{ selected: string }>()
const emit = defineEmits<{ choose: [date: string] }>()
const initial = new Date(`${props.selected || planningDate}T00:00:00Z`)
const year = ref(initial.getUTCFullYear()),
  month = ref(initial.getUTCMonth())
const tomorrowDate = new Date(`${planningDate}T00:00:00Z`)
tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1)
const tomorrow = tomorrowDate.toISOString().slice(0, 10)
const shortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`
const cells = computed(() => [
  ...Array(new Date(Date.UTC(year.value, month.value, 1)).getUTCDay()).fill(0),
  ...Array.from(
    { length: new Date(Date.UTC(year.value, month.value + 1, 0)).getUTCDate() },
    (_, i) => i + 1,
  ),
])
function move(n: number) {
  const date = new Date(Date.UTC(year.value, month.value + n, 1))
  year.value = date.getUTCFullYear()
  month.value = date.getUTCMonth()
}
const iso = (day: number) =>
  `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
</script>
<template>
  <div class="pw-calendar">
    <div class="pw-calendar-heading">
      <button aria-label="上个月" @click="move(-1)"><ChevronLeft :size="19" /></button
      ><strong>{{ year }}年{{ month + 1 }}月</strong
      ><button aria-label="下个月" @click="move(1)"><ChevronRight :size="19" /></button>
    </div>
    <div class="pw-calendar-grid">
      <small v-for="name in ['日', '一', '二', '三', '四', '五', '六']" :key="name">{{
        name
      }}</small
      ><span v-for="(day, i) in cells" :key="i"
        ><button
          v-if="day"
          :aria-label="iso(day)"
          :aria-pressed="selected === iso(day)"
          :aria-current="iso(day) === planningDate ? 'date' : undefined"
          :class="{ selected: selected === iso(day), 'is-today': iso(day) === planningDate }"
          @click="emit('choose', iso(day))"
        >
          {{ day }}
        </button></span
      >
    </div>
    <div class="pw-calendar-shortcuts" aria-label="快捷日期">
      <button
        :aria-pressed="!selected"
        :class="{ selected: !selected }"
        @click="emit('choose', '')"
      >
        全部日期
      </button>
      <button
        :aria-pressed="selected === planningDate"
        :class="{ selected: selected === planningDate }"
        @click="emit('choose', planningDate)"
      >
        今天 {{ shortDate(planningDate) }}
      </button>
      <button
        :aria-pressed="selected === tomorrow"
        :class="{ selected: selected === tomorrow }"
        @click="emit('choose', tomorrow)"
      >
        明天 {{ shortDate(tomorrow) }}
      </button>
    </div>
    <p class="pw-calendar-note"><Clock3 :size="13" />按 UTC+8 查看开赛日期</p>
  </div>
</template>
