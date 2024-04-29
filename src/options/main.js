import '../assets/main.css'

import { createApp, ref } from 'vue'

import App from './App.vue'
import router from './router'
import toastPlugin from '@/components/toast/Toast.js'
import ConfirmModal from '@/components/modal/ConfirmModal.vue'

const isUnsaved = ref(false)
function resetUnsaved() {
  isUnsaved.value = false
}
function setUnsaved() {
  isUnsaved.value = true
}

const app = createApp(App)

app.provide('isUnsaved', { isUnsaved, resetUnsaved, setUnsaved })

app.use(router)
app.use(toastPlugin)

const confirmInstance = createApp(ConfirmModal)
document.body.appendChild(document.createElement('div'))
const confirm = confirmInstance.mount(document.body.lastChild)
app.config.globalProperties.$confirm = confirm

document.addEventListener('input', function (event) {
  if (event.target.form?.id.lastIndexOf('Modal') > -1) {
    return
  }
  if (window.location.hash.startsWith('#/home')) {
    return
  }
  setUnsaved()
})

app.mount('#app')
