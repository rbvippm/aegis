import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { usePlatformFollows } from './features/monitoring/follows'
import { captureInvitation } from './features/invitation/attribution'
import router from './app/router'
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
void initPlatform(router)
