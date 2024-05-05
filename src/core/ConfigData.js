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
      const regstr =
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
      let base64data = ''
      if (regstr.test(rawdata)) {
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

export const parseAutoProxyRule = function (rule, proxy) {
  console.log(rule)
  if (rule.startsWith('||')) {
    return {
      rule:
        rule
          .replace(/\*$/, '')
          .replace(/\//g, '\\/')
          .replace(/\./g, '\\.')
          .replace(/^\|\|/, '/(?:^|\\.)')
          .replace(/\*/g, '.*') + '$/',
      mode: 'host',
      proxy: proxy
    }
  } else if (rule.startsWith('|')) {
    return {
      rule:
        '/^' +
        rule
          .substring(1)
          .replace(/\*$/, '')
          .replace(/\//g, '\\/')
          .replace(/\./g, '\\.')
          .replace(/\?/g, '.')
          .replace(/\*/g, '.*') +
        '/',
      mode: 'url',
      proxy: proxy
    }
  } else if (rule.startsWith('/')) {
    return { rule: rule, mode: 'url' }
  } else {
    return {
      rule:
        '/^http:\\/\\/.*' +
        rule
          .replace(/\*$/, '')
          .replace(/\//g, '\\/')
          .replace(/\./g, '\\.')
          .replace(/\?/g, '.')
          .replace(/\*/g, '.*') +
        '/',
      mode: 'url',
      proxy: proxy
    }
  }
}

export const parseInternalRule = function (rule) {
  let formatRule = ''
  switch (rule.mode) {
    case 'domain':
      if (rule.data.startsWith('.') || rule.data.startsWith('*'))
        formatRule = '/'
      else formatRule = '/^'
      formatRule =
        formatRule +
        rule.data
          .replace(/^\./, '*.')
          .replace(/\./g, '\\.')
          .replace(/\?/g, '.')
          .replace(/^\*\\\./, '(?:^|\\.)') // '(?:^|\.)'
          .replace(/^\*\*\\./, '\\.') // '*\.'
          .replace(/\*/g, '.*')
      if (rule.data.endsWith('*')) formatRule = formatRule + '/'
      else formatRule = formatRule + '$/'
      return { rule: formatRule, mode: 'host', proxy: rule.proxy }
    case 'regex':
      return { rule: rule, mode: 'host', proxy: rule.proxy }
    case 'ip':
      let mask
      let subnet
      if (rule.data.lastIndexOf('/') > 0) {
        subnet = rule.data.split('/')[0]
        if (subnet.lastIndexOf(':') >= 0) {
          mask = ipv6CidrToSubnetMask(rule.data.split('/')[1])
        } else {
          mask = ipv4CidrToSubnetMask(rule.data.split('/')[1])
        }
      } else {
        subnet = rule.data
        rule.data.lastIndexOf(':') > 0
          ? (mask = 'FFFF:FFFF:FFFF:FFFF::')
          : (mask = '255.255.255.255')
      }
      return {
        rule: { subnet: subnet, mask: mask },
        mode: 'ip',
        proxy: rule.proxy
      }
    default:
      return ''
  }
}

const ipv4CidrRegex =
  /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}\/(?:[1-9]|[1-2]\d|3[0-2])$/
const ipv6CidrRegex =
  /^(?:[A-f0-9]{0,4}:){2,7}[A-f0-9]{0,4}\/(?:[1-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8])$/i

function ipv4CidrToSubnetMask(cidr) {
  let binaryPrefix = '1'.repeat(cidr) + '0'.repeat(32 - cidr)
  let binaryGroups = binaryPrefix.match(/.{8}/g)
  let decimalGroups = binaryGroups.map((group) => parseInt(group, 2))
  let subnetMask = decimalGroups.join('.')
  return subnetMask
}

function ipv6CidrToSubnetMask(cidr) {
  let binaryPrefix = '1'.repeat(cidr)
  while (binaryPrefix.length < 128) {
    binaryPrefix += '0'
  }
  let binaryGroups = binaryPrefix.match(/.{1,16}/g)
  let hexGroups = binaryGroups.map((group) => parseInt(group, 2).toString(16))
  let subnetMask = hexGroups
    .join(':')
    .replace(/(:|^)0(:0)*:/, '$1')
    .replace(/(0:){2,}/, '0::')
  return subnetMask
}
