const Storage = {}

Storage.addChangedListener = function (callback = function () {}) {
  chrome.storage.onChanged.addListener(callback)
}

Storage.removeChangedListener = function (callback = function () {}) {
  chrome.storage.onChanged.removeListener(callback)
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

Storage.clearLocal = function () {
  return chrome.storage.local.clear()
}

Storage.getSync = function (obj) {
  return chrome.storage.sync.get(obj)
}

Storage.getSyncAll = function () {
  return chrome.storage.sync.get(null)
}

Storage.setSync = function (obj) {
  return chrome.storage.sync.set(obj)
}

Storage.removeSync = function (key) {
  return chrome.storage.sync.remove(key)
}

Storage.clearSync = function () {
  return chrome.storage.sync.clear()
}

Storage.getSession = function (keyList) {
  return chrome.storage.session.get(keyList)
}

Storage.getSessionAll = function () {
  return chrome.storage.session.get()
}

Storage.setSession = function (obj) {
  return chrome.storage.session.set(obj)
}

Storage.removeSession = function (key) {
  return chrome.storage.session.remove(key)
}

Storage.clearSession = function () {
  return chrome.storage.session.clear()
}

Storage.getKeysSession = async function () {
  if (typeof chrome.storage.session.getKeys !== 'function') {
    return Object.keys(await chrome.storage.session.get(null))
  }
  return await chrome.storage.session.getKeys()
}

Storage.getKeysLocal = async function () {
  if (typeof chrome.storage.local.getKeys !== 'function') {
    return Object.keys(await chrome.storage.local.get(null))
  }
  return await chrome.storage.local.getKeys()
}

Storage.getKeysSync = async function () {
  if (typeof chrome.storage.sync.getKeys !== 'function') {
    return Object.keys(await chrome.storage.sync.get(null))
  }
  return await chrome.storage.sync.getKeys()
}

export default Storage
