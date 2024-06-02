import {
  overWriteToLocal,
  getSyncDownloadStatus
} from '@/core/version_control.js'

export const startAutoSync = async () => {
  let per = 1
  if (import.meta.env.VITE_APP_DEBUG != 'debug') {
    per = 60
  }

  await chrome.alarms.create('autoSync', { periodInMinutes: per })
  console.info('create autoSync', per)
}
export const endAutoSync = async () => {
  await chrome.alarms.clear('autoSync')
  console.info('clear autoSync')
}

export const handleAutoSync = async function () {
  console.info('handleAutoSync', new Date().toLocaleTimeString())
  switch (await getSyncDownloadStatus()) {
    case 'download':
      await overWriteToLocal()
      break
    case 'conflict':
      chrome.runtime.openOptionsPage()
      break
    default:
  }
}
