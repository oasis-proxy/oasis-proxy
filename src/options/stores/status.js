import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useStatusStore = defineStore('status', () => {
  const activeProxyKey = ref('')
  const proxyConfigs = ref({
    direct: {
      mode: 'direct',
      name: 'direct',
      tagColor: '#fff',
      config: { mode: 'direct' }
    },
    system: {
      mode: 'system',
      name: 'system',
      tagColor: '#000',
      config: { mode: 'system' }
    },
    reject: {
      mode: 'reject',
      name: 'reject',
      config: { mode: 'reject', rules: 'HTTPS 127.0.0.1:65432' }
    }
  })
  const isUnsaved = ref(false)
  const isTempRuleValid = ref(false)

  function setTempRuleValid() {
    isTempRuleValid.value = true
  }
  function resetTempRuleValid() {
    isTempRuleValid.value = false
  }
  function setUnsaved() {
    isUnsaved.value = true
  }
  function resetUnsaved() {
    isUnsaved.value = false
  }

  return {
    activeProxyKey,
    proxyConfigs,
    isUnsaved,
    isTempRuleValid,
    setUnsaved,
    resetUnsaved,
    setTempRuleValid,
    resetTempRuleValid
  }
})
