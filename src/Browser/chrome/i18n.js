const i18n = {}

i18n.getMessage = function (name) {
  return chrome.i18n.getMessage(name)
}

export default i18n
