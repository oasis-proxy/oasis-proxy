import Browser from '../Browser/chrome/chrome.js'
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

/* section 2: update Url */

const startUpdateUrl = async () => {
  await chrome.alarms.create('updateUrl', { periodInMinutes: 1440 })
  console.info('create updateUrl')
}
const endUpdateUrl = async () => {
  await chrome.alarms.clear('updateUrl')
  console.info('clear updateUrl')
}

const downloadUrl = async function (url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    var rawdata = await response.text()
    const curr = new Date().toLocaleString()

    rawdata = rawdata.replace(/\r?\n/g, '')
    var regstr =
      /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
    var base64data = ''
    if (regstr.test(rawdata)) {
      base64data = atob(rawdata)
    }
    return { data: base64data, updated: curr }
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error)
  }
}

const handleUpdateUrl = async function () {
  const result = await chrome.storage.local.get(null)
  for (let key of Object.keys(result)) {
    if (!key.startsWith('proxy_') || result[key].mode != 'auto') continue
    try {
      console.info('handleUpdateUrl', key)
      let updateFlag = false
      let response
      const updateProxyConfig = JSON.parse(JSON.stringify(result[key]))
      console.info('handleUpdateUrl updateProxyConfig', updateProxyConfig)
      if (updateProxyConfig.config.rules.external.url != '') {
        response = await downloadUrl(
          updateProxyConfig.config.rules.external.url
        )
        updateProxyConfig.config.rules.external.data = response.data
        updateProxyConfig.config.rules.external.urlUpdatedAt = response.updated
        updateFlag = true
      }
      if (updateProxyConfig.config.rules.reject.url != '') {
        response = await downloadUrl(
          result.proxyConfigObj[key].config.rules.reject.url
        )
        updateProxyConfig.config.rules.reject.data = response.data
        updateProxyConfig.config.rules.reject.urlUpdatedAt = response.updated
        updateFlag = true
      }
      if (updateFlag) {
        const storeObj = {}
        storeObj[key] = updateProxyConfig
        await chrome.storage.local.set(storeObj)
      }
    } catch (err) {}
  }
  const afterUpdateResult = await chrome.storage.local.get(null)
  if (afterUpdateResult.status_proxyKey != null) {
    Browser.Proxy.set(
      afterUpdateResult,
      afterUpdateResult.status_proxyKey,
      async () => {
        console.info(
          'Proxy updated after url updated',
          afterUpdateResult,
          afterUpdateResult.status_proxyKey
        )
      }
    )
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
      config_reject: 'HTTPS 127.0.0.1:65432',
      config_monitor: false,
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
    'config_updateUrl'
  ])

  result.config_monitor ? startMonitor() : endMonitor()
  result.config_updateUrl ? startUpdateUrl() : endUpdateUrl()
})

// 启动事件
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.local.get(null)
  console.debug('onStartup', result)

  result.config_monitor ? startMonitor() : endMonitor()
  result.config_updateUrl ? startUpdateUrl() : endUpdateUrl()

  chrome.webRequest.onAuthRequired.addListener(
    setProxyAuths,
    { urls: ['<all_urls>'] },
    ['blocking']
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
        resqData = handleResetProxyAuths(request)
        sendResponse(resqData)
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
  console.info('setProxyAuths', request)
  chrome.webRequest.onAuthRequired.removeListener(setProxyAuths)
  await chrome.storage.local.set(request.content)
  chrome.webRequest.onAuthRequired.addListener(
    setProxyAuths,
    { urls: ['<all_urls>'] },
    ['blocking']
  )
  return { code: 0 }
}

async function handleResetProxyAuths() {
  console.info('setProxyAuths', request)
  chrome.webRequest.onAuthRequired.removeListener(setProxyAuths)
  await chrome.storage.local.remove(['status_auths'])
  return { code: 0 }
}

async function setProxyAuths(details) {
  const result = await chrome.storage.local.get('status_auths')
  console.info('Authentication required for URL: ', details)
  if (result.hasOwnProperty('status_auths')) {
    for (const item of result.status_auths) {
      if (
        details.challenger.host == item.host &&
        details.challenger.port == item.port
      ) {
        return {
          authCredentials: {
            username: item.username,
            password: item.password
          }
        }
      }
    }
  }
  return null
}
