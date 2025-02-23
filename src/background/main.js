import {
  startUpdateUrl,
  endUpdateUrl,
  handleUpdateUrl
} from './external_updater.js'
import { startAutoSync, endAutoSync, handleAutoSync } from './auto_sync.js'
import { getAuthList } from '@/core/proxy_config.js'
import { convertToNewVersionConfig, resetAppConfig } from '@/core/app_config.js'
import { subStringForName } from '@/core/utils.js'

let current = new Date().toLocaleString()
console.log('background:', current)

/* section 1: request monitor */
const getHostName = (url) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url.split('/')[2]
  }
  return 'default'
}

const updateTabBadgeText = async () => {
  try {
    let result = await chrome.storage.local.get(null)
    const activeProxyKey = result.status_proxyKey
    const mode = result[activeProxyKey]?.mode
    if (mode == 'auto') {
      let tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (
        tabs != null &&
        tabs.length > 0 &&
        tabs[0].id != chrome.tabs.TAB_ID_NONE
      ) {
        const activeTabId = tabs[0].id.toString()
        const requestSession = await chrome.storage.session.get(activeTabId)
        if (requestSession[activeTabId] != null) {
          let numText = Object.keys(
            requestSession[activeTabId]
          ).length.toString()
          if (numText == '0') {
            numText = subStringForName(result[activeProxyKey].name)
          }
          chrome.action.setPopup({ popup: '/popup.html#/monitor' })
          chrome.action.setBadgeText({ text: numText })
          return
        }
      }
    } else {
      chrome.action.setPopup({ popup: '/popup.html#/' })
    }
  } catch (err) {
    console.error('updateTabBadgeText', err)
  }
}

const clearTabBadgeText = async () => {
  try {
    let result = await chrome.storage.local.get(null)
    const activeProxyKey = result.status_proxyKey
    const mode = result[activeProxyKey]?.mode
    if (mode == 'direct') {
      await chrome.action.setBadgeBackgroundColor({
        color: '#fff'
      })
      await chrome.action.setBadgeText({ text: 'Dir' })
    } else if (mode == 'system') {
      await chrome.action.setBadgeBackgroundColor({
        color: '#000'
      })
      await chrome.action.setBadgeText({ text: 'Sys' })
    } else {
      await chrome.action.setBadgeBackgroundColor({
        color: result[activeProxyKey]?.tagColor
      })
      await chrome.action.setBadgeText({
        text: subStringForName(result[activeProxyKey].name)
      })
    }
    chrome.action.setPopup({ popup: '/popup.html#/' })
  } catch (err) {
    console.error('clearTabBadgeText', err)
  }
}

const monitorResponse = async (details) => {
  const tabId = details.tabId.toString()
  const requestSession = await chrome.storage.session.get(tabId)
  if (!Object.prototype.hasOwnProperty.call(requestSession, tabId)) {
    requestSession[tabId] = {}
  }
  requestSession[tabId][getHostName(details.url)] = {
    ip: details.ip,
    status: 'OK'
  }
  await chrome.storage.session.set(requestSession)
  updateTabBadgeText()
  chrome.runtime.sendMessage({ instruction: 'updateList' }, () => {
    if (chrome.runtime.lastError) {
      return
    }
  })
  chrome.runtime.sendMessage(
    {
      instruction: 'sendRequestItem',
      data: { details: details, mode: 'completed' }
    },
    () => {
      if (chrome.runtime.lastError) {
        return
      }
    }
  )
}

const monitorBeforeRequest = (details) => {
  chrome.runtime.sendMessage(
    {
      instruction: 'sendRequestItem',
      data: { details: details, mode: 'beforeRequest' }
    },
    () => {
      if (chrome.runtime.lastError) {
        return
      }
    }
  )
}

const monitorBeforeRedirect = (details) => {
  chrome.runtime.sendMessage(
    {
      instruction: 'sendRequestItem',
      data: { details: details, mode: 'beforeRedirect' }
    },
    () => {
      if (chrome.runtime.lastError) {
        return
      }
    }
  )
}

