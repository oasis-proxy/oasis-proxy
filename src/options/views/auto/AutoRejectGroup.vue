<script setup>
import { ref, inject, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import draggable from 'vuedraggable'
import PopoverTips from '@/components/PopoverTips.vue'
import LinkTextItem from '../../components/LinkTextItem.vue'
import RuleItem from '../../components/InternalRuleGroup.vue'

import Browser from '@/Browser/main'
import { useStatusStore } from '@/options/stores/status'
import { updateRulesSetData } from '@/core/proxy_config.js'

const route = useRoute()
const storeStatus = useStatusStore()
const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast

const { rejectRuleList, rejectRulesSet, occurrencesReject } =
  inject('autoConfig')
const emit = defineEmits(['load'])

const focusText = ref('')
const urlValid = ref(true)
const ruleItemTmpl = {
  mode: 'domain',
  data: '',
  proxy: '+reject',
  valid: true
}

function setFocusText(text) {
  focusText.value = text
}

function insertDivider(index) {
  const tmp = {
    mode: 'divider',
    data: Browser.I18n.getMessage('input_label_divider'),
    proxy: 'direct'
  }
  rejectRuleList.value.splice(index + 1, 0, tmp)
  storeStatus.setUnsaved()
}

function insertRule(index = -1) {
  const tmp = JSON.parse(JSON.stringify(ruleItemTmpl))
  rejectRuleList.value.splice(index + 1, 0, tmp)
  storeStatus.setUnsaved()
}

function removeRule(index) {
  rejectRuleList.value.splice(index, 1)
  storeStatus.setUnsaved()
}

function inputClassName(item) {
  if (item.data == '') return
  let name = []
  if (occurrencesReject.value[item.data] > 1) {
    name.push('border-warning')
    if (focusText.value == item.data) {
      name.push('background-info')
    }
  }
  return name.join(' ')
}

async function handleUpdateUrl() {
  const key = 'proxy_' + encodeURIComponent(route.params.name)
  const allConfig = await Browser.Storage.getLocalAll()
  const updateProxyConfig = await updateRulesSetData(allConfig[key], ['reject'])
  if (JSON.stringify(updateProxyConfig) != '{}') {
    await Browser.Storage.setLocal({ [key]: updateProxyConfig })
    if (allConfig.status_proxyKey == key) {
      Browser.Proxy.set(allConfig, key, async () => {
        toast.info(Browser.I18n.getMessage('desc_proxy_update'))
      })
    }
    emit('load', key)
  } else {
    urlValid.value = false
  }
}

function setUnsaved() {
  storeStatus.setUnsaved()
}
</script>
<template>
  <div class="card">
    <div class="card-header">
      <span class="fw-bold">{{
        Browser.I18n.getMessage('section_label_reject')
      }}</span>
      <i class="bi bi-plus-circle-fill icon-btn ms-2" @click="insertRule()"></i>
    </div>
    <div class="card-body">
      <div id="rejectRuleList">
        <draggable
          :list="rejectRuleList"
          :group="'shared'"
          @end="setUnsaved"
          handle=".drag-handle"
          item-key="index"
        >
          <template #item="{ element, index }">
            <RuleItem
              :key="index"
              v-model="rejectRuleList[index]"
              :class="inputClassName(element)"
              @getFocusText="setFocusText(element.data)"
              @clearFousText="setFocusText(null)"
              @deleteItem="removeRule(index)"
              @addItem="insertRule(index)"
              @hrItem="insertDivider(index)"
            ></RuleItem>
          </template>
        </draggable>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-header">
      <span class="fw-bold">{{
        Browser.I18n.getMessage('section_label_reject_set')
      }}</span>
      <PopoverTips
        className="bi bi-question-circle-fill icon-btn ms-2"
        :content="Browser.I18n.getMessage('popover_external_rules_format')"
      ></PopoverTips>
    </div>
    <div class="card-body">
      <LinkTextItem
        :urlTitle="Browser.I18n.getMessage('form_label_rule_url')"
        :urlUpdatedAtTitle="Browser.I18n.getMessage('form_label_update_date')"
        :validTitle="Browser.I18n.getMessage('form_label_rule_valid')"
        :dataTitle="Browser.I18n.getMessage('form_label_rule_data')"
        @updateRulesSetData="handleUpdateUrl('reject')"
        v-model:rulesSet="rejectRulesSet"
        v-model:isUrlValid="urlValid"
      ></LinkTextItem>
    </div>
  </div>
</template>
