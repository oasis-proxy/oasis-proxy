import Storage from './storage.js'
import Proxy from './proxy.js'
import Tabs from './tabs.js'
import WebRequest from './WebRequest.js'
import Message from './message.js'
import i18n from './i18n.js'

const Runtime = {}

Runtime.openOptionsPage = function () {
  chrome.runtime.openOptionsPage()
}
Runtime.getManifest = function () {
  return chrome.runtime.getManifest()
}

const Browser = { Storage, Proxy, Tabs, WebRequest, Message, Runtime, i18n }

Browser.saveFile = function (obj, filename) {
  const fileContent = JSON.stringify(obj)
  const blob = new Blob([fileContent], { type: 'text/plain' })
  chrome.downloads.download({
    url: URL.createObjectURL(blob),
    filename: filename,
    saveAs: true
  })
}

export default Browser
