import '../assets/main.css'

import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import toastPlugin from '@/components/toast/Toast.js'

const app = createApp(App)

app.use(router)
app.use(toastPlugin)
app.mount('#app')