const monitorError = async (details) => {
  const tabId = details.tabId.toString()
  const requestSession = await chrome.storage.session.get(tabId)
  if (!Object.prototype.hasOwnProperty.call(requestSession, tabId)) {
    requestSession[tabId] = {}
  }
  requestSession[tabId][getHostName(details.url)] = {
    ip: details.error,
    status: 'Error'
  }
  await chrome.storage.session.set(requestSession)
  updateTabBadgeText()
  chrome.runtime.sendMessage({ instruction: 'updateList' }, () => {
    if (chrome.runtime.lastError) {
      return
    }
  })
  chrome.runtime.sendMessage(
    {
      instruction: 'sendRequestItem',
      data: { details: details, mode: 'errorOccurred' }
    },
    () => {
      if (chrome.runtime.lastError) {
        return
      }
    }
  )
}

/* tab section*/
const tabRemoved = (tabId) => {
  setTimeout(async () => {
    await chrome.storage.session.remove(tabId.toString())
  }, 2000)
}

const tabActivated = () => {
  updateTabBadgeText()
}

const tabUpdated = async (tabId, changeInfo, tab) => {
  // clear all request message. If host main url is invalid, nothing will be monitored
  if (changeInfo.status === 'loading' && tab.url != null) {
    await chrome.storage.session.set({ [tabId.toString()]: {} })
    chrome.runtime.sendMessage({ instruction: 'clearList' }, () => {
      if (chrome.runtime.lastError) {
        return
      }
    })
  }
}

const addMonitor = () => {
  console.info('addMonitor')
  chrome.webRequest.onBeforeRequest.addListener(monitorBeforeRequest, {
    urls: ['<all_urls>']
  })

  chrome.webRequest.onBeforeRedirect.addListener(monitorBeforeRedirect, {
    urls: ['<all_urls>']
  })

  chrome.webRequest.onCompleted.addListener(monitorResponse, {
    urls: ['<all_urls>']
  })

  chrome.webRequest.onErrorOccurred.addListener(monitorError, {
    urls: ['<all_urls>']
  })

  chrome.tabs.onActivated.addListener(tabActivated)

  chrome.tabs.onUpdated.addListener(tabUpdated)

  chrome.tabs.onRemoved.addListener(tabRemoved)
}

const removeMonitor = () => {
  console.info('removeMonitor')
  chrome.webRequest.onBeforeRequest.removeListener(monitorBeforeRequest)

  chrome.webRequest.onBeforeRedirect.removeListener(monitorBeforeRedirect)

  chrome.webRequest.onCompleted.removeListener(monitorResponse)

  chrome.webRequest.onErrorOccurred.removeListener(monitorError)

  chrome.tabs.onActivated.removeListener(tabActivated)

  chrome.tabs.onUpdated.removeListener(tabUpdated)

  chrome.tabs.onRemoved.removeListener(tabRemoved)

  clearTabBadgeText()
}

const isMonitorEffective = () => {
  const flag = chrome.webRequest.onCompleted.hasListener(monitorResponse)
  console.debug('isMonitorEffective', flag)
  return flag
}

const startMonitor = async function () {
  await chrome.alarms.create('monitorRequest', { periodInMinutes: 1 })
  console.info('create monitorRequest')
  if (!isMonitorEffective()) {
    addMonitor()
  }
}

const endMonitor = async function () {
  await chrome.alarms.clear('monitorRequest')
  console.info('clear monitorRequest')
  if (isMonitorEffective()) {
    removeMonitor()
  }
}

/* section 3: alarm event */
const handleMonitor = async function () {
  const result = await chrome.storage.local.get(['config_monitor'])
  if (result.config_monitor && !isMonitorEffective()) {
    addMonitor()
  }
  if (!result.config_monitor && isMonitorEffective()) {
    removeMonitor()
  }
}

