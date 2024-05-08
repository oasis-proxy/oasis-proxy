import Browser from '../Browser/main'
import { startUpdateUrl, endUpdateUrl, handleUpdateUrl } from './updateUrl'
import { startAutoSync, endAutoSync, handleAutoSync } from './autoSync'
import { getAuthList } from '@/core/ProxyConfig.js'
let current = new Date().toLocaleString()
console.log('background:', current)

const requestMap = {}

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
    let tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs != null && tabs.length > 0) {
      const activeTabId = tabs[0].id
      if (requestMap.hasOwnProperty(activeTabId)) {
        const num = Object.keys(requestMap[activeTabId]).length
        if (num > 0 && mode == 'auto') {
          chrome.action.setPopup({ popup: '/popup.html#/monitor' })
          chrome.action.setBadgeText({ text: num.toString() })
        } else {
          chrome.action.setBadgeText({ text: '' })
          chrome.action.setPopup({ popup: '/popup.html#/' })
        }
      } else {
        chrome.action.setBadgeText({ text: '' })
        chrome.action.setPopup({ popup: '/popup.html#/' })
      }
    }
  } catch (err) {
    console.error('updateTabBadgeText', err)
  }
}

const monitorResponse = (details) => {
  console.debug('monitorResponse: ', details)
  if (!details.url.startsWith('http')) {
    return
  }
  if (requestMap.hasOwnProperty(details.tabId)) {
    requestMap[details.tabId][getHostName(details.url)] = {
      ip: details.ip,
      status: 'OK'
    }
  } else {
    requestMap[details.tabId] = {}
    requestMap[details.tabId][getHostName(details.url)] = {
      ip: details.ip,
      status: 'OK'
    }
  }
  updateTabBadgeText()
}

const monitorError = (details) => {
  console.debug('monitorError: ', details)
  if (requestMap.hasOwnProperty(details.tabId)) {
    requestMap[details.tabId][getHostName(details.url)] = {
      ip: details.error,
      status: 'Error'
    }
  } else {
    requestMap[details.tabId] = {}
    requestMap[details.tabId][getHostName(details.url)] = {
      ip: details.error,
      status: 'Error'
    }
  }
  updateTabBadgeText()
}

/* tab section*/
const tabRemoved = (tabId, removeInfo) => {
  if (requestMap.hasOwnProperty(tabId)) {
    setTimeout(() => {
      delete requestMap[tabId]
    }, 2000)
  }
}

const tabActivated = (activeInfo) => {
  updateTabBadgeText()
}

const tabUpdated = (tabId, changeInfo, tab) => {
  // clear all request message. If host main url is invalid, nothing will be monitored
  if (changeInfo.status === 'loading') {
    requestMap[tabId] = {}
  }
}

const addMonitor = () => {
  console.info('addMonitor')
  chrome.webRequest.onResponseStarted.addListener(monitorResponse, {
    urls: ['<all_urls>']
  })

  chrome.webRequest.onErrorOccurred.addListener(monitorError, {
    urls: ['<all_urls>']
  })

  chrome.tabs.onRemoved.addListener(tabRemoved)

  chrome.tabs.onActivated.addListener(tabActivated)

  chrome.tabs.onUpdated.addListener(tabUpdated)
}

const removeMonitor = () => {
  console.info('removeMonitor')

  chrome.webRequest.onResponseStarted.removeListener(monitorResponse)

  chrome.webRequest.onErrorOccurred.removeListener(monitorError)

  chrome.tabs.onRemoved.removeListener(tabRemoved)

  chrome.tabs.onActivated.removeListener(tabActivated)

  chrome.tabs.onUpdated.removeListener(tabUpdated)
}

const isMonitorEffective = () => {
  const flag = chrome.webRequest.onResponseStarted.hasListener(monitorResponse)
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
  console.info('backgroud Storage changed:', changes)
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
    await chrome.storage.local.set({
      config_ui: 'dark',
      config_updateUrl: true,
      config_monitor: false,
      config_autoSync: false,
      config_version: 1,
      direct: { mode: 'direct', name: 'direct', config: { mode: 'direct' } },
      system: { mode: 'system', name: 'system', config: { mode: 'system' } },
      reject: {
        mode: 'reject',
        name: 'reject',
        config: { mode: 'reject', rules: 'HTTPS 127.0.0.1:65432' }
      }
    })
    chrome.runtime.openOptionsPage()
  }
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

  chrome.webRequest.onAuthRequired.addListener(
    setProxyAuths,
    { urls: ['<all_urls>'] },
    ['asyncBlocking']
  )
})

// 在 background.js 中监听消息
chrome.runtime.onMessage.addListener(
  async function (request, sender, sendResponse) {
    let resqData
    switch (request.instruction) {
      case 'getRequestMap':
        resqData = handleGetRequestMap(request)
        sendResponse(resqData)
        break
      case 'setProxyAuths':
        resqData = handleSetProxyAuths(request)
        sendResponse(resqData)
        break
      case 'resetProxyAuths':
        sendResponse({})
        break
      default:
        sendResponse({})
    }
  }
)

function handleGetRequestMap(request) {
  console.info(
    'getRequestMap',
    JSON.stringify(requestMap[request.content.tabId])
  )
  if (requestMap.hasOwnProperty(request.content.tabId)) {
    return {
      code: 0,
      data: { list: JSON.stringify(requestMap[request.content.tabId]) }
    }
  } else {
    return { code: 0, data: { list: '' } }
  }
}

async function handleSetProxyAuths(request) {
  if (!chrome.webRequest.onAuthRequired.hasListeners()) {
    chrome.webRequest.onAuthRequired.addListener(
      setProxyAuths,
      { urls: ['<all_urls>'] },
      ['asyncBlocking']
    )
  }
  return { code: 0 }
}

async function setProxyAuths(details, callback) {
  console.info('Authentication required for URL: ', details)
  if (details.isProxy) {
    const result = await chrome.storage.local.get(null)
    const authList = getAuthList(result, result.status_proxyKey)
    for (const item of authList) {
      if (
        details.challenger.host == item.host &&
        details.challenger.port == item.port
      ) {
        console.info('Authentication required for URL: ', item)
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
