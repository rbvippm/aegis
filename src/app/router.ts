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
  scrollBehavior(to, from, savedPosition) {
    if (to.path === from.path) return false
    return savedPosition ?? { top: 0 }
  },
})
router.afterEach((to) => {
  const title =
    to.name === 'me' && to.query.section === 'vip'
      ? 'VIP 服务'
      : to.name === 'me' && to.query.section === 'agents'
        ? '代理比价'
        : String(to.meta.title ?? 'Aegis')
  document.title = `${title} · Aegis`
})
export default router
