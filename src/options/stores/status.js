import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useStatusStore = defineStore('status', () => {
  const activeProxyKey = ref('')
  const proxyConfigs = ref({
    direct: { mode: 'direct', name: 'direct', config: { mode: 'direct' } },
    system: { mode: 'system', name: 'system', config: { mode: 'system' } },
    reject: {
      mode: 'reject',
      name: 'reject',
      config: { mode: 'reject', rules: 'HTTPS 127.0.0.1:65432' }
    }
  })

  return {
    activeProxyKey,
    proxyConfigs
  }
})
