import Browser from '@/Browser/main'
import { getRules, checkRules, getTempRuleList } from '@/core/rules_pretest.js'
import { log, getHostName } from '@/core/utils.js'

const CONTEXTMENUS_GETLINKRULES = {
  id: 'getLinkRules',
  title: Browser.I18n.getMessage('desc_show_url_rule'),
  documentUrlPatterns: ['http://*/*', 'https://*/*'],
  contexts: ['link', 'image', 'page']
}
const CONTEXTMENUS_QUICKADDLINKRULES = {
  id: 'quickAddLinkRules',
  title: Browser.I18n.getMessage('desc_add_link_rule'),
  documentUrlPatterns: ['http://*/*', 'https://*/*'],
  contexts: ['link', 'image', 'page']
}
const CONTEXTMENUS_QUICKADDSITERULES = {
  id: 'quickAddSiteRules',
  title: Browser.I18n.getMessage('desc_add_site_rule'),
  documentUrlPatterns: ['http://*/*', 'https://*/*'],
  contexts: ['link', 'image', 'page']
}
const CONTEXTMENUS_QUICKADDFORDOWNLOADS = {
  id: 'sidepanelForDownloads',
  title: Browser.I18n.getMessage('desc_show_download_sidepanel'),
  documentUrlPatterns: ['chrome://downloads/*']
}

export const addAllContextMenus = async function () {
  log.debug('addAllContextMenus')
  const menusList = [
    CONTEXTMENUS_GETLINKRULES,
    CONTEXTMENUS_QUICKADDLINKRULES,
    CONTEXTMENUS_QUICKADDFORDOWNLOADS
  ]
  const result = await Browser.Storage.getLocal('config_siteRules')
  if (result.config_siteRules) {
    menusList.push(CONTEXTMENUS_QUICKADDSITERULES)
  }
  await Browser.Menus.removeAll()
  for (const item of menusList) {
    await Browser.Menus.create(item)
  }
}

export const removeAllContextMenus = async function () {
  log.debug('removeAllContextMenus')

  await Browser.Menus.onClickedRemove()
  await Browser.Menus.removeAll()
}

export const removeQuickAddSiteRulesContextMenus = async function () {
  await Browser.Menus.remove(CONTEXTMENUS_QUICKADDSITERULES.id)
}

export const addQuickAddSiteRulesContextMenus = async function () {
  await Browser.Menus.create(CONTEXTMENUS_QUICKADDSITERULES)
}

export const contextMenusClick = async (info, tab) => {
  log.debug('contextMenusClick', info, tab)
  switch (info.menuItemId) {
    case 'quickAddSiteRules':
      await quickAddSiteRules(info, tab)
      break
    case 'quickAddLinkRules':
      await quickAddLinkRules(info)
      break
    case 'getLinkRules':
      await getLinkRulesOnClick(info, tab)
      break
    default:
  }
}

const getLinkRulesOnClick = async (info, tab) => {
  const result = await Browser.Storage.getLocalAll()
  if (!result[result.status_proxyKey]) {
    return
  }
  const tempRuleList = await getTempRuleList()
  const activeRules = getRules(result[result.status_proxyKey], tempRuleList)

  const message = []
  let policyRule
  if (info.linkUrl) {
    message.push({ name: info.linkUrl, value: '' })
    policyRule = checkRules(info.linkUrl, activeRules)
    message.push({
      name: Browser.I18n.getMessage('th_col_link_target'),
      value: Browser.I18n.getMessage('desc_links')
    })
    message.push({
      name: Browser.I18n.getMessage('th_col_policy'),
      value: policyRule.policy
    })
    message.push({
      name: Browser.I18n.getMessage('th_col_rule'),
      value: policyRule.rule ? policyRule.rule : '-'
    })
  }

  if (info.srcUrl) {
    message.push({ name: info.srcUrl, value: '' })
    policyRule = checkRules(info.srcUrl, activeRules)
    message.push({
      name: Browser.I18n.getMessage('th_col_link_target'),
      value: Browser.I18n.getMessage('desc_image')
    })
    message.push({
      name: Browser.I18n.getMessage('th_col_policy'),
      value: policyRule.policy
    })
    message.push({
      name: Browser.I18n.getMessage('th_col_rule'),
      value: policyRule.rule ? policyRule.rule : '-'
    })
  }

  if (info.pageUrl) {
    message.push({ name: info.pageUrl, value: '' })
    policyRule = checkRules(info.pageUrl, activeRules)
    message.push({
      name: Browser.I18n.getMessage('th_col_link_target'),
      value: Browser.I18n.getMessage('desc_main_page')
    })
    message.push({
      name: Browser.I18n.getMessage('th_col_policy'),
      value: policyRule.policy
    })
    message.push({
      name: Browser.I18n.getMessage('th_col_rule'),
      value: policyRule.rule ? policyRule.rule : '-'
    })
  }

  await Browser.Storage.setSession({ temp_infoview: JSON.stringify(message) })
  await chrome.action.setPopup({ popup: '/popup.html#/info' })
  chrome.action.openPopup()
}

async function quickAddLinkRules(info) {
  const hostsList = []
  if (info.linkUrl) {
    hostsList.push(getHostName(info.linkUrl))
  }
  if (info.srcUrl) {
    hostsList.push(getHostName(info.srcUrl))
  }
  if (info.pageUrl) {
    hostsList.push(getHostName(info.pageUrl))
  }

  const paramObj = {
    hosts: hostsList,
    rulesType: 'link'
  }

  await Browser.Storage.setSession({ contextMenus_rules: paramObj })
  await chrome.action.setPopup({ popup: '/popup.html#/quick?source=menus' })
  chrome.action.openPopup()
}

async function quickAddSiteRules(info, tab) {
  if (info.pageUrl) {
    const paramObj = {
      hosts: [getHostName(info.pageUrl)],
      rulesType: 'site'
    }
    await Browser.Storage.setSession({ contextMenus_rules: paramObj })
  }

  await chrome.action.setPopup({ popup: '/popup.html#/quick?source=menus' })
  chrome.action.openPopup()
}
