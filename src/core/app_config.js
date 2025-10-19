import Browser from '@/Browser/main'

const LASTEST_VERSION_NUMBER = 2.3

export const convertToNewVersionConfig = async function () {
  await newVersionConfigTo1()
  await newVersionConfigTo2()
  await newVersionConfigTo2_1()
  await newVersionConfigTo2_2()
  await newVersionConfigTo2_3()
}

const newVersionConfigTo1 = async function () {
  const result = await Browser.Storage.getLocalAll()
  const add = {}
  const removeList = []
  if (result.config_version == null) {
    add.config_version = 1
  }
  if (result.config_autoSync == null) {
    add.config_autoSync = false
  }
  if (result.direct == null) {
    add.direct = {
      mode: 'direct',
      name: 'direct',
      tagColor: '#fff',
      config: { mode: 'direct' }
    }
  }
  if (result.system == null) {
    add.system = {
      mode: 'system',
      name: 'system',
      tagColor: '#000',
      config: { mode: 'system' }
    }
  }
  if (result.reject == null || result.reject?.config.rules == '') {
    add.reject = {
      mode: 'reject',
      name: 'reject',
      config: { mode: 'reject', rules: 'HTTPS 127.0.0.1:65432' }
    }
  }
  await Browser.Storage.setLocal(add)
  if (result.config_reject != null) {
    removeList.push('config_reject')
  }
  await Browser.Storage.removeLocal(removeList)
}

const newVersionConfigTo2 = async function () {
  const oldAppConfig = await Browser.Storage.getLocalAll()
  if (oldAppConfig['config_app_version'] == null) {
    const updatedProxyConfigList = transformReject(oldAppConfig)
    updatedProxyConfigList.forEach(async (item) => {
      await Browser.Storage.setLocal(item)
    })
    await Browser.Storage.setLocal({ config_app_version: 2 })
  }

  const oldSyncAppConfig = await Browser.Storage.getSyncAll()
  if (oldSyncAppConfig['config_app_version'] == null) {
    const updatedProxyConfigList = transformReject(oldSyncAppConfig)
    updatedProxyConfigList.forEach(async (item) => {
      await Browser.Storage.setSync(item)
    })
    await Browser.Storage.setSync({ config_app_version: 2 })
  }
}

const newVersionConfigTo2_1 = async function () {
  const oldAppConfig = await Browser.Storage.getLocalAll()
  if (oldAppConfig['config_app_version'] == '2') {
    const updatedProxyConfigList = transformTagColor(oldAppConfig)
    updatedProxyConfigList.forEach(async (item) => {
      await Browser.Storage.setLocal(item)
    })
    await Browser.Storage.setLocal({ config_app_version: 2.1 })
  }

  const oldSyncAppConfig = await Browser.Storage.getSyncAll()
  if (oldSyncAppConfig['config_app_version'] == '2') {
    const updatedProxyConfigList = transformTagColor(oldSyncAppConfig)
    updatedProxyConfigList.forEach(async (item) => {
      await Browser.Storage.setSync(item)
    })
    await Browser.Storage.setSync({ config_app_version: 2.1 })
  }
}

const newVersionConfigTo2_2 = async function () {
  const oldAppConfig = await Browser.Storage.getLocalAll()
  if (oldAppConfig['config_app_version'] == 2.1) {
    const updatedProxyConfigList = transformRulesSetFormat(oldAppConfig)
    updatedProxyConfigList.forEach(async (item) => {
      await Browser.Storage.setLocal(item)
    })
    await Browser.Storage.setLocal({ config_app_version: 2.2 })
  }

  const oldSyncAppConfig = await Browser.Storage.getSyncAll()
  if (oldSyncAppConfig['config_app_version'] == 2.1) {
    const updatedProxyConfigList = transformRulesSetFormat(oldSyncAppConfig)
    updatedProxyConfigList.forEach(async (item) => {
      await Browser.Storage.setSync(item)
    })
    await Browser.Storage.setSync({ config_app_version: 2.2 })
  }
}

