import * as ipaddr from 'ipaddr.js'

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
  }
}

export const simplify = function (config) {
  const simplifyConfig = {}
  for (const key of Object.keys(config)) {
    if (key.startsWith('proxy_')) {
      switch (config[key].mode) {
        case 'auto':
          simplifyConfig[key] = config[key]
          if (config[key].config.rules.external.url != '') {
            simplifyConfig[key].config.rules.external.data = ''
          }
          if (config[key].config.rules.reject.url != '') {
            simplifyConfig[key].config.rules.reject.data = ''
          }
          break
        case 'pac_script':
          simplifyConfig[key] = config[key]
          if (config[key].config.rules.url != '') {
            simplifyConfig[key].config.rules.data = ''
          }
          break
        case 'fixed_servers':
          simplifyConfig[key] = config[key]
          break
        default:
          break
      }
    }
  }
  return simplifyConfig
}

export const enrich = async function (config) {
  const enrichConfig = {}
  for (const key of Object.keys(config)) {
    if (key.startsWith('proxy_')) {
      let response
      switch (config[key].mode) {
        case 'auto':
          enrichConfig[key] = config[key]
          if (config[key].config.rules.external.url != '') {
            response = await downloadUrl(
              config[key].config.rules.external.url,
              'base64'
            )
            enrichConfig[key].config.rules.external.data = response.data
            enrichConfig[key].config.rules.external.urlUpdatedAt =
              response.updated
          }
          if (config[key].config.rules.reject.url != '') {
            response = await downloadUrl(
              config[key].config.rules.reject.url,
              'base64'
            )
            enrichConfig[key].config.rules.reject.data = response.data
            enrichConfig[key].config.rules.reject.urlUpdatedAt =
              response.updated
          }
          break
        case 'pac_script':
          enrichConfig[key] = config[key]
          if (config[key].config.rules.url != '') {
            response = await downloadUrl(config[key].config.rules.url, 'base64')
            enrichConfig[key].config.rules.data = response.data
            enrichConfig[key].config.rules.urlUpdatedAt = response.updated
          }
          break
        case 'fixed_servers':
          enrichConfig[key] = config[key]
          break
        default:
          break
      }
    }
  }

  return enrichConfig
}

export const parseAutoProxyFile = function (data, proxy) {
  const lines = data.split(/\r?\n/)
  const proxyRules = []
  const directRules = []
  lines.forEach((line) => {
    line = line.trim()
    if (line == '' || line.startsWith('!') || line.startsWith('[')) {
      return
    }
    line.startsWith('@@')
      ? directRules.push(parseAutoProxyRule(line.substring(2), 'direct'))
      : proxyRules.push(parseAutoProxyRule(line, proxy))
  })
  return [...directRules, ...proxyRules]
}

export const parseAutoProxyRule = function (data, proxy) {
  if (data.startsWith('||')) {
    return parseAutoProxyDomain({ data, proxy })
  } else if (data.startsWith('|')) {
    return parseUrl({ data, proxy })
  } else if (data.startsWith('/')) {
    // for regex
    return {
      rule: { regex: data },
      mode: 'url',
      proxy: proxy,
      orgin: { data: data }
    }
  } else {
    return parseHttpUrl({ data, proxy })
  }
}

