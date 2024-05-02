import { proxyUses, CONST_DEFAULT_PORT } from './ProxyConfig.js'

export const pacScriptCreate = function (proxyConfigs, key) {
  const nameList = proxyUses(proxyConfigs[key])
  const activeName = key.substring(6)
  nameList.push(activeName)
  let codeBlock = ''
  for (const name of nameList) {
    const proxyKey = 'proxy_' + name
    switch (proxyConfigs[proxyKey]?.mode) {
      case 'fixed_servers':
        codeBlock =
          codeBlock + createFixedServerCodeBlock(proxyConfigs[proxyKey])
        break
      case 'auto':
        codeBlock = codeBlock + createAutoCodeBlock(proxyConfigs[proxyKey])
        break
      default:
        if (name == 'reject') {
          codeBlock = codeBlock + createRejectCodeBlock(proxyConfigs.reject)
        }
        break
    }
  }
  return `var FindProxyForURL = function(init, profiles) {
    return function(url, host) {
        "use strict";
        var result = init, scheme = url.substr(0, url.indexOf(":"));
        do {
            if(!profiles.hasOwnProperty(result)) {
              break;
            } 
            result = profiles[result];
            if (typeof result === "function") result = result(url, host, scheme);
        } while (typeof result !== "string" || result.charCodeAt(0) === 43);
        return result;
    };
  }("+${activeName}", {
    ${codeBlock}
  });`
}

const createRejectCodeBlock = function (proxyConfig) {
  const code = `"+reject": function(url, host, scheme) {
    return "${proxyConfig.config.rules}"
  },`
  return code
}

const createAutoCodeBlock = function (proxyConfig) {
  const config = proxyConfig.config
  const externalStr = createAutoExternalRules(config.rules.external)
  const rejectStr = createAutoExternalRules(config.rules.reject)
  const internalStr = createAutoInternalRules(config.rules.internal)
  const tmpl = `"+${proxyConfig.name}": function(url, host, scheme) {
    "use strict";
    ${internalStr}

    ${rejectStr}

    ${externalStr}

    return "${config.rules.defaultProxy}"
  },
`
  return tmpl
}

const createAutoExternalRules = function (externalRule) {
  const lines = externalRule.data.split(/\r?\n/)
  const proxyRules = []
  const directRules = []
  lines.forEach((line) => {
    line = line.trim()
    if (line == '' || line.startsWith('!') || line.startsWith('[')) {
      return
    }
    line.startsWith('@@')
      ? directRules.push(line.substring(2))
      : proxyRules.push(line)
  })

  let block = ''
  block =
    block +
    directRules
      .map((item) => {
        return '    if (' + parseAutoProxyRule(item) + ') return "direct";'
      })
      .join('\n')
  block =
    block +
    '\n' +
    proxyRules
      .map((item) => {
        return (
          '    if (' +
          parseAutoProxyRule(item) +
          ') return "' +
          externalRule.proxy +
          '";'
        )
      })
      .join('\n')

  return block
}

const createAutoInternalRules = function (internalRules) {
  const rules = internalRules.filter(function (element) {
    return element.data !== '' && element.valid != false
  })
  let block = ''
  block = rules
    .map(
      (rule) =>
        '    if (' + parseInternalRule(rule) + ') return "' + rule.proxy + '";'
    )
    .join('\n')
  return block
}

