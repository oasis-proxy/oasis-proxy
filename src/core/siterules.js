import { getHostName, filterPrefixArray, getSuffix, log } from '@/core/utils'
import Browser from '../Browser/main'
import { getRules, checkRules, getTempRuleList } from '@/core/rules_pretest.js'

export const matchSiteRules = async (details, isMainPage = false) => {
  log.debug('matchSiteRules', details)
  // avoid infinite loop
  const exceptErrorList = [
    'net::ERR_ABORTED', // refresh page
    'net::ERR_PROXY_CONNECTION_FAILED' // reject rules or proxy server failed
  ]
  if (!isMainPage && exceptErrorList.includes(details.error)) {
    log.debug('exceptErrorList')
    return
  }

  // only auto policy supported
  const result = await Browser.Storage.getLocalAll()
  if (result[result.status_proxyKey]?.mode != 'auto') {
    return
  }

  if (details.tabId == chrome.tabs.TAB_ID_NONE) {
    return
  }

  // get main page url of the tab
  let tabInfo = await Browser.Tabs.get(details.tabId)
  log.debug(tabInfo)
  if (!tabInfo.url) {
    return
  }

  // if main page url match site rules
  const tempRuleList = await getTempRuleList()
  const activeRules = getRules(result[result.status_proxyKey], tempRuleList)
  const siteProxy = checkRules(tabInfo.url, activeRules, [
    'siteRuleList',
    'siteRulesSet'
  ])
  log.debug('siteProxy', siteProxy)
  log.debug('activeRules', activeRules)
  if (siteProxy.rule == '') {
    return
  }

  // if request url match any policy rules
  const res = checkRules(details.url, activeRules)
  log.debug('res', res)
  // if already match a rule, which means already set proxy
  if (res.rule != '') {
    return
  }

  const tmpRule = {
    key: 'tempRule_' + getHostName(details.url) + '_' + siteProxy.rule,
    data: getHostName(details.url),
    mode: 'domain',
    proxy: siteProxy.proxy,
    valid: true,
    source: tabInfo.url,
    siteRule: siteProxy.rule,
    suffix: getSuffix(getHostName(details.url)),
    reverseSuffix: getSuffix(getHostName(details.url))
      .split('.')
      .reverse()
      .join('.'),
    error: isMainPage ? 'page::MainSite' : details.error
  }
  log.debug('tmpRule', tmpRule)
  await Browser.Storage.setSession({
    [tmpRule.key]: tmpRule
  })

  await Browser.Proxy.reloadOrDirect(() => {
    log.debug('tab reload:', details)
    Browser.Tabs.reload(details.tabId, { bypassCache: true })
  })
}

export const clearSiteRules = async () => {
  const result = await Browser.Storage.getSession()
  const allTempRules = filterPrefixArray(result, 'tempRule_')

  const removeList = allTempRules.map(
    (element) => 'tempRule_' + element.data + '_' + element.siteRule
  )

  await Browser.Storage.removeSession(removeList)
  await Browser.Proxy.reloadOrDirect()
}

export const setSiteRuleListToSession = async function (proxyConfig) {
  if (proxyConfig.mode !== 'auto') {
    return
  }
  if (proxyConfig.config.rules.site?.ruleList.length == 0) {
    return
  }
  const tmpRuleList = {}
  for (const siteRule of proxyConfig.config.rules.site.ruleList) {
    if (siteRule.valid == false || siteRule.data == '') {
      continue
    }

    let isExist = false
    proxyConfig.config.rules.local.ruleList.forEach((item) => {
      item.data == siteRule.data &&
      item.mode == siteRule.mode &&
      item.valid == siteRule.valid
        ? (isExist = true)
        : null
    })

    if (isExist) {
      continue
    }

    tmpRuleList['tempRule_mainpage_' + siteRule.data] = {
      key: 'tempRule_mainpage_' + siteRule.data,
      data: siteRule.data,
      mode: siteRule.mode,
      proxy: siteRule.proxy,
      valid: true,
      source: 'siteRule',
      siteRule: siteRule.data,
      suffix: '',
      reverseSuffix: '',
      error: 'page::MainSite'
    }

    if (
      siteRule.data.indexOf('?') == -1 &&
      siteRule.data.indexOf('*') == -1 &&
      !siteRule.data.startsWith('.')
    ) {
      tmpRuleList['tempRule_mainpage_' + siteRule.data].suffix = getSuffix(
        siteRule.data
      )
      tmpRuleList['tempRule_mainpage_' + siteRule.data].reverseSuffix =
        getSuffix(siteRule.data).split('.').reverse().join('.')
    }
  }
  if (Object.keys(tmpRuleList).length == 0) {
    return
  }
  await Browser.Storage.setSession(tmpRuleList)
}
