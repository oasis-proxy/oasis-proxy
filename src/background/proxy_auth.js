import { getAuthList } from '@/core/proxy_config.js'

export async function setProxyAuths(details, callback) {
  if (details.isProxy) {
    const result = await chrome.storage.local.get(null)
    const authList = getAuthList(result, result.status_proxyKey)
    for (const item of authList) {
      if (
        details.challenger.host == item.host &&
        details.challenger.port == item.port
      ) {
        callback({
          authCredentials: {
            username: item.username,
            password: item.password
          }
        })
      }
    }
    callback()
  }
  callback()
}
