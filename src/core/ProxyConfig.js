export const CONST_DEFAULT_PORT = {
  http: 80,
  https: 443,
  socks4: 1080,
  socks5: 1080
}

export const createProxy = function (name, mode) {
  if (name == null || name == '' || mode == null || mode == '') {
    return -1
  }
  let proxy = { name, mode, config: { mode: mode } }
  switch (mode) {
    case 'auto':
      proxy.config = {
        mode: 'auto',
        rules: {
          defaultProxy: 'direct',
          internal: [],
          external: {
            url: '',
            urlUpdatedAt: '',
            data: '',
            proxy: 'direct',
            mode: 'autoProxy'
          },
          reject: {
            url: '',
            urlUpdatedAt: '',
            data: '',
            proxy: '+reject',
            mode: 'autoProxy'
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
  const proxyNames = []
  if (proxyConfig.mode !== 'auto') {
    return proxyNames
  }
  // default proxy
  let tmpName = proxyConfig.config.rules.defaultProxy
  proxyNames.push(tmpName.startsWith('+') ? tmpName.substring(1) : tmpName)

  // internal rules
  proxyConfig.config.rules.internal.forEach((item) => {
    tmpName = item.proxy
    proxyNames.push(tmpName.startsWith('+') ? tmpName.substring(1) : tmpName)
  })

  // external rules
  tmpName = proxyConfig.config.rules.external?.proxy
  proxyNames.push(tmpName.startsWith('+') ? tmpName.substring(1) : tmpName)

  // reject rules
  tmpName = proxyConfig.config.rules.reject?.proxy
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

  for (const [i, e] of proxyConfig.config.rules.internal.entries()) {
    if (e.proxy == proxyOldName) {
      tmp.config.rules.internal[i].proxy = proxyNewName
    }
  }

  if (proxyConfig.config.rules.external?.proxy == proxyOldName) {
    tmp.config.rules.external.proxy = proxyNewName
  }

  return tmp
}

export const saveForPac = function (name, data, url = '', urlUpdatedAt = '') {
  if (name == null || name == '') {
    return -1
  }
  return {
    name,
    mode: 'pac_script',
    config: { mode: 'pac_script', rules: { url, urlUpdatedAt, data } }
  }
}

export const saveForFixed = function (
  name,
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
  defaultProxy,
  internalRules,
  externalProxy,
  externalRule,
  rejectRule
) {
  let tmp = {
    name,
    mode: 'auto',
    config: {
      mode: 'auto',
      rules: {
        defaultProxy,
        internal: [],
        external: {
          url: externalRule.url,
          urlUpdatedAt: externalRule.urlUpdatedAt,
          data: externalRule.data,
          proxy: externalProxy,
          mode: 'autoProxy'
        },
        reject: {
          url: rejectRule.url,
          urlUpdatedAt: rejectRule.urlUpdatedAt,
          data: rejectRule.data,
          proxy: '+reject',
          mode: 'autoProxy'
        }
      }
    }
  }
  tmp.config.rules.internal = JSON.parse(JSON.stringify(internalRules))
  return tmp
}

export const addInternalRulesForAuto = function (internalRules, proxyConfig) {
  const tmpProxyConfig = JSON.parse(JSON.stringify(proxyConfig))
  if (tmpProxyConfig.mode == 'auto') {
    for (const item of internalRules) {
      let isExistRule = false
      for (const e of tmpProxyConfig.config.rules.internal) {
        if (JSON.stringify(e) == JSON.stringify(item)) {
          isExistRule = true
          break
        }
      }
      if (!isExistRule) {
        tmpProxyConfig.config.rules.internal.unshift(item)
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
