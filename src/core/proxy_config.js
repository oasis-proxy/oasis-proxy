import { downloadUrl, objIsEqual, enumInterval } from './utils.js'

export const CONST_DEFAULT_PORT = {
  http: 80,
  https: 443,
  socks4: 1080,
  socks5: 1080
}

export const createProxy = function (name, tagColor, mode) {
  if (!name || !mode) {
    return -1
  }
  let proxy = { name, tagColor, mode, config: { mode: mode } }
  switch (mode) {
    case 'auto':
      proxy.config = {
        mode: 'auto',
        rules: {
          defaultProxy: 'direct',
          local: {
            rulesSet: {
              format: 'base64',
              url: '',
              updateInterval: 'default',
              urlUpdatedAt: '',
              data: '',
              proxy: 'direct',
              mode: 'autoProxy',
              valid: true
            },
            ruleList: []
          },
          reject: {
            rulesSet: {
              format: 'base64',
              url: '',
              urlUpdatedAt: '',
              updateInterval: 'default',
              data: '',
              proxy: '+reject',
              mode: 'autoProxy',
              valid: true
            },
            ruleList: []
          },
          site: {
            rulesSet: {
              format: 'base64',
              url: '',
              updateInterval: 'default',
              urlUpdatedAt: '',
              data: '',
              proxy: 'direct',
              mode: 'autoProxy',
              valid: true
            },
            ruleList: []
          }
        }
      }
      break
    case 'pac_script':
      proxy.config = {
        mode: 'pac_script',
        rules: {
          url: '',
          updateInterval: 'default',
          urlUpdatedAt: '',
          data: ''
        }
      }
      break
    case 'fixed_servers':
      proxy.config = {
        mode: 'fixed_servers',
        rules: {
          bypassList: ['127.0.0.1', '::1', 'localhost']
        }
      }
      break
    default:
      break
  }
  return proxy
}

// get server names of the autoproxy , include direct and reject
export const proxyUses = function (proxyConfig) {
  const proxyNames = ['reject']
  if (proxyConfig.mode !== 'auto') {
    return proxyNames
  }
  // default proxy
  let tmpName = proxyConfig.config.rules.defaultProxy
  proxyNames.push(tmpName.startsWith('+') ? tmpName.substring(1) : tmpName)

  // local ruleList
  proxyConfig.config.rules.local.ruleList.forEach((item) => {
    tmpName = item.proxy
    proxyNames.push(tmpName.startsWith('+') ? tmpName.substring(1) : tmpName)
  })

  // local rulesSet
  tmpName = proxyConfig.config.rules.local.rulesSet?.proxy
  proxyNames.push(tmpName.startsWith('+') ? tmpName.substring(1) : tmpName)

  // site ruleList
  proxyConfig.config.rules.site.ruleList.forEach((item) => {
    tmpName = item.proxy
    proxyNames.push(tmpName.startsWith('+') ? tmpName.substring(1) : tmpName)
  })

  // site rulesSet
  tmpName = proxyConfig.config.rules.site.rulesSet?.proxy
  proxyNames.push(tmpName.startsWith('+') ? tmpName.substring(1) : tmpName)

  const uniqNames = [...new Set(proxyNames)]
  return uniqNames
}

export const proxyUsedBy = function (searchName, proxyConfigs) {
  const proxyNames = []
  if (proxyConfigs['proxy_' + searchName].mode !== 'fixed_servers') {
    return proxyNames
  }
  for (const key of Object.keys(proxyConfigs)) {
    if (
      proxyConfigs[key].mode == 'auto' &&
      proxyUses(proxyConfigs[key]).includes(searchName)
    ) {
      proxyNames.push(key.substring(6))
    }
  }

  return proxyNames
}

export const replaceProxyNameForAllProxy = function (
  oldName,
  newName,
  proxyConfigs
) {
  const proxyNames = proxyUsedBy(oldName, proxyConfigs)
  const resConfigs = {}
  proxyNames.forEach((name) => {
    resConfigs['proxy_' + name] = replaceProxyNameForSingleProxy(
      oldName,
      newName,
      proxyConfigs['proxy_' + name]
    )
  })
  resConfigs['proxy_' + newName] = proxyConfigs['proxy_' + oldName]
  resConfigs['proxy_' + newName].name = newName
  return resConfigs
}

