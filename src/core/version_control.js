import Browser from '@/Browser/main'
import { enrich, simplify } from '@/core/proxy_config.js'

const MAX_VERSION = 1000000

export const overWriteToLocal = async function () {
  const proxyConfigs = await Browser.Storage.getSyncAll()
  const version =
    proxyConfigs.config_version == null ? 1 : proxyConfigs.config_version
  const enrichedConfigs = await enrich(proxyConfigs)

  const localResult = await Browser.Storage.getLocalAll()
  const clearList = []
  Object.keys(localResult).forEach((key) => {
    if (key.startsWith('proxy_')) {
      clearList.push(key)
    }
  })
  await Browser.Storage.removeLocal(clearList)
  enrichedConfigs.config_version = version
  await Browser.Storage.setLocal(enrichedConfigs)
}

export const overWriteToCloud = async function () {
  const proxyConfigs = await Browser.Storage.getLocalAll()
  const localVersion =
    proxyConfigs.config_version == null ? 1 : proxyConfigs.config_version
  const simplifiedConfigs = await simplify(proxyConfigs)

  const cloudResult = await Browser.Storage.getSyncAll()
  const cloudVersion =
    cloudResult.config_version == null ? 1 : cloudResult.config_version
  const clearList = []
  Object.keys(cloudResult).forEach((key) => {
    if (key.startsWith('proxy_')) {
      clearList.push(key)
    }
  })
  await Browser.Storage.removeSync(clearList)

  if (cloudVersion >= localVersion) {
    simplifiedConfigs.config_version = (cloudVersion + 1) % MAX_VERSION
    await Browser.Storage.setLocal({
      config_version: simplifiedConfigs.config_version
    })
  } else {
    simplifiedConfigs.config_version = localVersion
  }
  simplifiedConfigs.config_syncTime = new Date().getTime()
  await Browser.Storage.setSync(simplifiedConfigs)
}

export const getNextLocalVersion = async function () {
  const currentVersion = await Browser.Storage.getLocal('config_version')
  return (currentVersion.config_version + 1) % MAX_VERSION
}

export const getSyncDownloadStatus = async function () {
  const local = await Browser.Storage.getLocal(['config_version'])
  const localVersion = local.config_version == null ? 1 : local.config_version
  const sync = await Browser.Storage.getSync(['config_version'])
  const syncVersion = sync.config_version == null ? 1 : sync.config_version
  if (syncVersion == localVersion) {
    return 'none'
  } else if (
    syncVersion > localVersion &&
    syncVersion - localVersion < MAX_VERSION / 2
  ) {
    return 'download'
  } else if (
    syncVersion > localVersion &&
    syncVersion - localVersion >= MAX_VERSION / 2
  ) {
    return 'conflict'
  } else if (
    syncVersion < localVersion &&
    localVersion - syncVersion < MAX_VERSION / 2
  ) {
    return 'conflict'
  } else {
    return 'download'
  }
}

export const getSyncUploadStatus = async function () {
  const local = await Browser.Storage.getLocal(['config_version'])
  const localVersion = local.config_version == null ? 1 : local.config_version
  const sync = await Browser.Storage.getSync(['config_version'])
  const syncVersion = sync.config_version == null ? 1 : sync.config_version
  if (localVersion == (syncVersion + 1) % MAX_VERSION) {
    return 'upload'
  } else {
    return 'conflict'
  }
}
