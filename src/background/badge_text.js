import Browser from '@/Browser/main'
import { subStringForName } from '@/core/utils.js'

// clear monitor requests number
export const clearTabBadgeText = async () => {
  try {
    let result = await Browser.Storage.getLocalAll()
    const activeProxyKey = result.status_proxyKey
    const mode = result[activeProxyKey]?.mode
    switch (mode) {
      case 'system':
        await chrome.action.setBadgeBackgroundColor({
          color: '#000'
        })
        await chrome.action.setBadgeText({ text: 'Sys' })
        break
      case 'auto':
      case 'pac_script':
      case 'fixed_servers':
        await chrome.action.setBadgeBackgroundColor({
          color: result[activeProxyKey]?.tagColor
        })
        await chrome.action.setBadgeText({
          text: subStringForName(result[activeProxyKey].name)
        })
        break
      default:
        // 'direct' or default
        await chrome.action.setBadgeBackgroundColor({
          color: '#fff'
        })
        await chrome.action.setBadgeText({ text: 'Dir' })
    }
    chrome.action.setPopup({ popup: '/popup.html#/' })
  } catch (err) {
    console.error('clearTabBadgeText', err)
  }
}

export const updateTabBadgeText = async () => {
  try {
    let result = await Browser.Storage.getLocalAll()
    const activeProxyKey = result.status_proxyKey
    const mode = result[activeProxyKey]?.mode
    if (mode == 'auto' && result.config_monitor) {
      let tabs = await Browser.Tabs.getActiveTab()
      if (
        tabs != null &&
        tabs.length > 0 &&
        tabs[0].id != chrome.tabs.TAB_ID_NONE
      ) {
        const tabInfo = await Browser.Tabs.get(tabs[0].id)
        const activeTabId = 'tabId_' + tabs[0].id.toString()
        const requestSession = await Browser.Storage.getSession(activeTabId)

        if (
          requestSession[activeTabId] != null &&
          (tabInfo.url.startsWith('http://') ||
            tabInfo.url.startsWith('https://'))
        ) {
          let numText = Object.keys(
            requestSession[activeTabId]
          ).length.toString()
          if (numText == '0') {
            numText = subStringForName(result[activeProxyKey].name)
          }
          await chrome.action.setPopup({ popup: '/popup.html#/monitor' })
          chrome.action.setBadgeText({ text: numText })
          return
        } else {
          await chrome.action.setPopup({ popup: '/popup.html#/' })
          chrome.action.setBadgeText({
            text: subStringForName(result[activeProxyKey].name)
          })
        }
      }
    } else {
      await chrome.action.setPopup({ popup: '/popup.html#/' })
    }
  } catch (err) {
    console.error('updateTabBadgeText', err)
  }
}
