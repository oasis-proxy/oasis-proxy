import Storage from './storage.js'
import Proxy from './proxy.js'
import Tabs from './tabs.js'
import Message from './message.js'
import I18n from './i18n.js'
import Action from './action.js'
import Menus from './menus.js'
import Runtime from './runtime.js'
import { log } from '@/core/utils.js'

const Browser = {
  Action,
  Menus,
  Storage,
  Proxy,
  Tabs,
  Message,
  Runtime,
  I18n,
  saveFile: async (obj, filename) => {
    let fileContent
    try {
      if (typeof obj === 'string') {
        fileContent = obj
      } else if (typeof obj === 'object') {
        fileContent = JSON.stringify(obj)
      } else {
        fileContent = 'Error'
        log.error('[-] saveFile: unsupport type[' + typeof obj + ']')
        return
      }
      const blob = new Blob([fileContent], { type: 'application/octet-stream' })
      await chrome.downloads.download({
        url: URL.createObjectURL(blob),
        filename: filename,
        saveAs: true
      })
    } catch (err) {
      log.error('[-] saveFile: ', err)
    }
  }
}
export default Browser
