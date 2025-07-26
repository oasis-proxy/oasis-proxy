import { getHostName, log } from '@/core/utils.js'
import { clearTabBadgeText, updateTabBadgeText } from './badge_text.js'

const monitorResponse = async (details) => {
  if (!details.url.startsWith('http')) {
    return
  }
  const tabId = details.tabId.toString()
  if (tabId == chrome.tabs.TAB_ID_NONE) {
    return
  }
  const sessionTabId = 'tabId_' + tabId
  const requestSession = await chrome.storage.session.get(sessionTabId)
  if (!Object.keys(requestSession).includes(sessionTabId)) {
    requestSession[sessionTabId] = {}
  }
  requestSession[sessionTabId][getHostName(details.url)] = {
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

const monitorBeforeRequest = async (details) => {
  if (!details.url.startsWith('http')) {
    return
  }
  const tabId = details.tabId.toString()
  if (tabId == chrome.tabs.TAB_ID_NONE) {
    return
  }
  const sessionTabId = 'tabId_' + tabId
  const requestSession = await chrome.storage.session.get(sessionTabId)
  if (!Object.keys(requestSession).includes(sessionTabId)) {
    requestSession[sessionTabId] = {}
  }
  if (
    !Object.keys(requestSession[sessionTabId]).includes(
      getHostName(details.url)
    )
  ) {
    requestSession[sessionTabId][getHostName(details.url)] = {
      ip: 'Loading',
      status: 'Loading'
    }
    await chrome.storage.session.set(requestSession)
    updateTabBadgeText()
    chrome.runtime.sendMessage({ instruction: 'updateList' }, () => {
      if (chrome.runtime.lastError) {
        return
      }
    })
  }

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

const monitorBeforeRedirect = async (details) => {
  if (!details.url.startsWith('http')) {
    return
  }
  const tabId = details.tabId.toString()
  if (tabId == chrome.tabs.TAB_ID_NONE) {
    return
  }
  const sessionTabId = 'tabId_' + tabId
  const requestSession = await chrome.storage.session.get(sessionTabId)
  if (!Object.keys(requestSession).includes(sessionTabId)) {
    requestSession[sessionTabId] = {}
  }
  if (requestSession[sessionTabId][getHostName(details.url)].ip == 'Loading') {
    requestSession[sessionTabId][getHostName(details.url)] = {
      ip: 'Redirect',
      status: 'Redirect'
    }
    await chrome.storage.session.set(requestSession)
    updateTabBadgeText()
    chrome.runtime.sendMessage({ instruction: 'updateList' }, () => {
      if (chrome.runtime.lastError) {
        return
      }
    })
  }
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
  if (!details.url.startsWith('http')) {
    return
  }
  const tabId = details.tabId.toString()
  if (tabId == chrome.tabs.TAB_ID_NONE) {
    return
  }
  const sessionTabId = 'tabId_' + tabId
  const requestSession = await chrome.storage.session.get(sessionTabId)
  if (!Object.keys(requestSession).includes(sessionTabId)) {
    requestSession[sessionTabId] = {}
  }
  requestSession[sessionTabId][getHostName(details.url)] = {
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

export const handleMonitor = async function () {
  const result = await chrome.storage.local.get(['config_monitor'])
  if (result.config_monitor && !isMonitorEffective()) {
    addMonitor()
  }
  if (!result.config_monitor && isMonitorEffective()) {
    removeMonitor()
  }
}

const isMonitorEffective = () => {
  const flag = chrome.webRequest.onCompleted.hasListener(monitorResponse)
  log.debug('isMonitorEffective', flag)
  return flag
}

export const startMonitor = async function () {
  log.info('create monitorRequest')
  if (!isMonitorEffective()) {
    addMonitor()
  }
  // keepalive
  await chrome.alarms.create('monitorRequest', { periodInMinutes: 1 })
}

export const endMonitor = async function () {
  log.info('clear monitorRequest')
  if (isMonitorEffective()) {
    removeMonitor()
  }
  // clear keepalive
  await chrome.alarms.clear('monitorRequest')
}

const addMonitor = () => {
  log.info('addMonitor')
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

export const removeMonitor = () => {
  log.info('removeMonitor')
  chrome.webRequest.onBeforeRequest.removeListener(monitorBeforeRequest)

  chrome.webRequest.onBeforeRedirect.removeListener(monitorBeforeRedirect)

  chrome.webRequest.onCompleted.removeListener(monitorResponse)

  chrome.webRequest.onErrorOccurred.removeListener(monitorError)

  chrome.tabs.onActivated.removeListener(tabActivated)

  chrome.tabs.onUpdated.removeListener(tabUpdated)

  chrome.tabs.onRemoved.removeListener(tabRemoved)

  clearTabBadgeText()
}

/* tab section*/
const tabRemoved = (tabId) => {
  setTimeout(async () => {
    await chrome.storage.session.remove('tabId_' + tabId.toString())
  }, 2000)
}

const tabActivated = () => {
  updateTabBadgeText()
}

const tabUpdated = async (tabId, changeInfo, tab) => {
  // clear all request message. If host main url is invalid, nothing will be monitored
  if (changeInfo.status === 'loading' && tab.url != null) {
    await chrome.storage.session.set({ ['tabId_' + tabId.toString()]: {} })
    updateTabBadgeText()
    chrome.runtime.sendMessage({ instruction: 'clearList' }, () => {
      if (chrome.runtime.lastError) {
        return
      }
    })
  }
}
