const Action = {}

Action.setBadgeBackgroundColor = async function (color) {
  await chrome.action.setBadgeBackgroundColor({ color: color })
}
Action.setBadgeText = async function (text) {
  await chrome.action.setBadgeText({ text: text })
}

export default Action
