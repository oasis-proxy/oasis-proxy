const Message = {}

Message.send = function (obj) {
  return chrome.runtime.sendMessage(obj)
}

export default Message
