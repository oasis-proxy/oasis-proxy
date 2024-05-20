import {
  parseAutoProxyFile,
  parseInternalRule,
  parseBypassRule
} from './ConfigData.js'
import * as ipaddr from 'ipaddr.js'

export const getRules = function (proxyConfig) {
  if (proxyConfig.mode == 'auto') return getAutoRules(proxyConfig)
  if (proxyConfig.mode == 'fixed_servers') return getFixedRules(proxyConfig)
  return getDefaultRules(proxyConfig.mode)
}
const getDefaultRules = function (defaultProxy) {
  return {
    internal: [],
    external: [],
    reject: [],
    default: defaultProxy,
    bypass: []
  }
}
const getFixedRules = function (proxyConfig) {
  const config = proxyConfig.config
  const bypass = getBypassRulesList(config.rules.bypassList)
  return {
    internal: [],
    external: [],
    reject: [],
    default: proxyConfig.name,
    bypass
  }
}
const getAutoRules = function (proxyConfig) {
  const config = proxyConfig.config
  const external = getExternalRulesList(config.rules.external)
  const reject = getExternalRulesList(config.rules.reject)
  const internal = getInternalRulesList(config.rules.internal)
  return {
    internal,
    external,
    reject,
    default: proxyConfig.config.rules.defaultProxy,
    bypass: []
  }
}

export const getInternalRulesList = function (internalRules) {
  const filteredRules = internalRules.filter(function (element) {
    return (
      element.data !== '' && element.valid != false && element.mode != 'divider'
    )
  })
  const formattedRules = filteredRules.map((rule) => {
    return parseInternalRule(rule)
  })

  return formattedRules
}

export const getExternalRulesList = function (externalRule) {
  return parseAutoProxyFile(externalRule.data, externalRule.proxy)
}

const getBypassRulesList = function (bypassList) {
  const res = []
  if (bypassList.includes('<local>')) {
    res.push(...parseBypassRule('<local>'))
  }
  res.push(
    ...bypassList
      .filter((item) => item != '<local>' && item != '')
      .map((item) => {
        return parseBypassRule(item)
      })
  )
  return res
}

export const checkRules = function (url, formattedRulesList) {
  let res = {}
  for (const group of ['internal', 'reject', 'external', 'bypass']) {
    for (const item of formattedRulesList[group]) {
      if (testRule(url, item)) {
        res.rule = item.orgin.data
        res.group = group
        res.policy = item.proxy.startsWith('+')
          ? `${item.proxy.substring(1)} (${group})`
          : `${item.proxy} (${group})`
        return res
      }
    }
  }
  return { policy: `${formattedRulesList.default} (default)`, rule: '' }
}

export const testRule = function (url, formattedRule) {
  let host = new URL(url).hostname
  let pattern
  let addr
  let range
  let tmpStr
  switch (formattedRule.mode) {
    case 'invalid':
      return false
    case 'ip':
      if (
        !ipaddr.isValid(host) ||
        (ipaddr.IPv4.isValid(host) && !formattedRule.rule.ipv4) ||
        (ipaddr.IPv6.isValid(host) && formattedRule.rule.ipv4)
      ) {
        return false
      }
      addr = ipaddr.parse(host)
      range = ipaddr.parseCIDR(
        formattedRule.rule.subnet +
          '/' +
          ipaddr.parse(formattedRule.rule.mask).prefixLengthFromSubnetMask()
      )
      return addr.match(range)
    case 'url':
      tmpStr = formattedRule.rule.regex.substring(
        1,
        formattedRule.rule.regex.length - 1
      )
      pattern = new RegExp(tmpStr.replace(/\\\//g, '/'))
      return pattern.test(url)
    case 'host':
      tmpStr = formattedRule.rule.regex.substring(
        1,
        formattedRule.rule.regex.length - 1
      )
      pattern = new RegExp(tmpStr.replace(/\\\//g, '/'))
      return pattern.test(host)
    case 'plain':
      return host.lastIndexOf('.') == -1 && host.lastIndexOf(':') == -1
  }
}
