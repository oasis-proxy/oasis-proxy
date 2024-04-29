import { createRouter, createWebHashHistory } from 'vue-router'
import ProxyView from '../views/ProxyView.vue'
import MonitorView from '../views/MonitorView.vue'
import QuickView from '../views/QuickView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'proxy',
      component: ProxyView
    },
    {
      path: '/monitor',
      name: 'monitor',
      component: MonitorView
    },
    {
      path: '/quick',
      name: 'quick',
      component: QuickView
    }
  ]
})

export default router
