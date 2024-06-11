export const downloadUrl = async function (url, format = '') {
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
      }
      return { data: base64data, updated: curr }
    } else {
      return { data: rawdata, updated: curr }
    }
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error)
    return {}
  }
}
