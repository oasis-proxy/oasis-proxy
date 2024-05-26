import Browser from '../Browser/main'
import { downloadUrl } from '@/core/ConfigData'

export const startUpdateUrl = async () => {
  let per = 3
  if (import.meta.env.VITE_APP_DEBUG != 'debug') {
    per = 1440
  }
  await chrome.alarms.create('updateUrl', { periodInMinutes: per })
  console.info('create updateUrl', per)
}
export const endUpdateUrl = async () => {
  await chrome.alarms.clear('updateUrl')
  console.info('clear updateUrl')
}

export const handleUpdateUrl = async function () {
  const result = await chrome.storage.local.get(null)
  for (let key of Object.keys(result)) {
    if (!key.startsWith('proxy_') || result[key].mode != 'auto') continue
    try {
      console.info('handleUpdateUrl', key)
      let updateFlag = false
      let response
      const updateProxyConfig = JSON.parse(JSON.stringify(result[key]))
      console.info('handleUpdateUrl updateProxyConfig', updateProxyConfig)
      if (updateProxyConfig.config.rules.external.url != '') {
        response = await downloadUrl(
          updateProxyConfig.config.rules.external.url,
          'base64'
        )
        updateProxyConfig.config.rules.external.data = response.data
        updateProxyConfig.config.rules.external.urlUpdatedAt = response.updated
        updateFlag = true
      }
      if (updateProxyConfig.config.rules.reject.url != '') {
        response = await downloadUrl(
          result.proxyConfigObj[key].config.rules.reject.url,
          'base64'
        )
        updateProxyConfig.config.rules.reject.data = response.data
        updateProxyConfig.config.rules.reject.urlUpdatedAt = response.updated
        updateFlag = true
      }
      if (updateFlag) {
        await chrome.storage.local.set({ [key]: updateProxyConfig })
      }
    } catch (err) {
      console.error(err)
    }
  }
  const afterUpdateResult = await chrome.storage.local.get(null)
  if (afterUpdateResult.status_proxyKey != null) {
    Browser.Proxy.set(
      afterUpdateResult,
      afterUpdateResult.status_proxyKey,
      async () => {
        console.info(
          'Proxy updated after url updated',
          afterUpdateResult,
          afterUpdateResult.status_proxyKey
        )
      }
    )
  }
}
