const Menus = {}

Menus.removeAll = async function () {
  return await chrome.contextMenus.removeAll()
}
Menus.remove = async function (id) {
  return await chrome.contextMenus.remove(id)
}

Menus.create = async function (menusItem) {
  return await chrome.contextMenus.create(menusItem)
}

Menus.onClickedBind = async function (func) {
  return await chrome.contextMenus.onClicked.addListener(func)
}

Menus.onClickedRemove = async function (func) {
  if (typeof func !== 'function') {
    return await chrome.contextMenus.onClicked.removeListener()
  }
  return await chrome.contextMenus.onClicked.removeListener(func)
}

export default Menus
