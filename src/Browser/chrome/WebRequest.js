import Storage from './storage.js'
const WebRequest = {}

function setAuth(details) {}

// authList = {host, port, username, password}
WebRequest.Auth = async function (authList) {
  console.info('webRequestAuth', authList)
  if (authList.length > 0) {
    chrome.webRequest.onAuthRequired.addListener(
      (details) => {
        console.info('Authentication required for URL: ', details)
        for (const item of authList) {
          if (
            details.challenger.host == item.host &&
            details.challenger.port == item.port
          ) {
            return {
              authCredentials: {
                username: item.username,
                password: item.password
              }
            }
          }
        }
        return null
      },
      { urls: ['<all_urls>'] },
      ['blocking']
    )
    const status_auths = { status_auths: authList }
    await Storage.setLocal(status_auths)
  }
}

WebRequest.removeAuth = function () {
  console.info('removeAuth')
  chrome.webRequest.onAuthRequired.removeListener(setAuth)
}

export default WebRequest