export const parseInternalRule = function (rule) {
  switch (rule.mode) {
    case 'domain':
      return parseWildcardDomain({ ...rule })
    case 'regex':
      return {
        rule: { regex: '/' + rule.data.replace(/\//g, '\\/') + '/', port: '' },
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

export const parseBypassRule = function (item) {
  // <local>
  if (item == '<local>') {
    return parseLocal({ proxy: 'direct' })
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
    return parseIp({
      data: url.hostname.substring(1, url.hostname.length - 1),
      port: item.substring(item.lastIndexOf(']') + 2),
      proxy: 'direct'
    })
  } else {
    // v4:port hostname[:port]
    return parseBypassHostname({
      data: item.split(':')[0],
      proxy: 'direct',
      port: item.split(':')[1] == null ? '' : item.split(':')[1]
    })
  }
}

const parseIp = function ({ data, proxy, port = '' }) {
  let subnet = ''
  let mask = ''
  let ipv4 = true
  if (ipaddr.IPv6.isValidCIDR(data)) {
    subnet = ipaddr.IPv6.networkAddressFromCIDR(data)
    const prefixlength = ipaddr.IPv6.parseCIDR(data)[1]
    mask =
      ipaddr.IPv6.subnetMaskFromPrefixLength(prefixlength).toNormalizedString()
    ipv4 = false
  } else if (ipaddr.IPv6.isValid(data)) {
    subnet = data
    mask = ipaddr.IPv6.subnetMaskFromPrefixLength(128).toNormalizedString()
    ipv4 = false
  } else if (ipaddr.IPv4.isValidCIDR(data)) {
    subnet = ipaddr.IPv4.networkAddressFromCIDR(data)
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
    rule: { subnet: subnet, mask: mask, ipv4: ipv4, port: port },
    mode: 'ip',
    proxy: proxy,
    orgin: { data: data }
  }
  return res
}

const parseLocal = function ({ proxy }) {
  const res = [
    { rule: '', mode: 'plain', proxy: proxy, orgin: { data: '<local>' } }
  ]
  res.push(
    parseIp({ data: '127.0.0.1', proxy: proxy, orgin: { data: '<local>' } })
  )
  res.push(parseIp({ data: '::1', proxy: proxy, orgin: { data: '<local>' } }))
  return res
}

const parseBypassHostname = function ({ data, proxy, port = '' }) {
  const rule = {}
  let formatRule = ''
  if (data.startsWith('.') || data.startsWith('*')) formatRule = '/'
  else formatRule = '/^'
  formatRule =
    formatRule +
    data.replace(/^\./, '*.').replace(/\./g, '\\.').replace(/\*/g, '.*')
  rule.regex = formatRule + '/'
  rule.port = port
  return { rule: rule, mode: 'host', proxy: proxy, orgin: { data: data } }
}

const parseWildcardDomain = function ({ data, proxy, port = '' }) {
  let formatRule = ''
  if (data.startsWith('.') || data.startsWith('*')) formatRule = '/'
  else formatRule = '/^'
  formatRule =
    formatRule +
    data
      .replace(/^\./, '*.')
      .replace(/\./g, '\\.')
      .replace(/\?/g, '.')
      .replace(/^\*\\\./, '(?:^|\\.)') // '(?:^|\.)'
      .replace(/^\*\*\\./, '\\.') // '*\.'
      .replace(/\*/g, '.*')
  if (data.endsWith('*')) formatRule = formatRule + '/'
  else formatRule = formatRule + '$/'
  return {
    rule: { regex: formatRule, port },
    mode: 'host',
    proxy: proxy,
    orgin: { data: data }
  }
}

const parseAutoProxyDomain = function ({ data, proxy, port = '' }) {
  return {
    rule: {
      port: port,
      regex:
        data
          .replace(/\*$/, '')
          .replace(/\//g, '\\/')
          .replace(/\./g, '\\.')
          .replace(/^\|\|/, '/(?:^|\\.)')
          .replace(/\*/g, '.*') + '$/'
    },
    mode: 'host',
    proxy: proxy,
    orgin: { data: data }
  }
}

const parseUrl = function ({ data, proxy }) {
  return {
    rule: {
      regex:
        '/^' +
        data
          .substring(1)
          .replace(/\*$/, '')
          .replace(/\//g, '\\/')
          .replace(/\./g, '\\.')
          .replace(/\?/g, '.')
          .replace(/\*/g, '.*') +
        '/'
    },
    mode: 'url',
    proxy: proxy,
    orgin: { data: data }
  }
}

const parseHttpUrl = function ({ data, proxy }) {
  return {
    rule: {
      regex:
        '/^http:\\/\\/.*' +
        data
          .replace(/\*$/, '')
          .replace(/\//g, '\\/')
          .replace(/\./g, '\\.')
          .replace(/\?/g, '.')
          .replace(/\*/g, '.*') +
        '/'
    },
    mode: 'url',
    proxy: proxy,
    orgin: { data: data }
  }
}
