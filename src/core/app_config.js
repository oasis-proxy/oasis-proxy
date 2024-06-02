import Browser from '@/Browser/main'

export const convertToNewVersionConfig = async function (toVersion) {
  const oldAppConfig = await Browser.Storage.getLocalAll()
  if (oldAppConfig['config_app_version'] == null) {
    if (toVersion == 2) {
      const updatedProxyConfigList = transformReject(oldAppConfig)
      updatedProxyConfigList.forEach(async (item) => {
        await Browser.Storage.setLocal(item)
      })
      await Browser.Storage.setLocal({ config_app_version: 2 })
    }
  }
}

// version null to 2
function transformReject(appConfig) {
  const updatedProxyConfigList = []
  Object.keys(appConfig).forEach((key) => {
    if (!key.startsWith('proxy_') || appConfig[key].mode != 'auto') {
      return
    }
    const resObj = JSON.parse(JSON.stringify(appConfig[key]))

    const rejecRuleList = appConfig[key].config.rules.internal.filter(
      (element) => {
        return element.proxy == '+reject'
      }
    )
    const localRuleList = appConfig[key].config.rules.internal.filter(
      (element) => {
        return element.proxy != '+reject'
      }
    )

    resObj.config = {
      mode: 'auto',
      rules: {
        defaultProxy: appConfig[key].config.rules.defaultProxy,
        local: {
          rulesSet: {
            url: appConfig[key].config.rules.external.url,
            urlUpdatedAt: appConfig[key].config.rules.external.urlUpdatedAt,
            data: appConfig[key].config.rules.external.data,
            proxy: appConfig[key].config.rules.external.proxy,
            mode: 'autoProxy',
            valid: true
          },
          ruleList: JSON.parse(JSON.stringify(localRuleList))
        },
        reject: {
          rulesSet: {
            url: appConfig[key].config.rules.reject.url,
            urlUpdatedAt: appConfig[key].config.rules.reject.urlUpdatedAt,
            data: appConfig[key].config.rules.reject.data,
            proxy: '+reject',
            mode: 'autoProxy',
            valid: true
          },
          ruleList: JSON.parse(JSON.stringify(rejecRuleList))
        }
      }
    }

    updatedProxyConfigList.push({ [key]: resObj })
  })
  return updatedProxyConfigList
}