export const replaceProxyNameForSingleProxy = function (
  oldName,
  newName,
  proxyConfig
) {
  const tmp = JSON.parse(JSON.stringify(proxyConfig))
  const proxyOldName = '+' + oldName
  const proxyNewName = '+' + newName

  if (proxyConfig.config.rules.defaultProxy == proxyOldName) {
    tmp.config.rules.defaultProxy = proxyNewName
  }

  for (const s of ['local', 'site']) {
    for (const [i, e] of proxyConfig.config.rules[s].ruleList.entries()) {
      if (e.proxy == proxyOldName) {
        tmp.config.rules[s].ruleList[i].proxy = proxyNewName
      }
    }

    if (proxyConfig.config.rules[s].rulesSet?.proxy == proxyOldName) {
      tmp.config.rules[s].rulesSet.proxy = proxyNewName
    }
  }

  return tmp
}

export const saveForPac = function (
  name,
  tagColor,
  data,
  url = '',
  urlUpdatedAt = '',
  updateInterval = 'default'
) {
  if (!name) {
    return -1
  }
  return {
    name,
    tagColor,
    mode: 'pac_script',
    config: {
      mode: 'pac_script',
      rules: { url, urlUpdatedAt, updateInterval, data }
    }
  }
}

export const saveForFixed = function (
  name,
  tagColor,
  fallbackProxy,
  proxyForHttp,
  proxyForHttps,
  proxyForFtp,
  bypassList = ''
) {
  if (!name) {
    return -1
  }
  let tmp = {
    name,
    tagColor,
    mode: 'fixed_servers',
    config: {
      mode: 'fixed_servers',
      rules: {
        bypassList: bypassList.split('\n')
      }
    }
  }
  if (proxyForHttp.scheme != 'default') {
    tmp.config.rules.proxyForHttp = JSON.parse(JSON.stringify(proxyForHttp))
  }
  if (proxyForHttps.scheme != 'default') {
    tmp.config.rules.proxyForHttps = JSON.parse(JSON.stringify(proxyForHttps))
  }
  if (proxyForFtp.scheme != 'default') {
    tmp.config.rules.proxyForFtp = JSON.parse(JSON.stringify(proxyForFtp))
  }
  if (fallbackProxy.scheme != 'direct') {
    tmp.config.rules.fallbackProxy = JSON.parse(JSON.stringify(fallbackProxy))
  }
  return tmp
}

export const saveForAuto = function (
  name,
  tagColor,
  defaultProxy,
  localRuleList,
  rejectRuleList,
  siteRuleList,
  localRulesSet,
  rejectRulesSet,
  siteRulesSet
) {
  let tmp = {
    name,
    tagColor,
    mode: 'auto',
    config: {
      mode: 'auto',
      rules: {
        defaultProxy,
        local: {
          rulesSet: {
            format: localRulesSet.format,
            url: localRulesSet.url,
            urlUpdatedAt: localRulesSet.urlUpdatedAt,
            updateInterval: localRulesSet.updateInterval,
            data: localRulesSet.data,
            proxy: localRulesSet.proxy,
            mode: 'autoProxy',
            valid: localRulesSet.valid
          },
          ruleList: []
        },
        reject: {
          rulesSet: {
            format: rejectRulesSet.format,
            url: rejectRulesSet.url,
            urlUpdatedAt: rejectRulesSet.urlUpdatedAt,
            updateInterval: rejectRulesSet.updateInterval,
            data: rejectRulesSet.data,
            proxy: '+reject',
            mode: 'autoProxy',
            valid: rejectRulesSet.valid
          },
          ruleList: []
        },
        site: {
          rulesSet: {
            format: siteRulesSet.format,
            url: siteRulesSet.url,
            urlUpdatedAt: siteRulesSet.urlUpdatedAt,
            updateInterval: siteRulesSet.updateInterval,
            data: siteRulesSet.data,
            proxy: siteRulesSet.proxy,
            mode: 'autoProxy',
            valid: siteRulesSet.valid
          },
          ruleList: []
        }
      }
    }
  }
  tmp.config.rules.local.ruleList = JSON.parse(JSON.stringify(localRuleList))
  tmp.config.rules.reject.ruleList = JSON.parse(JSON.stringify(rejectRuleList))
  tmp.config.rules.site.ruleList = JSON.parse(JSON.stringify(siteRuleList))
  return tmp
}

export const addRuleItemForAuto = function (
  ruleList,
  proxyConfig,
  subject = 'local'
) {
  const tmpProxyConfig = JSON.parse(JSON.stringify(proxyConfig))
  if (tmpProxyConfig.mode == 'auto') {
    for (const item of ruleList) {
      let isExistRule = false
      for (const e of tmpProxyConfig.config.rules[subject].ruleList) {
        if (objIsEqual(e, item)) {
          isExistRule = true
          break
        }
      }
      if (!isExistRule) {
        tmpProxyConfig.config.rules[subject].ruleList.unshift(item)
      }
    }
    return tmpProxyConfig
  }
  return null
}

