import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', () => {
  const configUI = ref('dark')
  const configUpdateUrl = ref(true)
  const configMonitor = ref(false)
  const configAutoSync = ref(false)
  const computedTheme = computed(() => {
    switch (configUI.value) {
      case 'dark':
        return 'dark'
      case 'system':
        if (
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
        ) {
          return 'dark'
        } else {
          return 'light'
        }
      default:
        return 'light'
    }
  })

  return {
    configUI,
    configUpdateUrl,
    configMonitor,
    configAutoSync,
    computedTheme
  }
})
