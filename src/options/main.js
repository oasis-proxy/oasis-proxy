import '../assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import toastPlugin from '@/components/toast/Toast.js'
import ConfirmModal from '@/components/modal/ConfirmModal.vue'
import { useStatusStore } from '@/options/stores/status'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(toastPlugin)

const confirmInstance = createApp(ConfirmModal)
document.body.appendChild(document.createElement('div'))
const confirm = confirmInstance.mount(document.body.lastChild)
app.config.globalProperties.$confirm = confirm

const storeStatus = useStatusStore()

document.addEventListener('input', function (event) {
  if (event.target.form?.id.lastIndexOf('Modal') > -1) {
    return
  }
  if (window.location.hash.startsWith('#/home')) {
    return
  }
  storeStatus.setUnsaved()
})

app.mount('#app')
