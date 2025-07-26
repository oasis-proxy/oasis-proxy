import Browser from '@/Browser/main.js'
import {
  parseAutoProxyFile,
  parseRuleItem,
  parseBypassRule
} from './rules_parser.js'
import { filterPrefixArray } from './utils.js'
import * as ipaddr from 'ipaddr.js'

export const getRules = function (proxyConfig) {
  if (proxyConfig?.mode) {
    switch (proxyConfig.mode) {
      case 'auto':
        return getAutoRules(proxyConfig)
      case 'fixed_servers':
        return getFixedRules(proxyConfig)
      case 'pac_script':
        return getPacScriptRules(proxyConfig)
      default: // system direct
        return getDefaultRules(proxyConfig.mode)
    }
  }
  return null
}

// todo 调整temprules位置和开关
export const checkRules = function (
  url,
  formattedRulesList,
  groupList = [
    'tempRulesSet',
    'localRuleList',
    'rejectRuleList',
    'rejectRulesSet',
    'localRulesSet',
    'bypass'
  ]
) {
  let res = {}
  for (const group of groupList) {
    if (!formattedRulesList[group]) {
      continue
    }
    for (const item of formattedRulesList[group]) {
      if (testRule(url, item)) {
        res.rule = item.orgin.data
        res.group = group
        res.policy = item.proxy.startsWith('+')
          ? `${item.proxy.substring(1)} (${group})`
          : `${item.proxy} (${group})`
        res.proxy = item.proxy
        return res
      }
    }
  }
  return { policy: `${formattedRulesList.default} (default)`, rule: '' }
}

const testRule = function (url, formattedRule) {
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
      pattern = new RegExp(tmpStr)
      return pattern.test(url)
    case 'host':
      tmpStr = formattedRule.rule.regex.substring(
        1,
        formattedRule.rule.regex.length - 1
      )
      pattern = new RegExp(tmpStr)
      return pattern.test(host)
    case 'plain':
      return host.lastIndexOf('.') == -1 && host.lastIndexOf(':') == -1
  }
}

const getTempRulesSet = async function () {
  const sessionObj = await Browser.Storage.getSession()
  const tempRules = filterPrefixArray(sessionObj, 'tempRule_')
  return tempRules
}

const getDefaultRules = function (defaultProxy) {
  return {
    localRuleList: [],
    localRulesSet: [],
    rejectRulesSet: [],
    rejectRuleList: [],
    default: defaultProxy,
    bypass: []
  }
}

const getFixedRules = function (proxyConfig) {
  const config = proxyConfig.config
  const bypass = getBypassRulesList(config.rules.bypassList)
  return {
    localRuleList: [],
    localRulesSet: [],
    rejectRulesSet: [],
    rejectRuleList: [],
    default: proxyConfig.name,
    bypass
  }
}

const getPacScriptRules = function (proxyConfig) {
  return {
    localRuleList: [],
    localRulesSet: [],
    rejectRulesSet: [],
    rejectRuleList: [],
    default: proxyConfig.name,
    bypass: []
  }
}

const getAutoRules = function (proxyConfig) {
  const config = proxyConfig.config
  const localRulesSet = getRulesSet(config.rules.local.rulesSet)
  const rejectRulesSet = getRulesSet(config.rules.reject.rulesSet)
  const siteRulesSet = getRulesSet(config.rules.site.rulesSet)
  const localRuleList = getRulesList(config.rules.local.ruleList)
  const rejectRuleList = getRulesList(config.rules.reject.ruleList)
  const siteRuleList = getRulesList(config.rules.site.ruleList)
  const tempRuleSet = getTempRulesSet()
  return {
    localRuleList,
    localRulesSet,
    rejectRulesSet,
    rejectRuleList,
    siteRulesSet,
    siteRuleList,
    tempRuleSet,
    default: proxyConfig.config.rules.defaultProxy,
    bypass: []
  }
}

const getRulesList = function (ruleList) {
  const filteredRules = ruleList.filter(function (element) {
    return (
      element.data !== '' && element.valid != false && element.mode != 'divider'
    )
  })
  const formattedRules = filteredRules.map((rule) => {
    return parseRuleItem(rule)
  })

  return formattedRules
}

const getRulesSet = function (rulesSet) {
  if (!rulesSet.valid) {
    return []
  }
  return parseAutoProxyFile(rulesSet.data, rulesSet.proxy)
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
