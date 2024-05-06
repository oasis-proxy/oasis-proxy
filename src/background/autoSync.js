import { overWriteToLocal, getSyncDownloadStatus } from '@/core/VersionControl'

export const startAutoSync = async () => {
  await chrome.alarms.create('autoSync', { periodInMinutes: 1 })
  console.info('create autoSync')
}
export const endAutoSync = async () => {
  await chrome.alarms.clear('autoSync')
  console.info('clear autoSync')
}

export const handleAutoSync = async function () {
  switch (await getSyncDownloadStatus()) {
    case 'download':
      await overWriteToLocal()
      break
    case 'conflict':
      // todo: ??
      break
    default:
  }
}
