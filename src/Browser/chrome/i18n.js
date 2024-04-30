const I18n = {}

I18n.getMessage = function (name) {
  return chrome.i18n.getMessage(name)
}

export default I18n