const newVersionConfigTo2_3 = async function () {
  const oldAppConfig = await Browser.Storage.getLocalAll()
  if (oldAppConfig['config_app_version'] == 2.2) {
    const updatedProxyConfigList = transformAddSiteRuleConfig(oldAppConfig)
    console.log(updatedProxyConfigList)
    updatedProxyConfigList.forEach(async (item) => {
      await Browser.Storage.setLocal(item)
    })
    await Browser.Storage.setLocal({
      config_app_version: LASTEST_VERSION_NUMBER,
      config_updateUrl: oldAppConfig.config_updateUrl ? '24h' : 'disableAll',
      config_autoRefresh: true,
      config_siteRules: false,
      config_contextMenus: false,
      config_iconBtnHint: true
    })
  }

  const oldSyncAppConfig = await Browser.Storage.getSyncAll()
  if (oldSyncAppConfig['config_app_version'] == 2.2) {
    const updatedProxyConfigList = transformAddSiteRuleConfig(oldSyncAppConfig)
    updatedProxyConfigList.forEach(async (item) => {
      await Browser.Storage.setSync(item)
    })
    await Browser.Storage.setSync({
      config_app_version: LASTEST_VERSION_NUMBER,
      config_updateUrl: oldSyncAppConfig.config_updateUrl
        ? '24h'
        : 'disableAll',
      config_autoRefresh: true,
      config_siteRules: false,
      config_iconBtnHint: true
    })
  }
}

export const resetAppConfig = function () {
  const obj = {
    config_app_version: LASTEST_VERSION_NUMBER,
    config_ui: 'dark',
    config_updateUrl: '24h',
    config_monitor: false,
    config_autoRefresh: true,
    config_autoSync: false,
    config_contextMenus: false,
    config_version: 1,
    config_iptags: [],
    config_siteRules: false,
    config_iconBtnHint: true,
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
    },
    status_proxyKey: 'direct'
  }
  return obj
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

function transformTagColor(appConfig) {
  const updatedProxyConfigList = []
  Object.keys(appConfig).forEach((key) => {
    if (!key.startsWith('proxy_') && key != 'direct' && key != 'system') {
      return
    }
    const resObj = JSON.parse(JSON.stringify(appConfig[key]))
    resObj.tagColor = '#3498db'

    updatedProxyConfigList.push({ [key]: resObj })
  })
  return updatedProxyConfigList
}

function transformRulesSetFormat(appConfig) {
  const updatedProxyConfigList = []
  Object.keys(appConfig).forEach((key) => {
    if (!key.startsWith('proxy_')) {
      return
    }
    const resObj = JSON.parse(JSON.stringify(appConfig[key]))
    if (resObj.mode == 'auto') {
      resObj.config.rules.local.rulesSet.format = 'base64'
      resObj.config.rules.reject.rulesSet.format = 'base64'
      updatedProxyConfigList.push({ [key]: resObj })
    }
  })
  return updatedProxyConfigList
}

function transformAddSiteRuleConfig(appConfig) {
  const updatedProxyConfigList = []
  Object.keys(appConfig).forEach((key) => {
    if (!key.startsWith('proxy_')) {
      return
    }
    const resObj = JSON.parse(JSON.stringify(appConfig[key]))
    if (resObj.mode == 'auto') {
      resObj.config.rules.site = {
        rulesSet: {
          format: 'base64',
          url: '',
          urlUpdatedAt: '',
          data: '',
          proxy: 'direct',
          mode: 'autoProxy',
          valid: true
        },
        ruleList: []
      }
      updatedProxyConfigList.push({ [key]: resObj })
    } else if (resObj.mode == 'fixed_servers') {
      if (resObj.config.rules.singleProxy) {
        resObj.config.rules.fallbackProxy = JSON.parse(
          JSON.stringify(resObj.config.rules.singleProxy)
        )
        delete resObj.config.rules.singleProxy
      }
      updatedProxyConfigList.push({ [key]: resObj })
    }
  })
  return updatedProxyConfigList
}

export const __private__ = {
  transformReject
}
