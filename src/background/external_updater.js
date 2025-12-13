import Browser from '../Browser/main'
import { log } from '@/core/utils.js'
import { updateRulesSetData, updatePacData } from '@/core/proxy_config.js'
import { enumInterval } from '../core/utils.js'

export const startUpdateUrl = async (interval) => {
  log.info('startUpdateUrl', interval)
  await chrome.alarms.clear('updateUrl')
  await chrome.alarms.create('updateUrl', {
    periodInMinutes: 1
  })
}

export const endUpdateUrl = async () => {
  log.info('clear updateUrl')
  await chrome.alarms.clear('updateUrl')
}

export const handleUpdateUrl = async function () {
  log.info('handleUpdateUrl', new Date().toLocaleTimeString())
  const result = await Browser.Storage.getLocalAll()

  // disableAll means do not update by url any more, even if proxy is set.
  if (result.config_updateUrl == 'disableAll') {
    return
  }

  for (let key of Object.keys(result)) {
    if (!key.startsWith('proxy_') || result[key].mode == 'fixed_servers')
      continue

    let proxyConfig = {}
    if (result[key].mode == 'pac_script') {
      proxyConfig = await updatePacData(result[key], {
        interval: enumInterval[result.config_updateUrl]
      })
    } else if (result[key].mode == 'auto') {
      proxyConfig = await updateRulesSetData(result[key], {
        interval: enumInterval[result.config_updateUrl]
      })
    }
    if (JSON.stringify(proxyConfig) != '{}') {
      await Browser.Storage.setLocal({ [key]: proxyConfig })
      if (key == result.status_proxyKey) {
        Browser.Proxy.reloadOrDirect()
      }
    }
  }
}
