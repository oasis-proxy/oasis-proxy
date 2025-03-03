import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/home/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: {
        path: 'home'
      }
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView
    },
    {
      name: 'pac',
      path: '/pac/:name',
      component: () => import('../views/PacView.vue')
    },
    {
      name: 'auto',
      path: '/auto/:name',
      props: true,
      component: () => import('../views/auto/AutoView.vue')
    },
    {
      name: 'fixed',
      path: '/fixed/:name',
      props: true,
      component: () => import('../views/FixedView.vue')
    }
  ]
})

export default router
