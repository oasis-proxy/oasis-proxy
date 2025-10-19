import { generatePacfile } from '@/core/pacfile_generator.js'
import { setSiteRuleListToSession } from '@/core/siterules.js'
import { subStringForName, filterPrefixArray, log } from '@/core/utils.js'
import Storage from './storage.js'
import Action from './action.js'
import I18n from './i18n.js'

const Proxy = {}
Proxy.reloadOrDirect = async function (
  afterSuccess = () => {},
  isClearSessionStorage = false
) {
  if (isClearSessionStorage) {
    await Storage.clearSession()
  }
  const proxyConfigs = await Storage.getLocalAll()
  const key = proxyConfigs.status_proxyKey
  if (key == 'direct' || key == 'system') {
    afterSuccess()
    return
  } else if (Object.keys(proxyConfigs).includes(key)) {
    let tempRules = []
    if (proxyConfigs.config_siteRules && proxyConfigs[key].mode == 'auto') {
      const sessionStorage = await Storage.getSessionAll()
      tempRules = filterPrefixArray(sessionStorage, 'tempRule_')
    }
    const config = await createConfig(proxyConfigs, key, tempRules)
    set(config, async () => {
      await Action.setBadgeBackgroundColor(proxyConfigs[key].tagColor)
      await Action.setBadgeText(subStringForName(proxyConfigs[key].name))
      afterSuccess()
    })
  } else {
    Proxy.setDirect(async () => {
      afterSuccess()
    })
  }
}

Proxy.set = async function (proxyConfigs, key, afterSuccess = () => {}) {
  await Storage.clearSession()
  let tempRules = []
  if (proxyConfigs[key].mode == 'auto' && proxyConfigs.config_siteRules) {
    setSiteRuleListToSession(proxyConfigs[key])
    const sessionStorage = await Storage.getSessionAll()
    tempRules = filterPrefixArray(sessionStorage, 'tempRule_')
  }
  log.debug('set proxy with tempRules', tempRules)
  const config = await createConfig(proxyConfigs, key, tempRules)
  set(config, async () => {
    await Action.setBadgeBackgroundColor(proxyConfigs[key].tagColor)
    await Action.setBadgeText(subStringForName(proxyConfigs[key].name))
    afterSuccess()
  })
}

Proxy.setDirect = async function (afterSuccess = () => {}) {
  await Storage.clearSession()
  const config = directConfig()
  set(config, async () => {
    await Storage.setLocal({ status_proxyKey: 'direct' })
    await Action.setBadgeBackgroundColor('#fff')
    await Action.setBadgeText('Dir')
    afterSuccess()
  })
}

Proxy.setSystem = async function (afterSuccess = () => {}) {
  await Storage.clearSession()
  const config = systemConfig()
  set(config, async () => {
    await Storage.setLocal({ status_proxyKey: 'system' })
    await Action.setBadgeBackgroundColor('#000')
    await Action.setBadgeText('Sys')
    afterSuccess()
  })
}

const set = async function (
  config,
  afterSuccess = () => {},
  scope = 'regular'
) {
  const context = await chrome.runtime.getContexts({})
  if (context[0]?.incognito) {
    scope = 'incognito_persistent'
  }
  chrome.proxy.settings.set({ value: config, scope: scope }, () => {
    if (chrome.runtime.lastError) {
      log.error(I18n.getMessage('desc_proxy_failed'), chrome.runtime.lastError)
    } else {
      log.info(I18n.getMessage('desc_proxy_success'), config, scope)
      afterSuccess()
    }
  })
}

const createConfig = async function (proxyConfigs, key, tempRules = []) {
  let config = null
  switch (proxyConfigs[key].mode) {
    case 'direct':
      config = directConfig()
      break
    case 'system':
      config = systemConfig()
      break
    case 'fixed_servers':
      config = fixedConfig(proxyConfigs[key].config)
      break
    case 'pac_script':
      config = pacConfig(proxyConfigs[key].config)
      break
    case 'auto':
      config = await autoConfig(proxyConfigs, key, tempRules)
      break
    default:
      config = {}
  }
  return config
}

const directConfig = function () {
  return { mode: 'direct' }
}

const systemConfig = function () {
  return { mode: 'system' }
}

/**
 *
 * @param {*} proxyConfig
 * @returns config
 *
 * config = {
 *  mode: "fixed_servers",
 *  rules: {
 *    proxyForHttp: {
 *      scheme: "socks5",
 *      host: "1.2.3.4"
 *    },
 *    bypassList: ["foobar.com"]
 *  }
 * }
 *
 */
const fixedConfig = function (proxyConfig) {
  const config = { mode: 'fixed_servers', rules: {} }
  if (
    Object.keys(proxyConfig.rules).includes('proxyForHttp') &&
    proxyConfig.rules.proxyForHttp.host
  ) {
    config.rules.proxyForHttp = getProxyServer(proxyConfig.rules.proxyForHttp)
  }
  if (
    Object.keys(proxyConfig.rules).includes('proxyForHttps') &&
    proxyConfig.rules.proxyForHttps.host
  ) {
    config.rules.proxyForHttps = getProxyServer(proxyConfig.rules.proxyForHttps)
  }
  if (
    Object.keys(proxyConfig.rules).includes('proxyForFtp') &&
    proxyConfig.rules.proxyForFtp.host
  ) {
    config.rules.proxyForFtp = getProxyServer(proxyConfig.rules.proxyForFtp)
  }

  const key =
    Object.keys(config.rules).length == 0 ? 'singleProxy' : 'fallbackProxy'
  if (proxyConfig.rules.fallbackProxy.host) {
    config.rules[key] = getProxyServer(proxyConfig.rules.fallbackProxy)
  }
  if (Object.keys(config.rules).length == 0) return directConfig()
  if (Object.keys(proxyConfig.rules).includes('bypassList'))
    config.rules.bypassList = JSON.parse(
      JSON.stringify(proxyConfig.rules.bypassList)
    )
  return config
}

/*
{
  mode: "pac_script",
  pacScript: {
    data: "{code}"
  }
}
*/
const autoConfig = async function (proxyConfigs, key, tempRules) {
  const config = { mode: 'pac_script', pacScript: {} }
  config.pacScript.data = await generatePacfile(proxyConfigs, key, tempRules)

  return config
}

/*
{
  mode: "pac_script",
  pacScript: {
    data: "function FindProxyForURL(url, host) {\n" +
          "  if (host == 'foobar.com')\n" +
          "    return 'PROXY blackhole:80';\n" +
          "  return 'DIRECT';\n" +
          "}"
  }
}
*/

/**
 *
 * @param {*} proxyConfig
 * @returns
 */
const pacConfig = (proxyConfig) => {
  const config = { mode: 'pac_script', pacScript: {} }
  if (proxyConfig.rules.data) {
    config.pacScript.data = proxyConfig.rules.data
  } else if (pacConfig.rules.url) {
    config.pacScript.url = proxyConfig.rules.url
  } else {
    return directConfig()
  }
  return config
}

/**
 *
 * @param {*} server = {host, port, scheme, username, password}
 * @returns
 */
const getProxyServer = function (server) {
  const proxyServer = { scheme: server.scheme, host: server.host }
  if (
    server.port &&
    !isNaN(server.port) &&
    server.port > 0 &&
    server.port < 65536
  ) {
    proxyServer.port = server.port
  }
  return proxyServer
}

export default Proxy
