import * as ipaddr from 'ipaddr.js'

export const parseAutoProxyFile = function (data, proxy) {
  const lines = data.split(/\r?\n/)
  const proxyRules = []
  const directRules = []
  lines.forEach((line) => {
    line = line.trim()
    if (line == '' || line.startsWith('!') || line.startsWith('[')) {
      return
    }
    if (line.startsWith('@@')) {
      const rule = parseAutoProxyRule({
        data: line.substring(2),
        proxy: 'direct'
      })
      if (rule.mode != 'invalid') directRules.push(rule)
    } else {
      const rule = parseAutoProxyRule({ data: line, proxy: proxy })
      if (rule.mode != 'invalid') proxyRules.push(rule)
    }
  })
  return [...directRules, ...proxyRules]
}

export const parseRuleItem = function (rule) {
  let regConst
  switch (rule.mode) {
    case 'domain':
      return parseWildcardDomain({ ...rule })
    case 'regex':
      regConst = getRegConst(rule.data)
      if (regConst == '') {
        return { mode: 'invalid' }
      }
      return {
        rule: { regex: regConst },
        mode: 'host',
        proxy: rule.proxy,
        orgin: { data: rule.data }
      }
    case 'ip':
      return parseIp(rule)
    default:
      return {
        rule: '',
        mode: 'invalid',
        proxy: 'direct',
        orgin: { data: rule.data }
      }
  }
}

// *.example.com
const parseWildcardDomain = function ({ data, proxy }) {
  let wstring = data
  const regConst = wildcardToRegConst(wstring)
  if (regConst == '') {
    return { mode: 'invalid' }
  }
  return {
    rule: { regex: regConst },
    mode: 'host',
    proxy: proxy,
    orgin: { data: data }
  }
}

const parseIp = function ({ data, proxy }) {
  let subnet = ''
  let mask = ''
  let ipv4 = true
  if (ipaddr.IPv6.isValidCIDR(data)) {
    subnet = ipaddr.IPv6.networkAddressFromCIDR(data).toNormalizedString()
    const prefixlength = ipaddr.IPv6.parseCIDR(data)[1]
    mask =
      ipaddr.IPv6.subnetMaskFromPrefixLength(prefixlength).toNormalizedString()
    ipv4 = false
  } else if (ipaddr.IPv6.isValid(data)) {
    subnet = data
    mask = ipaddr.IPv6.subnetMaskFromPrefixLength(128).toNormalizedString()
    ipv4 = false
  } else if (ipaddr.IPv4.isValidCIDR(data)) {
    subnet = ipaddr.IPv4.networkAddressFromCIDR(data).toNormalizedString()
    const prefixlength = ipaddr.IPv4.parseCIDR(data)[1]
    mask =
      ipaddr.IPv4.subnetMaskFromPrefixLength(prefixlength).toNormalizedString()
  } else if (ipaddr.IPv4.isValid(data)) {
    subnet = data
    mask = ipaddr.IPv4.subnetMaskFromPrefixLength(32).toNormalizedString()
  } else {
    return {
      rule: '',
      mode: 'invalid',
      proxy: 'direct'
    }
  }
  const res = {
    rule: { subnet: subnet, mask: mask, ipv4: ipv4 },
    mode: 'ip',
    proxy: proxy,
    orgin: { data: data }
  }
  return res
}

export const parseBypassRule = function (item) {
  // <local>
  if (item == '<local>') {
    return parseLocalForBypass({ proxy: 'direct' })
  }
  // IP_LITERAL/PREFIX_LENGTH_IN_BITS
  if (ipaddr.isValid(item) || ipaddr.isValidCIDR(item)) {
    return parseIp({ data: item, proxy: 'direct' })
  }
  // IP_LITERAL:PORT HOST_PATTERN[:PORT]
  const url = new URL('https://' + item)
  if (
    url.hostname.startsWith('[') &&
    url.hostname.endsWith(']') &&
    ipaddr.IPv6.isValid(url.hostname.substring(1, url.hostname.length - 1))
  ) {
    const res = parseIp({
      data: url.hostname.substring(1, url.hostname.length - 1),
      proxy: 'direct'
    })
    res.orgin.data = item
    return res
  } else {
    // v4:port hostname[:port]
    return parseHostnameForBypass({
      data: item.split(':')[0],
      proxy: 'direct'
    })
  }
}

