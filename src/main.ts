import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { usePlatformFollows } from './features/monitoring/follows'
import { captureInvitation } from './features/invitation/attribution'
import router from './app/router'
import { dismissBootScreen, showBootError } from './app/boot'
import { initPlatform } from './platform'
import './shared/styles/tokens.css'
import './shared/styles/base.css'
import './shared/styles/reference-home.css'

try {
  captureInvitation(location.href, localStorage)
} catch {
  /* Continue without optional attribution. */
}
const app = createApp(App)
app.use(createPinia()).use(router)
usePlatformFollows()
app.mount('#app')
void router
  .isReady()
  .then(async () => {
    await nextTick()
    // Let the first route paint beneath the cover; never add an artificial splash delay.
    requestAnimationFrame(() => requestAnimationFrame(dismissBootScreen))
  })
  .catch(showBootError)
void initPlatform(router)
