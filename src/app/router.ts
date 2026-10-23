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
      component: () => import('@/pages/PlaceholderPage.vue'),
      meta: { title: '监测' },
    },
    {
      path: '/ai',
      name: 'ai',
      component: () => import('@/pages/PlaceholderPage.vue'),
      meta: { title: 'Aegis AI' },
    },
    {
      path: '/compare',
      name: 'compare',
      component: () => import('@/pages/PlaceholderPage.vue'),
      meta: { title: '数据对比' },
    },
    {
      path: '/me',
      name: 'me',
      component: () => import('@/pages/PlaceholderPage.vue'),
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
  document.title = `${String(to.meta.title ?? 'Aegis')} · Aegis`
})
export default router
