<script setup>
import { ref, inject, getCurrentInstance, watch } from 'vue'
import { useRoute } from 'vue-router'
import draggable from 'vuedraggable'
import BatchUpdateServerModal from './BatchUpdateServerModal.vue'
import PopoverTips from '@/components/PopoverTips.vue'
import LinkTextItem from '../../components/LinkTextItem.vue'
import ProxySelect from '@/components/ProxySelect.vue'
import RuleItem from '../../components/InternalRuleGroup.vue'

import Browser from '@/Browser/main'
import { useConfigStore } from '@/options/stores/config'
import { useStatusStore } from '@/options/stores/status'
import { updateRulesSetData } from '@/core/proxy_config.js'

const route = useRoute()
const storeStatus = useStatusStore()
const storeConfig = useConfigStore()
const batchUpdateServerModal = ref(null)
const instance = getCurrentInstance()
const toast = instance?.appContext.config.globalProperties.$toast

const { siteRuleList, siteRulesSet } = inject('autoConfig')
const { siteRuleChanged } = inject('status')
const emit = defineEmits(['load'])

const focusText = ref('')
const urlValid = ref(true)
const ruleItemTmpl = {
  mode: 'domain',
  data: '',
  proxy: 'direct',
  valid: true
}

const occurrences = ref([])

watch(
  () => siteRuleList,
  (newValue) => {
    const countOccurrences = (array) => {
      return array.reduce((accumulator, currentValue) => {
        accumulator[currentValue.data] =
          (accumulator[currentValue.data] || 0) + 1
        return accumulator
      }, {})
    }
    occurrences.value = countOccurrences(newValue.value)
  },
  { deep: true }
)

function setFocusText(text) {
  focusText.value = text
}

function insertDivider(index) {
  const tmp = {
    mode: 'divider',
    data: Browser.I18n.getMessage('input_label_divider'),
    proxy: 'direct'
  }
  siteRuleList.value.splice(index + 1, 0, tmp)
  storeStatus.setUnsaved()
}

function insertRule(index = -1) {
  const tmp = JSON.parse(JSON.stringify(ruleItemTmpl))
  siteRuleList.value.splice(index + 1, 0, tmp)
  storeStatus.setUnsaved()
}

function removeRule(index) {
  siteRuleList.value.splice(index, 1)
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
  const updateProxyConfig = await updateRulesSetData(allConfig[key], {
    subjectList: ['site']
  })
  if (JSON.stringify(updateProxyConfig) != '{}') {
    await Browser.Storage.setLocal({ [key]: updateProxyConfig })
    if (storeStatus.activeProxyKey == key) {
      await Browser.Proxy.reloadOrDirect(() => {
        toast.info(Browser.I18n.getMessage('desc_proxy_update'))
      }, true)
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
  siteRuleChanged.value = true
  storeStatus.setUnsaved()
}
</script>
<template>
  <div class="card">
    <div class="card-header">
      <span class="fw-bold"
        >{{ Browser.I18n.getMessage('section_label_site') }}
      </span>
      <PopoverTips
        class-name="bi bi-plus-circle-fill icon-btn ms-2"
        :content="Browser.I18n.getMessage('iconbtn_add_rule')"
        :hint="storeConfig.configIconBtnHint"
        @click="insertRule()"
      ></PopoverTips>
      <PopoverTips
        class-name="bi bi-ui-checks icon-btn ms-2"
        :content="Browser.I18n.getMessage('iconbtn_batch_update_server')"
        :hint="storeConfig.configIconBtnHint"
        @click="openBatchUpdateServerDialog"
      ></PopoverTips>
    </div>
    <div class="card-body">
      <div id="siteRuleList">
        <draggable
          :list="siteRuleList"
          :group="'shared'"
          @end="setUnsaved"
          handle=".drag-handle"
          item-key="index"
        >
          <template #item="{ element, index }">
            <RuleItem
              :key="index"
              v-model="siteRuleList[index]"
              :class="inputClassName(element)"
              @getFocusText="setFocusText(element.data)"
              @clearFousText="setFocusText(null)"
            >
              <template #operation>
                <PopoverTips
                  class-name="bi bi-layer-backward icon-btn me-2 mt-1"
                  :content="Browser.I18n.getMessage('iconbtn_insert_below')"
                  :hint="storeConfig.configIconBtnHint"
                  @click="insertRule(index)"
                ></PopoverTips>
                <PopoverTips
                  class-name="bi bi-inboxes-fill icon-btn me-2 mt-1"
                  :content="Browser.I18n.getMessage('iconbtn_divider_rule')"
                  :hint="storeConfig.configIconBtnHint"
                  @click="insertDivider(index)"
                ></PopoverTips
              ></template>
              <template #delete>
                <PopoverTips
                  class-name="bi bi-trash-fill icon-btn mt-1"
                  :content="Browser.I18n.getMessage('iconbtn_delete_rule')"
                  :hint="storeConfig.configIconBtnHint"
                  @click="removeRule(index)"
                ></PopoverTips
              ></template>
            </RuleItem>
          </template>
        </draggable>
        <div v-show="siteRuleList.length == 0" class="text-center text-muted">
          {{ Browser.I18n.getMessage('desc_list_empty') }}
        </div>
      </div>
      <!-- <div>
        <div class="hstack gap-2 mb-2">
          <span class="ms-auto">{{
            Browser.I18n.getMessage('desc_external_rules')
          }}</span>
          <div>
            <ProxySelect
              style="width: 150px"
              v-model="siteRulesSet.proxy"
            ></ProxySelect>
          </div>
          <i class="bi bi-trash-fill icon-btn" style="visibility: hidden"></i>
          <i class="bi bi-trash-fill icon-btn" style="visibility: hidden"></i>
          <i class="bi bi-trash-fill icon-btn" style="visibility: hidden"></i>
        </div>
      </div> -->
    </div>
  </div>
  <!-- <div class="card">
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
        :urlUpdatedAtTitle="Browser.I18n.getMessage('form_label_rule_update')"
        :validTitle="Browser.I18n.getMessage('form_label_rule_valid')"
        :dataTitle="Browser.I18n.getMessage('form_label_rule_data')"
        @updateRulesSetData="handleUpdateUrl('site')"
        v-model:rulesSet="siteRulesSet"
        v-model:isUrlValid="urlValid"
      ></LinkTextItem>
    </div>
  </div> -->
  <BatchUpdateServerModal ref="batchUpdateServerModal"></BatchUpdateServerModal>
</template>
