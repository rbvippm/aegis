import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
export type DemoScenario = 'normal' | 'empty' | 'stale' | 'partial' | 'error'
export const usePreferences = defineStore('preferences', () => {
  let saved = false
  try {
    saved = localStorage.getItem('aegis:reduced-transparency') === 'true'
  } catch {
    /* Storage may be blocked in WebViews. */
  }
  const reducedTransparency = ref(saved)
  const scenario = ref<DemoScenario>('normal')
  watch(reducedTransparency, (value) => {
    try {
      localStorage.setItem('aegis:reduced-transparency', String(value))
    } catch {
      /* Preferences remain available for this session. */
    }
  })
  return { reducedTransparency, scenario }
})