export const getAllAuthList = function (proxyConfigs) {
  const AllAuthList = []
  Object.keys(proxyConfigs).forEach((key) => {
    if (proxyConfigs[key].mode == 'fixed_servers')
      AllAuthList.push(...getAuthListInFixed(proxyConfigs[key]))
  })
  return AllAuthList
}

export const getAuthList = function (proxyConfigs, key) {
  switch (proxyConfigs[key].mode) {
    case 'direct':
      return []
    case 'system':
      return []
    case 'fixed_servers':
      return getAuthListInFixed(proxyConfigs[key])
    case 'pac_script':
      return []
    case 'auto':
      return getAuthListInAuto(proxyConfigs, key)
    default:
      return []
  }
}

function getAuthListInAuto(proxyConfigs, key) {
  const authList = []
  const proxyNames = proxyUses(proxyConfigs[key])
  for (const name of proxyNames) {
    if (name !== 'direct' && name !== 'reject')
      getAuthListInFixed(proxyConfigs['proxy_' + name]).forEach((item) => {
        authList.push(item)
      })
  }

  const uniqAuthList = [...new Set(authList)]
  return uniqAuthList
}

function getAuthListInFixed(proxyConfig) {
  const config = proxyConfig.config
  let port = null
  const authList = []
  if (config.rules.proxyForHttp?.username) {
    port = config.rules.proxyForHttp.port
    if (!port) {
      port = CONST_DEFAULT_PORT[config.rules.proxyForHttp.scheme]
    }
    authList.push({
      host: config.rules.proxyForHttp.host,
      port: port,
      username: config.rules.proxyForHttp.username,
      password: config.rules.proxyForHttp.password
    })
  }
  if (config.rules.proxyForHttps?.username) {
    port = config.rules.proxyForHttps.port
    if (!port) {
      port = CONST_DEFAULT_PORT[config.rules.proxyForHttps.scheme]
    }
    authList.push({
      host: config.rules.proxyForHttps.host,
      port: port,
      username: config.rules.proxyForHttps.username,
      password: config.rules.proxyForHttps.password
    })
  }
  if (config.rules.proxyForFtp?.username) {
    port = config.rules.proxyForFtp.port
    if (!port) {
      port = CONST_DEFAULT_PORT[config.rules.proxyForFtp.scheme]
    }
    authList.push({
      host: config.rules.proxyForFtp.host,
      port: port,
      username: config.rules.proxyForFtp.username,
      password: config.rules.proxyForFtp.password
    })
  }
  if (config.rules.fallbackProxy?.username) {
    port = config.rules.fallbackProxy.port
    if (!port) {
      port = CONST_DEFAULT_PORT[config.rules.fallbackProxy.scheme]
    }
    authList.push({
      host: config.rules.fallbackProxy.host,
      port: port,
      username: config.rules.fallbackProxy.username,
      password: config.rules.fallbackProxy.password
    })
  }
  return authList
}

/**
 *
 * @param {*} proxyConfig
 * @param {*} param1
 * @returns proxyConfig or {}
 *
 * params:
 *  interval: 0 means update inmediately, otherwise check if need to update by interval
 *
 */
export const updatePacData = async function (proxyConfig, { interval = 0 }) {
  let updateFlag = false
  let response
  try {
    let interval_ms = 0
    // Check if update inmediately(interval = 0)
    if (interval != 0) {
      const proxyUpdateInterval = proxyConfig.config.rules.updateInterval
      // if proxyUpdateInterval is manual, do not update automatically
      if (proxyUpdateInterval == 'manual') {
        return {}
      }

      if (proxyUpdateInterval == 'default' && interval == 'manual') {
        // if proxyUpdateInterval is default and system is manual,
        // do not update automatically,
        return {}
      } else if (proxyUpdateInterval == 'default' && interval != 'manual') {
        // interval is set by system
        interval_ms = interval * 60 * 1000
      } else {
        // if proxyUpdateInterval != default and != manual,
        // interval is set by proxyUpdateInterval
        interval_ms = enumInterval[proxyUpdateInterval] * 60 * 1000
      }

      const currTime = Date.now()
      const lastTime = new Date(proxyConfig.config.rules.urlUpdatedAt).getTime()
      if (currTime - lastTime < interval_ms) {
        return {}
      }
    }
    if (proxyConfig.config.rules.url) {
      response = await downloadUrl(proxyConfig.config.rules.url)

      if (JSON.stringify(response) != '{}') {
        proxyConfig.config.rules.data = response.data
        proxyConfig.config.rules.urlUpdatedAt = response.updated
        updateFlag = true
      }
    }

    if (updateFlag) {
      return proxyConfig
    } else {
      return {}
    }
  } catch (err) {
    console.error(err)
    return {}
  }
}

