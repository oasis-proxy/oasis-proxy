import { getHostName, filterPrefixArray, find, getSuffix } from '@/core/utils'
import Browser from '../Browser/main'
import { getRules, checkRules } from '@/core/rules_pretest.js'

export const matchSiteRules = async (details) => {
  const exceptErrorList = [
    'net::ERR_ABORTED', // refresh page
    'net::ERR_PROXY_CONNECTION_FAILED' // reject rules or proxy server failed
  ]
  if (exceptErrorList.includes(details.error)) {
    return
  }

  const result = await Browser.Storage.getLocalAll()
  if (result[result.status_proxyKey]?.mode != 'auto') {
    return
  }

  let tabInfo = await chrome.tabs.get(details.tabId)
  if (!tabInfo.url) {
    return
  }

  const activeRules = getRules(result[result.status_proxyKey])
  const siteProxy = checkRules(tabInfo.url, activeRules, [
    'siteRuleList',
    'siteRulesSet'
  ])
  if (siteProxy.rule == '') {
    return
  }

  const res = checkRules(details.url, activeRules)
  if (res.rule != '') {
    return
  }
  const isReloadProxy = await mergeTempRule({
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
    error: details.error
  })
  if (isReloadProxy) {
    await Browser.Proxy.reloadOrDirect(() => {
      console.log('tab reload:', details)
      Browser.Tabs.reload(details.tabId, { bypassCache: true })
    })
  }
}

const mergeTempRule = async (rule) => {
  console.log('start mergeTempRule', rule)
  const sessionObj = await Browser.Storage.getSession()
  const tempRuleList = filterPrefixArray(sessionObj, 'tempRule_')
  let isReloadProxy = false
  const op1 = [
    { key: 'data', value: rule.data },
    { key: 'valid', value: true }
  ]
  const op2 = [
    { key: 'siteRule', value: rule.siteRule },
    { key: 'valid', value: false }
  ]
  let result = find(tempRuleList, op1)

  console.log('start result', result)
  if (result.length > 0) {
    console.log(
      'result[0].siteRule == rule.siteRule',
      result[0].siteRule == rule.siteRule
    )
    if (result[0].siteRule == rule.siteRule) {
      console.log(
        'result[0].proxy == rule.proxy',
        result[0].proxy == rule.proxy
      )
      if (result[0].proxy == rule.proxy) {
        isReloadProxy = false
      } else {
        result[0].proxy = rule.proxy
        await Browser.Storage.setSession({
          ['tempRule_' + result[0].data + '_' + result[0].siteRule]: result[0]
        })
        isReloadProxy = true
      }
    } else {
      console.log(
        'result[0].proxy == rule.proxy',
        result[0].proxy == rule.proxy
      )
      if (result[0].proxy == rule.proxy) {
        rule.valid = false
        await Browser.Storage.setSession({
          ['tempRule_' + rule.data + '_' + rule.siteRule]: rule
        })
        isReloadProxy = false
      } else {
        let invalidResult = find(tempRuleList, op2)
        console.log('start invalidResult', invalidResult)
        if (invalidResult.length > 0) {
          console.log(
            'invalidResult[0].proxy != rule.proxy',
            invalidResult[0].proxy != rule.proxy
          )
          if (invalidResult[0].proxy != rule.proxy) {
            invalidResult[0].valid = true
            invalidResult[0].proxy = rule.proxy
            result[0].valid = false
            await Browser.Storage.setSession({
              ['tempRule_' +
              invalidResult[0].data +
              '_' +
              invalidResult[0].siteRule]: invalidResult[0],
              ['tempRule_' + result[0].data + '_' + result[0].siteRule]:
                result[0]
            })
          } else {
            isReloadProxy = false
          }
        } else {
          result[0].valid = false
          await Browser.Storage.setSession({
            ['tempRule_' + rule.data + '_' + rule.siteRule]: rule,
            ['tempRule_' + result[0].data + '_' + result[0].siteRule]: result[0]
          })
          isReloadProxy = true
        }
      }
    }
  } else {
    await Browser.Storage.setSession({
      ['tempRule_' + rule.data + '_' + rule.siteRule]: rule
    })
    isReloadProxy = true
  }
  return isReloadProxy
}
