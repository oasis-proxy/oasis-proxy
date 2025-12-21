import {
  startUpdateUrl,
  endUpdateUrl,
  handleUpdateUrl
} from './external_updater.js'
import { startSiteRule, endSiteRule } from './site_rules.js'
import { startAutoSync, endAutoSync, handleAutoSync } from './auto_sync.js'
import { convertToNewVersionConfig, resetAppConfig } from '@/core/app_config.js'
import {
  addAllContextMenus,
  contextMenusClick,
  removeAllContextMenus
} from '@/core/context_menus.js'
import { log } from '@/core/utils.js'
import { clearTabBadgeText } from './badge_text.js'
import { handleMonitor, startMonitor, endMonitor } from './request_monitor.js'
import { setProxyAuths } from './proxy_auth.js'

let current = new Date().toLocaleString()

log.info('background:', current)

/* section: chrome event */

/*  Fired when the extension is first installed, 
  when the extension is updated to a new version, 
  and when Chrome is updated to a new version. */
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  log.debug('onInstalled', reason)
  if (reason === 'install') {
    await chrome.storage.local.set(resetAppConfig())
    await chrome.runtime.openOptionsPage()
  } else if (reason === 'update') {
    await convertToNewVersionConfig()

    const result = await chrome.storage.local.get()
    let color = '#3498db'
    if (result.status_proxyKey == undefined) {
      color = '#fff'
    } else {
      color = result[result.status_proxyKey].tagColor
    }
    await chrome.action.setBadgeBackgroundColor({ color: color })
    clearTabBadgeText()
  }
  chrome.storage.session.clear()
  const result = await chrome.storage.local.get([
    'config_monitor',
    'config_updateUrl',
    'config_autoSync',
    'config_siteRules',
    'config_contextMenus'
  ])

  result.config_monitor ? startMonitor() : endMonitor()
  result.config_updateUrl != 'disable'
    ? startUpdateUrl(result.config_updateUrl)
    : endUpdateUrl()
  result.config_autoSync ? startAutoSync() : endAutoSync()
  result.config_siteRules ? startSiteRule() : endSiteRule()
  result.config_contextMenus
    ? await addAllContextMenus()
    : await removeAllContextMenus()
})

/* Fired when a profile that has this extension installed first starts up. */
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.local.get(null)
  log.debug('onStartup', result)

  result.config_monitor ? startMonitor() : endMonitor()
  result.config_updateUrl != 'disable'
    ? startUpdateUrl(result.config_updateUrl)
    : endUpdateUrl()
  result.config_autoSync ? startAutoSync() : endAutoSync()
  result.config_siteRules ? startSiteRule() : endSiteRule()
  result.config_contextMenus
    ? await addAllContextMenus()
    : await removeAllContextMenus()

  let color = '#3498db'
  if (
    !(
      result.status_proxyKey == undefined ||
      result[result.status_proxyKey].tagColor == undefined
    )
  ) {
    color = result[result.status_proxyKey].tagColor
  }
  await chrome.action.setBadgeBackgroundColor({ color: color })
  clearTabBadgeText()
})

/* section: storage event */
chrome.storage.onChanged.addListener(async function (changes, areaName) {
  if (areaName === 'local') {
    if (changes.config_monitor?.newValue !== changes.config_monitor?.oldValue) {
      changes.config_monitor?.newValue ? startMonitor() : endMonitor()
    }
    if (
      changes.config_updateUrl?.newValue !== changes.config_updateUrl?.oldValue
    ) {
      changes.config_updateUrl?.newValue != 'disabled'
        ? startUpdateUrl(changes.config_updateUrl?.newValue)
        : endUpdateUrl()
    }
    if (
      changes.config_autoSync?.newValue !== changes.config_autoSync?.oldValue
    ) {
      changes.config_autoSync?.newValue ? startAutoSync() : endAutoSync()
    }
    if (
      changes.config_siteRules?.newValue !== changes.config_siteRules?.oldValue
    ) {
      changes.config_siteRules?.newValue ? startSiteRule() : endSiteRule()
    }
    if (
      changes.config_contextMenus?.newValue !==
      changes.config_contextMenus?.oldValue
    ) {
      changes.config_contextMenus?.newValue
        ? addAllContextMenus()
        : removeAllContextMenus()
    }
  }
})

/* section: alarm event */
chrome.alarms.onAlarm.addListener((alarm) => {
  log.debug('onAlarm', alarm)
  switch (alarm.name) {
    case 'updateUrl':
      handleUpdateUrl()
      break
    case 'monitorRequest':
      handleMonitor()
      break
    case 'autoSync':
      handleAutoSync()
      break
    default:
      break
  }
})

/* section: handle the authentication for proxy */
if (!chrome.webRequest.onAuthRequired.hasListener()) {
  chrome.webRequest.onAuthRequired.addListener(
    setProxyAuths,
    { urls: ['<all_urls>'] },
    ['asyncBlocking']
  )
}

/* seciton: print error logs for setting proxy */
chrome.proxy.onProxyError.addListener((details) => {
  log.error('onProxyError: ', details)
})

chrome.contextMenus.onClicked.addListener(contextMenusClick)
