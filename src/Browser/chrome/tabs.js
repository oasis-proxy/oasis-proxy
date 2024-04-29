const Tabs = {}

Tabs.query = function (obj) {
  return chrome.tabs.query(obj)
}

export default Tabs
