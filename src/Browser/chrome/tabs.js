const Tabs = {}

Tabs.TAB_ID_NONE = chrome.tabs.TAB_ID_NONE

Tabs.query = function (obj) {
  return chrome.tabs.query(obj)
}

Tabs.getActiveTab = function () {
  return chrome.tabs.query({ active: true, currentWindow: true })
}

Tabs.get = function (tabId) {
  return chrome.tabs.get(tabId)
}

Tabs.reload = function (tabId, reloadProperties = { bypassCache: false }) {
  chrome.tabs.reload(tabId, reloadProperties)
}

Tabs.addRemovedListener = function (func) {
  chrome.tabs.onRemoved.addListener(func)
}

Tabs.addUpdatedListener = function (func) {
  chrome.tabs.onUpdated.addListener(func)
}
export default Tabs
