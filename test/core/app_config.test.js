import { expect, test, describe, vi } from 'vitest'
import { __private__ } from '../../src/core/app_config.js'
import testCase_appConfig from './case/app_config.json'

vi.mock('@/Browser/main', () => {
  const Storage = () => ''
  return {
    default: { I18n: { Storage: Storage } }
  }
})

describe('rules_parser utils', () => {
  testCase_appConfig.forEach((t) => {
    test(t.test, () => {
      expect(__private__.transformReject(t.test)).toEqual(t.result)
    })
  })
})