const parseLocalForBypass = function ({ proxy }) {
  const res = [
    { rule: '', mode: 'plain', proxy: proxy, orgin: { data: '<local>' } }
  ]
  res.push(
    parseIp({ data: '127.0.0.1', proxy: proxy, orgin: { data: '<local>' } })
  )
  res.push(parseIp({ data: '::1', proxy: proxy, orgin: { data: '<local>' } }))
  return res
}

// https://developer.chrome.com/docs/extensions/reference/api/proxy
const parseHostnameForBypass = function ({ data, proxy }) {
  let wstring = ''
  if (data.startsWith('.')) wstring = '**' + data
  else if (data.startsWith('*.')) wstring = '*' + data
  else wstring = data
  const regConst = wildcardToRegConst(wstring)
  if (regConst == '') {
    return { mode: 'invalid' }
  }
  return {
    rule: {
      regex: regConst
    },
    mode: 'host',
    proxy: proxy,
    orgin: { data: data }
  }
}

const parseAutoProxyRule = function ({ data, proxy }) {
  if (data.startsWith('||')) {
    return parseDomainForAutoProxy({ data, proxy })
  } else if (data.startsWith('|')) {
    return parseUrlForAutoProxy({ data, proxy })
  } else if (data.startsWith('/')) {
    let regConst = getRegConst(data.substring(1, data.length - 1))
    if (regConst == '') {
      return { mode: 'invalid' }
    }
    return {
      rule: { regex: regConst },
      mode: 'url',
      proxy: proxy,
      orgin: { data: data }
    }
  } else {
    return parseHttpKeywordsForAutoProxy({ data, proxy })
  }
}

// ||example.com => .example.com
const parseDomainForAutoProxy = function ({ data, proxy }) {
  let wstring = data.replace(/^\|\|/, '.')

  const regConst = wildcardToRegConst(wstring)
  if (regConst == '') {
    return { mode: 'invalid' }
  }
  return {
    rule: {
      regex: regConst
    },
    mode: 'host',
    proxy: proxy,
    orgin: { data: data }
  }
}

// |http://example.com => http://example.com*
const parseUrlForAutoProxy = function ({ data, proxy }) {
  let wstring = data.substring(1)
  if (!data.endsWith('*')) {
    wstring = wstring + '*'
  }

  const regConst = wildcardToRegConst(wstring)
  if (regConst == '') {
    return { mode: 'invalid' }
  }
  return {
    rule: {
      regex: regConst
    },
    mode: 'url',
    proxy: proxy,
    orgin: { data: data }
  }
}

// example.com => http://*example.com*
const parseHttpKeywordsForAutoProxy = function ({ data, proxy }) {
  let wstring = 'http://'

  if (data.startsWith('*')) {
    wstring = wstring + data
  } else {
    wstring = wstring + '*' + data
  }
  if (!data.endsWith('*')) {
    wstring = wstring + '*'
  }

  const regConst = wildcardToRegConst(wstring)
  if (regConst == '') {
    return { mode: 'invalid' }
  }
  return {
    rule: {
      regex: regConst
    },
    mode: 'url',
    proxy: proxy,
    orgin: { data: data }
  }
}

export const getRegConst = function (regString) {
  try {
    const reg = new RegExp(regString)
    return reg.toString()
  } catch (e) {
    console.error(e)
    return ''
  }
}

const wildcardToRegConst = function (data) {
  let regString = ''
  if (!data.startsWith('.') && !data.startsWith('*')) regString = '^'

  regString =
    regString +
    data
      .replace(/^\./, '*.') // .examp?le.co*m => *.examp?le.co*m
      .replace(/\./g, '\\.') // *.examp?le.co*m => *\.examp?le\.co*m
      .replace(/\?/g, '.') // *\.examp?le\.co*m => *\.examp.le\.co*m
      .replace(/^\*\\\./, '(?:^|\\.)') // *\.examp?le\.co*m => (?:^|\.)examp.le\.co*m
      .replace(/^\*\*\\./, '\\.') // **\.examp?le\.co*m => \.examp.le\.co*m
      .replace(/\*/g, '.*') + // (?:^|\.)examp.le\.co*m => \.examp.le\.co.*m
    '$'
  return getRegConst(regString)
}

export const __private__ = {
  wildcardToRegConst,
  getRegConst,
  parseHttpKeywordsForAutoProxy,
  parseUrlForAutoProxy,
  parseDomainForAutoProxy,
  parseAutoProxyRule,
  parseHostnameForBypass,
  parseBypassRule,
  parseWildcardDomain
}
