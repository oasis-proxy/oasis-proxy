import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/home/HomeView.vue'
import TempRuleView from '../views/temprule/TempRuleView.vue'
import HomeDefault from '../views/home/HomeDefault.vue'
import HomeAdvance from '../views/home/HomeAdvance.vue'
import HomeDebug from '../views/home/HomeDebug.vue'
import HomeBeta from '../views/home/HomeBeta.vue'
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
      component: HomeView,
      children: [
        {
          path: '',
          redirect: {
            path: '/home/default'
          }
        },
        {
          path: 'default',
          name: 'home_default',
          component: HomeDefault
        },
        {
          path: 'advance',
          component: HomeAdvance
        },
        {
          path: 'beta',
          component: HomeBeta
        },
        {
          path: 'debug',
          component: HomeDebug
        },
        {
          path: '*',
          redirect: {
            name: 'home_default'
          }
        }
      ]
    },
    {
      name: 'temp',
      path: '/temp',
      component: TempRuleView
    },
    {
      name: 'pac',
      path: '/pac/:name',
      props: true,
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
