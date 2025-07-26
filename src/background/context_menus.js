import Browser from '@/Browser/main'
import { getRules, checkRules } from '@/core/rules_pretest.js'

export const addContextMenus = async function () {
  const contextMenusAllowed = await chrome.permissions.contains({
    permissions: ['contextMenus']
  })
  if (!contextMenusAllowed) return

  await chrome.contextMenus.removeAll()
  await chrome.contextMenus.create({
    id: 'linkMenu',
    title: '查看链接规则',
    contexts: ['link', 'image', 'page']
  })
  chrome.contextMenus.onClicked.addListener(contextMenusClick)
}

export const removeContextMenus = async function () {
  const contextMenusAllowed = await chrome.permissions.contains({
    permissions: ['contextMenus']
  })
  if (!contextMenusAllowed) return

  await chrome.contextMenus.removeAll()
  await chrome.contextMenus.onClicked.removeAll()
}

export const initContextMenus = async function () {
  const result = await Browser.Storage.getLocal('config_contextMenus')
  result.config_contextMenus
    ? await addContextMenus()
    : await removeContextMenus
}

const contextMenusClick = async (info, tab) => {
  if (info.menuItemId === 'linkMenu') {
    const result = await Browser.Storage.getLocalAll()
    if (!result[result.status_proxyKey]) {
      return
    }
    const activeRules = getRules(result[result.status_proxyKey])

    const message = []
    let policyRule
    if (info.linkUrl) {
      message.push({ name: info.linkUrl, value: '' })
      policyRule = checkRules(info.linkUrl, activeRules)
      message.push({ name: '地址类型', value: '链接' })
      message.push({
        name: '代理(策略组)',
        value: policyRule.policy
      })
      message.push({
        name: '规则',
        value: policyRule.rule ? policyRule.rule : '-'
      })
    }

    if (info.srcUrl) {
      message.push({ name: info.srcUrl, value: '' })
      policyRule = checkRules(info.srcUrl, activeRules)
      message.push({ name: '地址类型', value: '图片' })
      message.push({
        name: '代理(策略组)',
        value: policyRule.policy
      })
      message.push({
        name: '规则',
        value: policyRule.rule ? policyRule.rule : '-'
      })
    }

    if (info.pageUrl) {
      message.push({ name: info.pageUrl, value: '' })
      policyRule = checkRules(info.pageUrl, activeRules)
      message.push({ name: '地址类型', value: '主页面' })
      message.push({
        name: '代理(策略组)',
        value: policyRule.policy
      })
      message.push({
        name: '规则',
        value: policyRule.rule ? policyRule.rule : '-'
      })
    }

    await Browser.Storage.setSession({ temp_infoview: JSON.stringify(message) })
    await chrome.action.setPopup({ popup: '/popup.html#/info' })
    chrome.action.openPopup()
  }
}

async function quickAddSiteRuleList(url) {
  const host = new URL(url).hostname
}
