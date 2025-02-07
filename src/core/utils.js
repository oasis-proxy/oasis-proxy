export const downloadUrl = async function (url, format = null) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    let rawdata = await response.text()
    const curr = new Date().toLocaleString()
    if (format == 'base64') {
      rawdata = rawdata.replace(/\r?\n/g, '')
      const reg = new RegExp(
        '^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$'
      )
      let base64data = ''
      if (reg.test(rawdata)) {
        base64data = atob(rawdata)
      } else {
        throw new Error('Base64 Decode Error!')
      }
      return { data: base64data, updated: curr }
    } else if (format == 'raw' || format == null) {
      return { data: rawdata, updated: curr }
    } else {
      throw new Error('Unsupported Format ==> ' + format)
    }
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error)
    return {}
  }
}

export const objIsEqual = function (obj1, obj2) {
  if (obj1 === obj2) return true

  if (
    typeof obj1 !== 'object' ||
    obj1 === null ||
    typeof obj2 !== 'object' ||
    obj2 === null
  ) {
    return false
  }

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  for (let key of keys1) {
    if (!keys2.includes(key) || !objIsEqual(obj1[key], obj2[key])) {
      return false
    }
  }

  return true
}
