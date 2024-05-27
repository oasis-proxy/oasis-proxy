import { expect, test, describe } from 'vitest'
import { __private__ } from '../../src/core/rules_parser.js'
import testCase_wildcardToRegConst from './case/wildcard_domain.json'
import testCase_getRegConst from './case/regex_domain.json'
import testCase_parseHttpKeywordsForAutoProxy from './case/autoproxy_http_keywords.json'
import testCase_parseUrlForAutoProxy from './case/autoproxy_url.json'
import testCase_parseDomainForAutoProxy from './case/autoproxy_domain.json'
import testCase_parseAutoProxyRule from './case/autoproxy_rule.json'
import testCase_parseHostnameForBypass from './case/bypass_domain.json'
import testCase_parseBypassRule from './case/bypass_rule.json'
import testCase_parseWildcardDomain from './case/internal_domain.json'

describe('rules_parser utils', () => {
  testCase_getRegConst.forEach((t) => {
    test(t.test, () => {
      expect(__private__.getRegConst(t.test)).toBe(t.result)
    })
  })

  testCase_wildcardToRegConst.forEach((t) => {
    test(t.test, () => {
      expect(__private__.wildcardToRegConst(t.test)).toBe(t.result)
    })
  })
})

describe('rules_parser AutoProxy Rules', () => {
  testCase_parseHttpKeywordsForAutoProxy.forEach((t) => {
    test(t.test, () => {
      const res = __private__.parseHttpKeywordsForAutoProxy({
        data: t.test,
        proxy: 'testproxy'
      })
      expect({ reg: res.rule.regex, proxy: res.proxy }).toEqual({
        reg: t.result,
        proxy: 'testproxy'
      })
    })
  })

  testCase_parseUrlForAutoProxy.forEach((t) => {
    test(t.test, () => {
      const res = __private__.parseUrlForAutoProxy({
        data: t.test,
        proxy: 'testproxy'
      })
      expect({ reg: res.rule.regex, proxy: res.proxy }).toEqual({
        reg: t.result,
        proxy: 'testproxy'
      })
    })
  })

  testCase_parseDomainForAutoProxy.forEach((t) => {
    test(t.test, () => {
      const res = __private__.parseDomainForAutoProxy({
        data: t.test,
        proxy: 'testproxy'
      })
      expect({ reg: res.rule.regex, proxy: res.proxy }).toEqual({
        reg: t.result,
        proxy: 'testproxy'
      })
    })
  })

  testCase_parseAutoProxyRule.forEach((t) => {
    test(t.test, () => {
      const res = __private__.parseAutoProxyRule({
        data: t.test,
        proxy: 'testproxy'
      })
      expect({ reg: res.rule.regex, proxy: res.proxy }).toEqual({
        reg: t.result,
        proxy: 'testproxy'
      })
    })
  })
})

describe('rules_parser Bypass Rules', () => {
  testCase_parseHostnameForBypass.forEach((t) => {
    test(t.test, () => {
      const res = __private__.parseHostnameForBypass({
        data: t.test,
        proxy: 'testproxy'
      })
      expect({ reg: res.rule.regex, proxy: res.proxy }).toEqual({
        reg: t.result,
        proxy: 'testproxy'
      })
    })
  })

  testCase_parseBypassRule.forEach((t) => {
    test(t.test, () => {
      const res = __private__.parseBypassRule(t.test)
      if (res.mode == 'ip') {
        expect(res).toEqual({
          rule: t.rule,
          mode: 'ip',
          proxy: 'direct',
          orgin: { data: t.test }
        })
      } else {
        expect({ reg: res.rule.regex, proxy: res.proxy }).toEqual({
          reg: t.result,
          proxy: 'direct'
        })
      }
    })
  })
})

describe('rules_parser Internel Rules', () => {
  testCase_parseWildcardDomain.forEach((t) => {
    test(t.test, () => {
      const res = __private__.parseWildcardDomain({
        data: t.test,
        proxy: 'testproxy'
      })
      expect({ reg: res.rule.regex, proxy: res.proxy }).toEqual({
        reg: t.result,
        proxy: 'testproxy'
      })
    })
  })
})
