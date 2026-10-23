import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './app/router'
import { initPlatform } from './platform'
import './shared/styles/tokens.css'
import './shared/styles/base.css'
import './shared/styles/reference-home.css'

const app = createApp(App)
app.use(createPinia()).use(router).mount('#app')
void initPlatform(router)