const parseAutoProxyRule = function (rule) {
  if (rule.startsWith('||')) {
    return (
      rule
        .replace(/\*$/, '')
        .replace(/\//g, '\\/')
        .replace(/\./g, '\\.')
        .replace(/^\|\|/, '/(?:^|\\.)')
        .replace(/\*/g, '.*') + '$/.test(host)'
    )
  } else if (rule.startsWith('|')) {
    return (
      '/^' +
      rule
        .substring(1)
        .replace(/\*$/, '')
        .replace(/\//g, '\\/')
        .replace(/\./g, '\\.')
        .replace(/\?/g, '.')
        .replace(/\*/g, '.*') +
      '/.test(url)'
    )
  } else if (rule.startsWith('/')) {
    return rule + '.test(url)'
  } else {
    if (rule.lastIndexOf('*') > -1) {
      return (
        '/^http:\\/\\/.*' +
        rule
          .replace(/\*$/, '')
          .replace(/\//g, '\\/')
          .replace(/\./g, '\\.')
          .replace(/\?/g, '.')
          .replace(/\*/g, '.*') +
        '/.test(url)'
      )
    } else {
      return 'scheme === "http" && url.indexOf("' + rule + '") >= 0'
    }
  }
}

const parseInternalRule = function (rule) {
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
      if (rule.data.endsWith('*')) formatRule = formatRule + '/.test(host)'
      else formatRule = formatRule + '$/.test(host)'
      return formatRule
    case 'regex':
      return `${rule.data}.test(host)`
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
      formatRule = `host[host.length - 1] >= 0 && isInNet(host, "' + ${subnet} + '", "' + ${mask} + '")`
      return formatRule
    default:
      return ''
  }
}

const createFixedServerCodeBlock = function (proxyConfig) {
  const name = proxyConfig.name
  const config = proxyConfig.config

  let proxyStr = ''

  if (config.mode == 'fixed_servers') {
    let scheme = ''
    let port = ''
    let host = ''
    if (config.rules.hasOwnProperty('singleProxy')) {
      if (config.rules.singleProxy.scheme == 'direct') {
        proxyStr = `return "direct";`
      } else {
        scheme = config.rules.singleProxy.scheme
        host = config.rules.singleProxy.host
        port = config.rules.singleProxy.port
        if (port == null) port = CONST_DEFAULT_PORT[scheme]
        proxyStr = `return "${scheme} ${host}:${port}";`
      }
    } else {
      proxyStr = 'switch (scheme) {\n'
      if (
        config.rules.proxyForHttp?.host != null &&
        config.rules.proxyForHttp?.host != ''
      ) {
        scheme = config.rules.proxyForHttp.scheme
        host = config.rules.proxyForHttp.host
        port = config.rules.proxyForHttp.port
        if (port == null) port = CONST_DEFAULT_PORT[scheme]

        proxyStr =
          proxyStr +
          `
        case "http":
          return "${scheme} ${host}:${port}";
        `
      }
      if (
        config.rules.proxyForHttps?.host != null &&
        config.rules.proxyForHttps?.host != ''
      ) {
        scheme = config.rules.proxyForHttps.scheme
        host = config.rules.proxyForHttps.host
        port = config.rules.proxyForHttps.port
        if (port == null) port = CONST_DEFAULT_PORT[scheme]

        proxyStr =
          proxyStr +
          `
        case "https":
          return "${scheme} ${host}:${port}";
        `
      }
      if (
        config.rules.proxyForFtp?.host != null &&
        config.rules.proxyForFtp?.host != ''
      ) {
        scheme = config.rules.proxyForFtp.scheme
        host = config.rules.proxyForFtp.host
        port = config.rules.proxyForFtp.port
        if (port == null) port = CONST_DEFAULT_PORT[scheme]

        proxyStr =
          proxyStr +
          `
        case "ftp":
          return "${scheme} ${host}:${port}";
        `
      }
      if (
        config.rules.fallbackProxy?.host != null &&
        config.rules.fallbackProxy?.host != ''
      ) {
        scheme = config.rules.fallbackProxy.scheme
        host = config.rules.fallbackProxy.host
        port = config.rules.fallbackProxy.port
        if (port == null) port = CONST_DEFAULT_PORT[scheme]
        proxyStr =
          proxyStr +
          `
        default:
          return "${scheme} ${host}:${port}";
      }`
      } else {
        proxyStr =
          proxyStr +
          `
        default:
          return "direct";
      }`
      }
    }
  } else {
    proxyStr = `return "direct";`
  }

  let tmpl = `"+${name}": function(url, host, scheme) {
    "use strict";
    ${proxyStr}
  },`
  return tmpl
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
