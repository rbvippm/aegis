<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
defineProps<{ selected: string }>()
const emit = defineEmits<{ choose: [date: string] }>()
const year = ref(2026),
  month = ref(9)
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
          :class="{ selected: selected === iso(day) }"
          @click="emit('choose', iso(day))"
        >
          {{ day }}
        </button></span
      >
    </div>
    <div class="pw-tabs">
      <button @click="emit('choose', '')">全部日期</button
      ><button @click="emit('choose', '2026-10-25')">今天 10/25</button
      ><button @click="emit('choose', '2026-10-26')">明天 10/26</button>
    </div>
    <p class="pw-muted">按 UTC+8 查看开赛日期</p>
  </div>
</template>
