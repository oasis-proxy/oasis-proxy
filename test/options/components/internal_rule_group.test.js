// @vitest-environment jsdom
import { describe, test, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import InternalRuleGroup from '../../../src/options/components/InternalRuleGroup.vue'
import testCase_ipRule from './case/ip_rule.json'
import testCase_domainRule from './case/domain_rule.json'
import testCase_regexRule from './case/regex_rule.json'

vi.mock('@/components/ProxySelect.vue', () => {
  return {
    default: { template: '<div></div>' }
  }
})

vi.mock('@/Browser/main', () => {
  const getMessage = () => ''
  return {
    default: { I18n: { getMessage: getMessage } }
  }
})

describe('IP Test', () => {
  testCase_ipRule.forEach((e) => {
    test(e.test.value, async () => {
      const wrapper = mount(InternalRuleGroup, {
        props: {
          modelValue: {
            data: '',
            mode: 'domain',
            proxy: 'direct',
            valid: true
          },
          'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e })
        }
      })

      await wrapper.findAll('select')[0].setValue(e.test.mode)
      await wrapper.findAll('input')[1].setValue(e.test.value)
      await wrapper.findAll('input')[1].trigger('blur')

      expect(wrapper.vm.dataClassName).toEqual(e.result)
    })
  })
})

describe('Domain Test', () => {
  testCase_domainRule.forEach((e) => {
    test(e.test.value, async () => {
      const wrapper = mount(InternalRuleGroup, {
        props: {
          modelValue: {
            data: '',
            mode: 'domain',
            proxy: 'direct',
            valid: true
          },
          'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e })
        }
      })

      await wrapper.findAll('select')[0].setValue(e.test.mode)
      await wrapper.findAll('input')[1].setValue(e.test.value)
      await wrapper.findAll('input')[1].trigger('blur')

      expect(wrapper.vm.dataClassName).toEqual(e.result)
    })
  })
})

describe('Regex Test', () => {
  testCase_regexRule.forEach((e) => {
    test(e.test.value, async () => {
      const wrapper = mount(InternalRuleGroup, {
        props: {
          modelValue: {
            data: '',
            mode: 'domain',
            proxy: 'direct',
            valid: true
          },
          'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e })
        }
      })

      await wrapper.findAll('select')[0].setValue(e.test.mode)
      await wrapper.findAll('input')[1].setValue(e.test.value)
      await wrapper.findAll('input')[1].trigger('blur')

      expect(wrapper.vm.dataClassName).toEqual(e.result)
    })
  })
})
