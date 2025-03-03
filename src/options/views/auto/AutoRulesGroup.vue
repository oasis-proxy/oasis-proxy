<script setup>
import { ref, inject, getCurrentInstance } from 'vue'
import { useRoute } from 'vue-router'
import draggable from 'vuedraggable'
import BatchUpdateServerModal from './BatchUpdateServerModal.vue'
import PopoverTips from '@/components/PopoverTips.vue'
import LinkTextItem from '../../components/LinkTextItem.vue'
import ProxySelect from '@/components/ProxySelect.vue'
import RuleItem from '../../components/InternalRuleGroup.vue'

import Browser from '@/Browser/main'
import { useStatusStore } from '@/options/stores/status'
import { updateRulesSetData } from '@/core/proxy_config.js'

const route = useRoute()
const storeStatus = useStatusStore()
const batchUpdateServerModal = ref(null)
const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast

const { localRuleList, localRulesSet, defaultProxy, occurrences } =
  inject('autoConfig')
const emit = defineEmits(['load'])

const focusText = ref('')
const urlValid = ref(true)
const ruleItemTmpl = {
  mode: 'domain',
  data: '',
  proxy: 'direct',
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
  localRuleList.value.splice(index + 1, 0, tmp)
  storeStatus.setUnsaved()
}

function insertRule(index = -1) {
  const tmp = JSON.parse(JSON.stringify(ruleItemTmpl))
  localRuleList.value.splice(index + 1, 0, tmp)
  storeStatus.setUnsaved()
}

function removeRule(index) {
  localRuleList.value.splice(index, 1)
  storeStatus.setUnsaved()
}

function inputClassName(item) {
  if (item.data == '') return
  let name = []
  if (occurrences.value[item.data] > 1) {
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
  const updateProxyConfig = await updateRulesSetData(allConfig[key], ['local'])
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

async function openBatchUpdateServerDialog() {
  if (batchUpdateServerModal.value) {
    batchUpdateServerModal.value.show()
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
        Browser.I18n.getMessage('section_label_internal')
      }}</span>
      <i class="bi bi-plus-circle-fill icon-btn ms-2" @click="insertRule()"></i>
      <i
        class="bi bi-ui-checks icon-btn ms-2"
        @click="openBatchUpdateServerDialog"
      ></i>
    </div>
    <div class="card-body">
      <div id="localRuleList">
        <draggable
          :list="localRuleList"
          :group="'shared'"
          @end="setUnsaved"
          handle=".drag-handle"
          item-key="index"
        >
          <template #item="{ element, index }">
            <RuleItem
              :key="index"
              v-model="localRuleList[index]"
              :class="inputClassName(element)"
              @getFocusText="setFocusText(element.data)"
              @clearFousText="setFocusText(null)"
              @deleteItem="removeRule(index)"
              @addItem="insertRule(index)"
              @hrItem="insertDivider(index)"
            >
              <ProxySelect
                v-model="element.proxy"
                style="width: 150px"
              ></ProxySelect
            ></RuleItem>
          </template>
        </draggable>
      </div>
      <div>
        <div class="hstack gap-2 mb-2">
          <span class="ms-auto">{{
            Browser.I18n.getMessage('desc_external_rules')
          }}</span>
          <div>
            <ProxySelect
              style="width: 150px"
              v-model="localRulesSet.proxy"
            ></ProxySelect>
          </div>
          <i class="bi bi-trash-fill icon-btn" style="visibility: hidden"></i>
          <i class="bi bi-trash-fill icon-btn" style="visibility: hidden"></i>
          <i class="bi bi-trash-fill icon-btn" style="visibility: hidden"></i>
        </div>
      </div>
      <div>
        <div class="hstack gap-2">
          <span class="ms-auto">{{
            Browser.I18n.getMessage('desc_default')
          }}</span>
          <div>
            <ProxySelect
              style="width: 150px"
              v-model="defaultProxy"
            ></ProxySelect>
          </div>
          <i class="bi bi-trash-fill icon-btn" style="visibility: hidden"></i>
          <i class="bi bi-trash-fill icon-btn" style="visibility: hidden"></i>
          <i class="bi bi-trash-fill icon-btn" style="visibility: hidden"></i>
        </div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-header">
      <span class="fw-bold">{{
        Browser.I18n.getMessage('section_label_external')
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
        @updateRulesSetData="handleUpdateUrl('local')"
        v-model:rulesSet="localRulesSet"
        v-model:isUrlValid="urlValid"
      ></LinkTextItem>
    </div>
  </div>
  <BatchUpdateServerModal ref="batchUpdateServerModal"></BatchUpdateServerModal>
</template>
