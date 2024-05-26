import { createApp } from 'vue'
import ToastMessage from './ToastMessage.vue'

const toastPlugin = {
  install(app) {
    const toastContainer = document.createElement('div')
    toastContainer.classList.add('position-fixed')
    toastContainer.classList.add('top-0')
    toastContainer.classList.add('end-0')
    toastContainer.classList.add('p-3')

    const toastGroups = document.createElement('div')
    toastGroups.classList.add('vstack')
    toastGroups.classList.add('gap-4')
    toastGroups.id = 'toastContainer'
    toastContainer.appendChild(toastGroups)
    document.body.appendChild(toastContainer)

    app.config.globalProperties.$toast = {
      info: function (message) {
        const options = { message: message, mode: 'info' }
        const toastInstance = createApp(ToastMessage, options)
        const toast = toastInstance.mount(document.createElement('div'))
        toastGroups.appendChild(toast.$el)
        setTimeout(() => {
          toastInstance.unmount()
        }, 10000)
      },
      warning: function (message) {
        const options = { message: message, mode: 'warning' }
        const toastInstance = createApp(ToastMessage, options)
        const toast = toastInstance.mount(document.createElement('div'))
        toastGroups.appendChild(toast.$el)
        setTimeout(() => {
          toastInstance.unmount()
        }, 10000)
      }
    }
  }
}
export default toastPlugin
