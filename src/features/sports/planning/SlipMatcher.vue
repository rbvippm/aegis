<script setup lang="ts">
import { computed, ref } from 'vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { planningMatches } from '@/mocks/sports-planning'
import { matchSlip } from './model'
const emit = defineEmits<{ add: [ids: string[]] }>()
const text = ref(''),
  parsed = ref(false),
  error = ref('')
const results = ref<ReturnType<typeof matchSlip>>([])
const selected = computed(() => [...new Set(results.value.map((r) => r.selected).filter(Boolean))])
function parse() {
  error.value = ''
  if (text.value.split('\n').filter((t) => t.trim()).length > 12) {
    error.value = '最多支持12条，请减少条数。'
    return
  }
  results.value = matchSlip(text.value, planningMatches)
  parsed.value = true
}
function example() {
  text.value = '海港队\n北辰队\n东岚队'
  parsed.value = false
}
</script>
<template>
  <div class="pw-slip">
    <h3>按球队或选手匹配赛事</h3>
    <p class="pw-muted">每行一条，最多12条；不必填写赔率、金额或平台。相似名称由你确认。</p>
    <textarea
      v-model="text"
      aria-label="注单文字"
      rows="5"
      placeholder="例如：海港队&#10;北辰队"
      @input="parsed = false"
    />
    <div class="sp-split-actions">
      <button class="sp-secondary" @click="example">填入</button
      ><button class="sp-primary" :disabled="!text.trim()" @click="parse">识别并核对</button>
    </div>
    <p v-if="error" class="sp-notice" role="alert">{{ error }}</p>
    <template v-if="parsed"
      ><p class="pw-slip-count" role="status">
        {{ results.filter((r) => r.selected).length }} / {{ results.length }} 条已匹配 ·
        {{ selected.length }} 场可加入比价
      </p>
      <article v-for="(r, i) in results" :key="i" class="sp-card">
        <h4>{{ i + 1 }}. {{ r.text }}</h4>
        <p v-if="!r.matches.length" class="pw-muted">暂未找到匹配赛事，可在下方手动指定。</p>
        <p v-else-if="r.matches.length > 1" class="pw-muted">
          发现 {{ r.matches.length }} 场相似赛事，请选择联赛与开赛时间。
        </p>
        <label class="sp-field"
          >确认赛事<GlassSelect v-model="r.selected" :label="`第${i + 1}条确认赛事`" searchable
            ><option value="">请选择赛事</option>
            <option
              v-for="f in r.matches.length ? r.matches : planningMatches"
              :key="f.id"
              :value="f.id"
            >
              {{ f.home }} vs {{ f.away }} · {{ f.league }} · {{ f.startsAt.slice(5, 10) }}
            </option></GlassSelect
          ></label
        >
      </article>
      <button
        class="sp-primary sp-full"
        :disabled="!selected.length"
        @click="emit('add', selected)"
      >
        加入 {{ selected.length }} 场完整比价
      </button></template
    >
  </div>
</template>
