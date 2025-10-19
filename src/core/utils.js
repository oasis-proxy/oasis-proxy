import { cctld, tld } from './tld'

export const enumInterval = {
  '24h': 1440,
  '12h': 720,
  '6h': 360,
  '3h': 180,
  '1h': 60,
  '15m': 15,
  '1m': 1,
  default: 'default',
  manual: 'manual'
}

export const downloadUrl = async function (url, format = 'raw') {
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
    } else if (format == 'raw') {
      return { data: rawdata, updated: curr }
    } else {
      throw new Error('Unsupported Format ==> ' + format)
    }
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error)
    return {}
  }
}

export const getHostName = (url) => {
  return new URL(url).hostname
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

export const subStringForName = function (name, prefix = 3) {
  const subName = decodeURIComponent(name).substring(0, prefix)
  // subName is acsii
  if (subName.length == encodeURIComponent(subName).length) {
    if (subName.length < name.length) {
      return subName + '..'
    }
    return subName
  } else return subName.substring(0, Math.round(prefix / 2)) + '..'
}

export const filterPrefix = function (obj, keyPrefix) {
  const resObj = {}
  Object.keys(obj).forEach((key) => {
    if (key.startsWith(keyPrefix)) {
      resObj[key] = obj[key]
    }
  })
  return resObj
}

export const filterPrefixArray = function (obj, keyPrefix) {
  const resArr = []
  Object.keys(obj).forEach((key) => {
    if (key.startsWith(keyPrefix)) {
      resArr.push(obj[key])
    }
  })
  resArr.sort((a, b) => {
    return sortDomain(a.data, b.data)
  })
  return resArr
}

export const sortDomain = function (domainA, domainB) {
  const a = domainA.split('.').reverse()
  const b = domainB.split('.').reverse()

  for (const index in a) {
    if (!b[index]) {
      break
    }
    if (a[index] > b[index]) {
      return 1
    } else if (a[index] < b[index]) {
      return -1
    } else {
      continue
    }
  }
  if (a.length > b.length) {
    return 1
  } else if (a.length == b.length) {
    return 0
  } else {
    return -1
  }
}

export const formatCode = async function (codeString, parser = 'babel') {
  const prettier = await import('prettier/standalone')
  const parserBabel = await import('prettier/plugins/babel')
  const parserEtree = await import('prettier/plugins/estree')
  const prettierCode = await prettier.format(codeString, {
    tabWidth: 2,
    bracketSpacing: true,
    parser: parser,
    plugins: [parserBabel, parserEtree]
  })
  return prettierCode
}

export const getExpiredIntervalTime = function (data) {
  const regex = /!\s+Expires:\s+([^\n\s]+)/
  const interval = data.match(regex)

  if (!interval) return 0
  const match = interval[1].match(/(?:(\d+)h)?(?:(\d+)m)?/)

  if (!match) return 0
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)

  return hours * 3600000 + minutes * 60000
}

export const find = (
  list = [],
  condition = [{ key: '', value: '' }],
  op = 'and'
) => {
  return list.filter((element) => {
    let flag = true
    if (condition.length == 0) {
      return true
    }
    if (op != 'or' && op != 'and') {
      throw new Error('Invalid operator, only "or" and "and" are supported')
    }
    if (op == 'or') {
      for (const c of condition) {
        if (element[c.key] == c.value) {
          return true
        }
      }
      return false
    } else if (op == 'and') {
      for (const c of condition) {
        if (element[c.key] != c.value) {
          flag = false
          break
        }
      }
    }
    return flag
  })
}

export const getSuffix = (domain) => {
  const parts = domain.split('.').reverse()
  let suffix = ''
  if (cctld.includes(parts[0]) && tld.includes(parts[1]) && parts.length > 2) {
    suffix = '.' + parts[2] + '.' + parts[1] + '.' + parts[0]
  } else {
    suffix = '.' + parts[1] + '.' + parts[0]
  }
  return suffix
}

export const log = {
  error: console.error,
  info: console.info,
  debug: (() => {
    if (['debug', 'trace'].includes(import.meta.env.VITE_APP_DEBUG)) {
      return console.debug
    }
    return () => {}
  })(),
  trace: (() => {
    if (import.meta.env.VITE_APP_DEBUG == 'trace') {
      return console.debug
    }
    return () => {}
  })()
}
