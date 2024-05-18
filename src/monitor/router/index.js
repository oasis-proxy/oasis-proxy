import { createRouter, createWebHashHistory } from 'vue-router'
import RequestMonitor from '../views/RequestMonitor.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'monitor',
      component: RequestMonitor
    }
  ]
})

export default router
