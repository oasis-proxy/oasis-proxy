import {
  overWriteToLocal,
  getSyncDownloadStatus
} from '@/core/version_control.js'
import Browser from '@/Browser/main'
import { log } from '@/core/utils.js'

export const startAutoSync = async () => {
  let per = 1
  if (import.meta.env.VITE_APP_DEBUG != 'debug') {
    per = 60
  }

  await chrome.alarms.create('autoSync', { periodInMinutes: per })
  log.info('create autoSync', per)
}

export const endAutoSync = async () => {
  await chrome.alarms.clear('autoSync')
  log.info('clear autoSync')
}

export const handleAutoSync = async () => {
  log.info('handleAutoSync', new Date().toLocaleTimeString())
  switch (await getSyncDownloadStatus()) {
    case 'download':
      await overWriteToLocal()
      await Browser.Proxy.reloadOrDirect()
      break
    case 'conflict':
      await chrome.runtime.openOptionsPage()
      break
    default:
  }
}
