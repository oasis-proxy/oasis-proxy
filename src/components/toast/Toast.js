import { createApp } from 'vue'
import Toast from './ToastAside.vue'
import ToastMessage from './ToastMessage.vue'

const toastPlugin = {
  install(app) {
    const toastContainer = document.createElement('div')
    toastContainer.classList.add('position-fixed')
    toastContainer.classList.add('top-0')
    toastContainer.classList.add('end-0')
    toastContainer.classList.add('m-3')

    const toastGroups = document.createElement('div')
    toastGroups.classList.add('vstack')
    toastGroups.classList.add('gap-4')

    toastContainer.appendChild(toastGroups)
    document.body.appendChild(toastContainer)

    app.config.globalProperties.$toast = {
      info: function (message) {
        const options = { message: message, mode: 'info' }
        const toastInstance = createApp(Toast, options)
        const toast = toastInstance.mount(document.createElement('div'))
        toastGroups.appendChild(toast.$el)
        setTimeout(() => {
          toastInstance.unmount()
        }, 10000)
      },
      warning: function (message) {
        const options = { message: message, mode: 'warning' }
        const toastInstance = createApp(Toast, options)
        const toast = toastInstance.mount(document.createElement('div'))
        toastGroups.appendChild(toast.$el)
        setTimeout(() => {
          toastInstance.unmount()
        }, 10000)
      }
    }

    const toastMessageContainer = document.createElement('div')
    toastMessageContainer.classList.add('position-fixed')
    toastMessageContainer.classList.add('top-0')
    toastMessageContainer.classList.add('start-50')
    toastMessageContainer.classList.add('translate-middle-x')
    toastMessageContainer.classList.add('m-3')

    const toastMessageGroups = document.createElement('div')
    toastMessageGroups.classList.add('vstack')
    toastMessageGroups.classList.add('gap-1')

    toastMessageContainer.appendChild(toastMessageGroups)
    document.body.appendChild(toastMessageContainer)

    app.config.globalProperties.$toastMessage = {
      info: function (message) {
        const options = { message: message, mode: 'info' }
        const toastMessageInstance = createApp(ToastMessage, options)
        const toastMessage = toastMessageInstance.mount(
          document.createElement('div')
        )
        toastMessageGroups.appendChild(toastMessage.$el)
        setTimeout(() => {
          toastMessageInstance.unmount()
        }, 10000)
      },
      warning: function (message) {
        const options = { message: message, mode: 'warning' }
        const toastMessageInstance = createApp(ToastMessage, options)
        const toastMessage = toastMessageInstance.mount(
          document.createElement('div')
        )
        toastMessageGroups.appendChild(toastMessage.$el)
        setTimeout(() => {
          toastMessageInstance.unmount()
        }, 10000)
      }
    }
  }
}
export default toastPlugin
