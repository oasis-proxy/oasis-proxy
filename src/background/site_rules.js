import { matchSiteRules } from '@/core/siterules'

const handleErrorForSiteRules = async (details) => {
  console.log('handleTempRules', details)
  await matchSiteRules(details)
}

export const startSiteRule = () => {
  console.log('startSiteRule')
  chrome.webRequest.onErrorOccurred.addListener(handleErrorForSiteRules, {
    urls: ['<all_urls>']
  })
}

export const endSiteRule = () => {
  console.log('endSiteRule')
  chrome.webRequest.onErrorOccurred.removeListener(handleErrorForSiteRules, {
    urls: ['<all_urls>']
  })
}