export const updateRulesSetData = async function (
  proxyConfig,
  { subjectList = ['reject', 'local', 'site'], interval = 0 }
) {
  let updateFlag = false
  let response
  try {
    for (const element of subjectList) {
      let interval_ms = 0
      // Check if update inmediately(interval = 0)
      if (interval != 0) {
        const proxyUpdateInterval =
          proxyConfig.config.rules[element].rulesSet.updateInterval
        // if proxyUpdateInterval is manual, do not update automatically
        if (proxyUpdateInterval == 'manual') {
          continue
        }

        if (proxyUpdateInterval == 'default' && interval == 'manual') {
          // if proxyUpdateInterval is default and system is manual,
          // do not update automatically,
          continue
        } else if (proxyUpdateInterval == 'default' && interval != 'manual') {
          // interval is set by system
          interval_ms = interval * 60 * 1000
        } else {
          // if proxyUpdateInterval != default and != manual,
          // interval is set by proxyUpdateInterval
          interval_ms = enumInterval[proxyUpdateInterval] * 60 * 1000
        }

        const currTime = Date.now()
        const lastTime = new Date(
          proxyConfig.config.rules[element].rulesSet.urlUpdatedAt
        ).getTime()
        if (currTime - lastTime < interval_ms) {
          continue
        }
      }
      if (proxyConfig.config.rules[element]?.rulesSet.url) {
        response = await downloadUrl(
          proxyConfig.config.rules[element]?.rulesSet.url,
          proxyConfig.config.rules[element]?.rulesSet.format
        )

        if (JSON.stringify(response) != '{}') {
          proxyConfig.config.rules[element].rulesSet.data = response.data
          proxyConfig.config.rules[element].rulesSet.urlUpdatedAt =
            response.updated
          updateFlag = true
        }
      }
    }
    if (updateFlag) {
      return proxyConfig
    } else {
      return {}
    }
  } catch (err) {
    console.error(err)
    return {}
  }
}

const SYNC_CONFIG_KEY_LIST = [
  'config_app_version',
  'config_iptags',
  'config_syncTime',
  'config_updateUrl',
  'config_autoRefresh',
  'config_siteRules',
  'config_iconBtnHint'
]

export const simplify = function (config) {
  const simplifyConfig = {}
  for (const key of Object.keys(config)) {
    if (key.startsWith('proxy_')) {
      switch (config[key].mode) {
        case 'auto':
          simplifyConfig[key] = config[key]
          for (const s of ['local', 'reject', 'site']) {
            if (config[key].config.rules[s].rulesSet.url != '') {
              simplifyConfig[key].config.rules[s].rulesSet.data = ''
            }
          }
          break
        case 'pac_script':
          simplifyConfig[key] = config[key]
          if (config[key].config.rules.url != '') {
            simplifyConfig[key].config.rules.data = ''
          }
          break
        case 'fixed_servers':
          simplifyConfig[key] = config[key]
          break
        default:
          break
      }
    }
  }
  SYNC_CONFIG_KEY_LIST.forEach((key) => {
    if (config[key] != null) {
      simplifyConfig[key] = config[key]
    }
  })
  return simplifyConfig
}

export const enrich = async function (config) {
  const enrichConfig = {}
  for (const key of Object.keys(config)) {
    if (key.startsWith('proxy_')) {
      let response
      switch (config[key].mode) {
        case 'auto':
          enrichConfig[key] = config[key]
          for (const s of ['local', 'reject', 'site']) {
            if (config[key].config.rules[s].rulesSet.url != '') {
              response = await downloadUrl(
                config[key].config.rules[s].rulesSet.url,
                config[key].config.rules[s].rulesSet.format
              )
              if (JSON.stringify(response) != '{}') {
                enrichConfig[key].config.rules[s].rulesSet.data = response.data
                enrichConfig[key].config.rules[s].rulesSet.urlUpdatedAt =
                  response.updated
              }
            }
          }
          break
        case 'pac_script':
          enrichConfig[key] = config[key]
          if (config[key].config.rules.url != '') {
            response = await downloadUrl(config[key].config.rules.url)
            if (JSON.stringify(response) != '{}') {
              enrichConfig[key].config.rules.data = response.data
              enrichConfig[key].config.rules.urlUpdatedAt = response.updated
            }
          }
          break
        case 'fixed_servers':
          enrichConfig[key] = config[key]
          break
        default:
          break
      }
    }
  }
  SYNC_CONFIG_KEY_LIST.forEach((key) => {
    if (config[key] != null) {
      enrichConfig[key] = config[key]
    }
  })
  return enrichConfig
}
