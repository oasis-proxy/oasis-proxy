import Browser from '../Browser/main'
import { updateRulesSetData } from '@/core/proxy_config.js'

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
  console.info('handleUpdateUrl', new Date().toLocaleTimeString())
  const result = await Browser.Storage.getLocalAll()
  for (let key of Object.keys(result)) {
    if (!key.startsWith('proxy_') || result[key].mode != 'auto') continue
    const proxyConfig = await updateRulesSetData(result[key])
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
