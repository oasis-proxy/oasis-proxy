import Storage from './storage.js'
import Proxy from './proxy.js'
import Tabs from './tabs.js'
import Message from './message.js'
import I18n from './i18n.js'

const Runtime = {}

Runtime.openOptionsPage = function () {
  chrome.runtime.openOptionsPage()
}
Runtime.getManifest = function () {
  return chrome.runtime.getManifest()
}

Runtime.getURL = function (options) {
  return chrome.runtime.getURL(options)
}

Runtime.addMessageListener = function (func) {
  chrome.runtime.onMessage.addListener(func)
}
const Browser = { Storage, Proxy, Tabs, Message, Runtime, I18n }

Browser.saveFile = function (obj, filename) {
  let fileContent
  if (typeof obj === 'string') {
    fileContent = obj
  } else if (typeof obj === 'object') {
    fileContent = JSON.stringify(obj)
  } else {
    fileContent = 'Error'
  }
  const blob = new Blob([fileContent], { type: 'application/octet-stream' })
  chrome.downloads.download({
    url: URL.createObjectURL(blob),
    filename: filename,
    saveAs: true
  })
}

export default Browser
