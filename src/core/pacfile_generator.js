import { proxyUses, CONST_DEFAULT_PORT } from './proxy_config.js'
import {
  parseAutoProxyFile,
  parseRuleItem,
  parseBypassRule
} from './rules_parser.js'

export const generatePacfile = function (proxyConfigs, key) {
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
      if (!profiles.hasOwnProperty(result)) {
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
    "use strict";
    return "${proxyConfig.config.rules}";
  }, `
  return code
}

const createAutoCodeBlock = function (proxyConfig) {
  const config = proxyConfig.config
  const localRulesSetStr = createRulesSet(config.rules.local.rulesSet)
  const rejectRulesSetStr = createRulesSet(config.rules.reject.rulesSet)
  const localRuleListStr = createRuleList(config.rules.local.ruleList)
  const rejectRuleListStr = createRuleList(config.rules.reject.ruleList)
  const tmpl = `"+${proxyConfig.name}": function(url, host, scheme) {
    "use strict";
${localRuleListStr}
${rejectRuleListStr}
${rejectRulesSetStr}
${localRulesSetStr}
    return "${config.rules.defaultProxy}";
  }, `
  return tmpl
}

const createRulesSet = function (rulesSet) {
  const apFileRules = parseAutoProxyFile(rulesSet.data, rulesSet.proxy)

  let block = ''
  block =
    block +
    apFileRules
      .map((item) => {
        return generateConditionCode(item)
      })
      .join('\n') +
    '\n'

  return block
}

const createRuleList = function (ruleList) {
  const rules = ruleList.filter(function (element) {
    return (
      element.data !== '' && element.valid != false && element.mode != 'divider'
    )
  })
  let block = ''
  block =
    rules
      .map((rule) => {
        const formattedRule = parseRuleItem(rule)
        return generateConditionCode(formattedRule)
      })
      .join('\n') + '\n'
  return block
}

const createFixedServerCodeBlock = function (proxyConfig) {
  const name = proxyConfig.name
  const config = proxyConfig.config

  let proxyStr = ''

  if (config.mode == 'fixed_servers') {
    let scheme = ''
    let port = ''
    let host = ''
    proxyStr =
      config.rules.bypassList
        .map((item) => {
          if (item == '<local>') {
            return parseBypassRule(item)
              .map((e) => {
                return generateConditionCode(e)
              })
              .join('\n')
          }
          const code = generateConditionCode(parseBypassRule(item))
          return code
        })
        .join('\n') + '\n'

    if (Object.prototype.hasOwnProperty.call(config.rules, 'singleProxy')) {
      if (config.rules.singleProxy.scheme == 'direct') {
        proxyStr = proxyStr + `  return "direct";`
      } else {
        scheme = config.rules.singleProxy.scheme
        host = config.rules.singleProxy.host
        port = config.rules.singleProxy.port
        if (port == null) port = CONST_DEFAULT_PORT[scheme]
        proxyStr = proxyStr + `  return "${scheme} ${host}:${port}";`
      }
    } else {
      proxyStr = proxyStr + '  switch (scheme) {\n'
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
    proxyStr = `  return "direct";`
  }

  let tmpl = `"+${name}": function(url, host, scheme) {
    "use strict";
${proxyStr}
  }, `
  return tmpl
}

const generateConditionCode = function (item) {
  let code = ''
  switch (item.mode) {
    case 'invalid':
      return ''
    case 'ip':
      if (item.rule.ipv4) {
        code = 'host[host.length - 1] >= 0 && '
      } else {
        code = 'host.indexOf(":") >= 0 && '
      }
      return `    if (${code}isInNet(host, "${item.rule.subnet}", "${item.rule.mask}")) return "${item.proxy}";`
    case 'url':
      return `    if (${code}(${item.rule.regex}).test(url)) return "${item.proxy}";`
    case 'host':
      return `    if (${code}(${item.rule.regex}).test(host)) return "${item.proxy}";`
    case 'plain':
      return `    if (isPlainHostName(host)) return "${item.proxy}";`
  }
}
