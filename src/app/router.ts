import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/monitor',
      name: 'monitor',
      component: () => import('@/pages/MonitorPage.vue'),
      meta: { title: '监测' },
    },
    {
      path: '/ai',
      name: 'ai',
      component: () => import('@/pages/AiPage.vue'),
      meta: { title: 'Aegis AI' },
    },
    {
      path: '/compare',
      name: 'compare',
      beforeEnter: (to) => (to.query.tab === 'funding' ? { path: '/monitor' } : undefined),
      component: () => import('@/pages/ComparePage.vue'),
      meta: { title: '体育数据对比' },
    },
    {
      path: '/me',
      name: 'me',
      component: () => import('@/pages/MePage.vue'),
      meta: { title: '我的' },
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/pages/NotFoundPage.vue'),
      meta: { title: '页面未找到' },
    },
  ],
  scrollBehavior: () => false,
})
const mainScroll = new Map<string, number>()
let lastHistoryPosition = (window.history.state?.position as number | undefined) ?? 0
router.beforeEach((to, from) => {
  const main = document.getElementById('main-content')
  if (main && from.matched.length) mainScroll.set(from.fullPath, main.scrollTop)
  return true
})
router.afterEach((to, from) => {
  const title =
    to.name === 'me' && to.query.section === 'vip'
      ? 'VIP 服务'
      : to.name === 'me' && to.query.section === 'agents'
        ? '代理比价'
        : String(to.meta.title ?? 'Aegis')
  document.title = `${title} · Aegis`
  if (to.path === from.path) return
  const position = (window.history.state?.position as number | undefined) ?? 0
  const popped = position < lastHistoryPosition
  lastHistoryPosition = position
  const top = popped ? (mainScroll.get(to.fullPath) ?? 0) : 0
  requestAnimationFrame(() => {
    document.getElementById('main-content')?.scrollTo({ top })
  })
})
export default router
