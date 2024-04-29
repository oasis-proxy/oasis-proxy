const Storage = {}

Storage.changed = function (callback = function (changes, areaName) {}) {
  chrome.storage.onChanged.addListener(callback)
}

Storage.getLocal = function (obj) {
  return chrome.storage.local.get(obj)
}

Storage.getLocalAll = function () {
  return chrome.storage.local.get(null)
}

Storage.setLocal = function (obj) {
  return chrome.storage.local.set(obj)
}

Storage.removeLocal = function (key) {
  return chrome.storage.local.remove(key)
}

Storage.getSync = function (obj) {
  return chrome.storage.sync.get(obj)
}

Storage.setSync = function (obj) {
  return chrome.storage.sync.set(obj)
}

Storage.clearLocal = function () {
  return chrome.storage.local.clear()
}

Storage.clearSync = function () {
  return chrome.storage.sync.clear()
}

export default Storage
