import Browser from '../Browser/main'
import { updateExternalData } from '@/core/proxy_config.js'

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
  const result = await Browser.Storage.getLocalAll()
  for (let key of Object.keys(result)) {
    if (!key.startsWith('proxy_') || result[key].mode != 'auto') continue
    const proxyConfig = await updateExternalData(result[key])
    console.info('handleUpdateUrl', key, result[key], proxyConfig)
    if (JSON.stringify(proxyConfig) != '{}') {
      Browser.Storage.setLocal({ [key]: proxyConfig })
      if (key == result.status_proxyKey) {
        const afterUpdateResult = await Browser.Storage.getLocalAll()
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
  }
}
