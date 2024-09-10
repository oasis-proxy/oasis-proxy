import { downloadUrl } from './utils.js'

export const CONST_DEFAULT_PORT = {
  http: 80,
  https: 443,
  socks4: 1080,
  socks5: 1080
}

export const createProxy = function (name, tagColor, mode) {
  if (name == null || name == '' || mode == null || mode == '') {
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
              url: '',
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
              url: '',
              urlUpdatedAt: '',
              data: '',
              proxy: '+reject',
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

// 返回所有使用代理的名称，包含direct和reject
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

  for (const [i, e] of proxyConfig.config.rules.local.ruleList.entries()) {
    if (e.proxy == proxyOldName) {
      tmp.config.rules.local.ruleList[i].proxy = proxyNewName
    }
  }

  if (proxyConfig.config.rules.local.rulesSet?.proxy == proxyOldName) {
    tmp.config.rules.local.rulesSet.proxy = proxyNewName
  }

  return tmp
}

export const saveForPac = function (
  name,
  tagColor,
  data,
  url = '',
  urlUpdatedAt = ''
) {
  if (name == null || name == '') {
    return -1
  }
  return {
    name,
    tagColor,
    mode: 'pac_script',
    config: { mode: 'pac_script', rules: { url, urlUpdatedAt, data } }
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
  if (name == null || name == '') {
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
  if (
    proxyForHttp.scheme == 'default' &&
    proxyForHttps.scheme == 'default' &&
    proxyForFtp.scheme == 'default'
  ) {
    if (fallbackProxy.scheme != 'direct') {
      tmp.config.rules.singleProxy = JSON.parse(JSON.stringify(fallbackProxy))
    }
  } else {
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
  }
  return tmp
}

export const saveForAuto = function (
  name,
  tagColor,
  defaultProxy,
  localRuleList,
  rejectRuleList,
  localRulesSet,
  rejectRulesSet
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
            url: localRulesSet.url,
            urlUpdatedAt: localRulesSet.urlUpdatedAt,
            data: localRulesSet.data,
            proxy: localRulesSet.proxy,
            mode: 'autoProxy',
            valid: localRulesSet.valid
          },
          ruleList: []
        },
        reject: {
          rulesSet: {
            url: rejectRulesSet.url,
            urlUpdatedAt: rejectRulesSet.urlUpdatedAt,
            data: rejectRulesSet.data,
            proxy: '+reject',
            mode: 'autoProxy',
            valid: rejectRulesSet.valid
          },
          ruleList: []
        }
      }
    }
  }
  tmp.config.rules.local.ruleList = JSON.parse(JSON.stringify(localRuleList))
  tmp.config.rules.reject.ruleList = JSON.parse(JSON.stringify(rejectRuleList))
  return tmp
}

export const addLocalRuleItemForAuto = function (localRuleList, proxyConfig) {
  const tmpProxyConfig = JSON.parse(JSON.stringify(proxyConfig))
  if (tmpProxyConfig.mode == 'auto') {
    for (const item of localRuleList) {
      let isExistRule = false
      for (const e of tmpProxyConfig.config.rules.local.ruleList) {
        if (JSON.stringify(e) == JSON.stringify(item)) {
          isExistRule = true
          break
        }
      }
      if (!isExistRule) {
        tmpProxyConfig.config.rules.local.ruleList.unshift(item)
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
  if (
    config.rules.singleProxy?.username != null &&
    config.rules.singleProxy?.username != ''
  ) {
    port = config.rules.singleProxy.port
    if (port == null) {
      port = CONST_DEFAULT_PORT[config.rules.singleProxy.scheme]
    }
    return [
      {
        host: config.rules.singleProxy.host,
        port: port,
        username: config.rules.singleProxy.username,
        password: config.rules.singleProxy.password
      }
    ]
  } else {
    const authList = []
    if (
      config.rules.proxyForHttp?.username != null &&
      config.rules.proxyForHttp?.username != ''
    ) {
      port = config.rules.proxyForHttp.port
      if (port == null) {
        port = CONST_DEFAULT_PORT[config.rules.proxyForHttp.scheme]
      }
      authList.push({
        host: config.rules.proxyForHttp.host,
        port: port,
        username: config.rules.proxyForHttp.username,
        password: config.rules.proxyForHttp.password
      })
    }
    if (
      config.rules.proxyForHttps?.username != null &&
      config.rules.proxyForHttps?.username != ''
    ) {
      port = config.rules.proxyForHttps.port
      if (port == null) {
        port = CONST_DEFAULT_PORT[config.rules.proxyForHttps.scheme]
      }
      authList.push({
        host: config.rules.proxyForHttps.host,
        port: port,
        username: config.rules.proxyForHttps.username,
        password: config.rules.proxyForHttps.password
      })
    }
    if (
      config.rules.proxyForFtp?.username != null &&
      config.rules.proxyForFtp?.username != ''
    ) {
      port = config.rules.proxyForFtp.port
      if (port == null) {
        port = CONST_DEFAULT_PORT[config.rules.proxyForFtp.scheme]
      }
      authList.push({
        host: config.rules.proxyForFtp.host,
        port: port,
        username: config.rules.proxyForFtp.username,
        password: config.rules.proxyForFtp.password
      })
    }
    if (
      config.rules.fallbackProxy?.username != null &&
      config.rules.fallbackProxy?.username != ''
    ) {
      port = config.rules.fallbackProxy.port
      if (port == null) {
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
}

export const updateRulesSetData = async function (
  proxyConfig,
  subjectList = ['reject', 'local']
) {
  let updateFlag = false
  let response
  try {
    for (const element of subjectList) {
      if (proxyConfig.config.rules[element]?.rulesSet.url != '') {
        response = await downloadUrl(
          proxyConfig.config.rules[element]?.rulesSet.url,
          'base64'
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
  'config_syncTime'
]

export const simplify = function (config) {
  const simplifyConfig = {}
  for (const key of Object.keys(config)) {
    if (key.startsWith('proxy_')) {
      switch (config[key].mode) {
        case 'auto':
          simplifyConfig[key] = config[key]
          if (config[key].config.rules.local.rulesSet.url != '') {
            simplifyConfig[key].config.rules.local.rulesSet.data = ''
          }
          if (config[key].config.rules.reject.rulesSet.url != '') {
            simplifyConfig[key].config.rules.reject.rulesSet.data = ''
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
          if (config[key].config.rules.local.rulesSet.url != '') {
            response = await downloadUrl(
              config[key].config.rules.local.rulesSet.url,
              'base64'
            )
            if (JSON.stringify(response) != '{}') {
              enrichConfig[key].config.rules.local.rulesSet.data = response.data
              enrichConfig[key].config.rules.local.rulesSet.urlUpdatedAt =
                response.updated
            }
          }
          if (config[key].config.rules.reject.rulesSet.url != '') {
            response = await downloadUrl(
              config[key].config.rules.reject.rulesSet.url,
              'base64'
            )
            if (JSON.stringify(response) != '{}') {
              enrichConfig[key].config.rules.reject.rulesSet.data =
                response.data
              enrichConfig[key].config.rules.reject.rulesSet.urlUpdatedAt =
                response.updated
            }
          }
          break
        case 'pac_script':
          enrichConfig[key] = config[key]
          if (config[key].config.rules.url != '') {
            response = await downloadUrl(config[key].config.rules.url, 'base64')
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
