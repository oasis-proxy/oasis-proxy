const Runtime = {}

Runtime.openOptionsPage = async function () {
  await chrome.runtime.openOptionsPage()
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

export default Runtime
