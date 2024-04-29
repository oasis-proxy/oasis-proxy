import Message from './Message.js'
import { getAuthList } from '../../core/ProxyConfig.js'
import { pacScriptCreate } from '../../core/PacScript.js'

const Proxy = {}

Proxy.set = async function (
  proxyConfigs,
  key,
  afterSuccess = function () {},
  scope = 'regular'
) {
  const config = Proxy._createConfig(proxyConfigs, key)
  const authList = getAuthList(proxyConfigs, key)
  if (authList.length > 0) {
    const response = await Message.send({
      instruction: 'setProxyAuths',
      content: { status_auths: authList }
    })
  }
  Proxy._set(config, afterSuccess, scope)
}

Proxy.setDirect = async function (afterSuccess, scope = 'regular') {
  const config = Proxy._directConfig()
  const response = await Message.send({
    instruction: 'resetProxyAuths'
  })
  Proxy._set(config, afterSuccess, scope)
}

Proxy.setSystem = async function (afterSuccess, scope = 'regular') {
  const config = Proxy._systemConfig()
  const response = await Message.send({
    instruction: 'resetProxyAuths'
  })
  Proxy._set(config, afterSuccess, scope)
}

Proxy._set = function (config, afterSuccess, scope) {
  chrome.proxy.settings.set({ value: config, scope: scope }, () => {
    if (chrome.runtime.lastError) {
      console.error('设置代理失败: ', chrome.runtime.lastError)
    } else {
      console.info('代理设置成功！', config, scope)
      afterSuccess()
    }
  })
}

Proxy._createConfig = function (proxyConfigs, key) {
  switch (proxyConfigs[key].mode) {
    case 'direct':
      return Proxy._directConfig()
    case 'system':
      return Proxy._systemConfig()
    case 'fixed_servers':
      return Proxy._fixedConfig(proxyConfigs[key].config)
    case 'pac_script':
      return Proxy._pacConfig(proxyConfigs[key].config)
    case 'auto':
      return Proxy._autoConfig(proxyConfigs, key)
    default:
      return {}
  }
}

Proxy._directConfig = function () {
  return { mode: 'direct' }
}

Proxy._systemConfig = function () {
  return { mode: 'system' }
}

Proxy._fixedConfig = function (proxyConfig) {
  const config = { mode: 'fixed_servers', rules: {} }
  if (
    proxyConfig.rules.hasOwnProperty('singleProxy') &&
    proxyConfig.rules.singleProxy.scheme != 'direct' &&
    proxyConfig.rules.singleProxy.host != null &&
    proxyConfig.rules.singleProxy.host != ''
  ) {
    config.rules.singleProxy = Proxy._getFixedServer(
      proxyConfig.rules.singleProxy
    )
  } else {
    config.rules = {}
    if (
      proxyConfig.rules.hasOwnProperty('proxyForHttp') &&
      proxyConfig.rules.proxyForHttp.host != null &&
      proxyConfig.rules.proxyForHttp.host != ''
    ) {
      config.rules.proxyForHttp = Proxy._getFixedServer(
        proxyConfig.rules.proxyForHttp
      )
    }
    if (
      proxyConfig.rules.hasOwnProperty('proxyForHttps') &&
      proxyConfig.rules.proxyForHttps.host != null &&
      proxyConfig.rules.proxyForHttps.host != ''
    ) {
      config.rules.proxyForHttps = Proxy._getFixedServer(
        proxyConfig.rules.proxyForHttps
      )
    }
    if (
      proxyConfig.rules.hasOwnProperty('proxyForFtp') &&
      proxyConfig.rules.proxyForFtp.host != null &&
      proxyConfig.rules.proxyForFtp.host != ''
    ) {
      config.rules.proxyForFtp = Proxy._getFixedServer(
        proxyConfig.rules.proxyForFtp
      )
    }
    if (
      proxyConfig.rules.hasOwnProperty('fallbackProxy') &&
      proxyConfig.rules.fallbackProxy.host != null &&
      proxyConfig.rules.fallbackProxy.host != '' &&
      proxyConfig.rules.fallbackProxy.scheme != 'direct'
    ) {
      config.rules.fallbackProxy = Proxy._getFixedServer(
        proxyConfig.rules.fallbackProxy
      )
    }
  }
  if (JSON.stringify(config.rules) == '{}') return { mode: 'direct' }
  if (proxyConfig.rules.hasOwnProperty('bypassList'))
    config.rules.bypassList = JSON.parse(
      JSON.stringify(proxyConfig.rules.bypassList)
    )
  return config
}

Proxy._autoConfig = function (proxyConfigs, key) {
  const config = { mode: 'pac_script', pacScript: {} }
  const codeBlock = pacScriptCreate(proxyConfigs, key)
  config.pacScript = {
    data: codeBlock
  }
  return config
}

Proxy._pacConfig = function (proxyConfig) {
  const config = { mode: 'pac_script', pacScript: {} }
  if (proxyConfig.rules.url != null && proxyConfig.rules.url !== '') {
    config.pacScript.url = proxyConfig.rules.url
  } else if (proxyConfig.rules.data != null && proxyConfig.rules.data !== '') {
    config.pacScript.data = proxyConfig.rules.data
  } else {
    return -1
  }
  return config
}

// proxyRules = {host, port, scheme, username, password}
Proxy._getFixedServer = function (proxyRules) {
  const config = { scheme: proxyRules.scheme, host: proxyRules.host }
  if (proxyRules.port != null) {
    config.port = proxyRules.port
  }
  return config
}

export default Proxy