// 监听配置变化
chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName === 'local') {
    if (changes.config_monitor?.newValue !== changes.config_monitor?.oldValue) {
      changes.config_monitor?.newValue ? startMonitor() : endMonitor()
    }
    if (
      changes.config_updateUrl?.newValue !== changes.config_updateUrl?.oldValue
    ) {
      changes.config_updateUrl?.newValue ? startUpdateUrl() : endUpdateUrl()
    }
    if (
      changes.config_autoSync?.newValue !== changes.config_autoSync?.oldValue
    ) {
      changes.config_autoSync?.newValue ? startAutoSync() : endAutoSync()
    }
  }
})

// alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  console.debug('onAlarm', alarm)
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

/* section 4: chrome event */
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  console.debug('onInstalled', reason)
  if (reason === 'install') {
    await chrome.storage.local.set(resetAppConfig())
    chrome.runtime.openOptionsPage()
  } else if (reason === 'update') {
    const result = await chrome.storage.local.get(null)
    const add = {}
    const removeList = []
    if (result.config_version == null) {
      add.config_version = 1
    }
    if (result.config_autoSync == null) {
      add.config_autoSync = false
    }
    if (result.direct == null) {
      add.direct = {
        mode: 'direct',
        name: 'direct',
        tagColor: '#fff',
        config: { mode: 'direct' }
      }
    }
    if (result.system == null) {
      add.system = {
        mode: 'system',
        name: 'system',
        tagColor: '#000',
        config: { mode: 'system' }
      }
    }
    if (result.reject == null || result.reject?.config.rules == '') {
      add.reject = {
        mode: 'reject',
        name: 'reject',
        config: { mode: 'reject', rules: 'HTTPS 127.0.0.1:65432' }
      }
    }
    await chrome.storage.local.set(add)
    if (result.config_reject != null) {
      removeList.push('config_reject')
    }
    await chrome.storage.local.remove(removeList)

    await convertToNewVersionConfig('2')
    await convertToNewVersionConfig('2.1')
    await convertToNewVersionConfig('2.2')

    let color = '#3498db'
    if (result.status_proxyKey == undefined) {
      color = '#3498db'
    } else {
      color = result[result.status_proxyKey].tagColor
    }
    chrome.action.setBadgeBackgroundColor({ color: color })
    clearTabBadgeText()
  }
  chrome.storage.session.clear()
  const result = await chrome.storage.local.get([
    'config_monitor',
    'config_updateUrl',
    'config_autoSync'
  ])

  result.config_monitor ? startMonitor() : endMonitor()
  result.config_updateUrl ? startUpdateUrl() : endUpdateUrl()
  result.config_autoSync ? startAutoSync() : endAutoSync()
})

// 启动事件
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.local.get(null)
  console.debug('onStartup', result)

  result.config_monitor ? startMonitor() : endMonitor()
  result.config_updateUrl ? startUpdateUrl() : endUpdateUrl()
  result.config_autoSync ? startAutoSync() : endAutoSync()

  let color = '#3498db'
  if (
    result.status_proxyKey == undefined ||
    result[result.status_proxyKey].tagColor == undefined
  ) {
    color = '#3498db'
  } else {
    color = result[result.status_proxyKey].tagColor
  }
  chrome.action.setBadgeBackgroundColor({ color: color })
  clearTabBadgeText()
  chrome.webRequest.onAuthRequired.addListener(
    setProxyAuths,
    { urls: ['<all_urls>'] },
    ['asyncBlocking']
  )
})

chrome.webRequest.onAuthRequired.addListener(
  setProxyAuths,
  { urls: ['<all_urls>'] },
  ['asyncBlocking']
)

async function setProxyAuths(details, callback) {
  if (details.isProxy) {
    const result = await chrome.storage.local.get(null)
    const authList = getAuthList(result, result.status_proxyKey)
    for (const item of authList) {
      if (
        details.challenger.host == item.host &&
        details.challenger.port == item.port
      ) {
        callback({
          authCredentials: {
            username: item.username,
            password: item.password
          }
        })
      }
    }
    callback()
  }
  callback()
}

chrome.proxy.onProxyError.addListener((details) => {
  console.info('onProxyError', details)
})
