const Tabs = {}

Tabs.TAB_ID_NONE = chrome.tabs.TAB_ID_NONE

Tabs.query = function (obj) {
  return chrome.tabs.query(obj)
}
Tabs.get = function (tabId) {
  return chrome.tabs.get(tabId)
}
Tabs.addRemovedListener = function (func) {
  chrome.tabs.onRemoved.addListener(func)
}

Tabs.addUpdatedListener = function (func) {
  chrome.tabs.onUpdated.addListener(func)
}
export default Tabs
