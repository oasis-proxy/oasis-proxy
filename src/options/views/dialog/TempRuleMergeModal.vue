<script setup>
import { ref, onMounted, defineModel, watch } from 'vue'
import RuleItem from '../../components/InternalRuleGroup.vue'
import ModalBase from '@/components/modal/ModalBase.vue'
import Browser from '@/Browser/main'

const emit = defineEmits(['submit'])

const ruleList = defineModel()
const mergeRule = ref([])

let basicConfigModalInstance = null
onMounted(() => {
  const modalElement = document.getElementById('basicConfigModal')
  basicConfigModalInstance = new bootstrap.Modal(modalElement)
})

defineExpose({
  show,
  hide
})

watch(
  ruleList,
  (newValue) => {
    mergeRule.value = []
    const filterRes = Array.from(
      new Map(newValue.map((item) => [item['suffix'], item])).values()
    )
    for (const item of filterRes) {
      const tmpObj = JSON.parse(JSON.stringify(item))
      tmpObj.data = item.suffix
      mergeRule.value.push(tmpObj)
    }
  },
  { deep: true }
)

function hide() {
  basicConfigModalInstance.hide()
  setTimeout(() => {
    mergeRule.value = []
  }, 300)
}
function show() {
  basicConfigModalInstance.show()
}

function handleCancel() {
  hide()
}

function handleSubmit() {
  // submit is async function in parent component,
  // using deep clone to avoid mergeRule being changed in hide()
  emit('submit', JSON.parse(JSON.stringify(mergeRule.value)))
  hide()
}
</script>
<template>
  <ModalBase id="basicConfigModal" mode="large">
    <template #title>{{
      Browser.I18n.getMessage('modal_title_merge_temprules')
    }}</template>
    <template #default>
      <div class="mb-3">
        <div v-for="(element, index) in ruleList" :key="index">
          <RuleItem
            :key="index"
            :is-draggable="false"
            :is-validable="false"
            readonly
            v-model="ruleList[index]"
          />
        </div>
      </div>
      <div class="hstack gap-4 mb-2 d-flex align-items-center">
        <hr class="w-100" />
        <span style="white-space: nowrap">
          {{ Browser.I18n.getMessage('form_label_merge') }}</span
        >
        <hr class="w-100" />
      </div>
      <div class="mb-3" v-for="(element, index) in mergeRule" :key="index">
        <RuleItem
          :is-draggable="false"
          :is-validable="false"
          v-model="mergeRule[index]"
        />
      </div>
    </template>
    <template #operations>
      <button class="btn btn-sm btn-secondary ms-auto" @click="handleCancel">
        <i class="bi bi-x-circle-fill me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_close') }}</span>
      </button>
      <button class="btn btn-sm btn-primary" @click="handleSubmit">
        <i class="bi bi-check-circle-fill me-2"></i>
        <span>{{ Browser.I18n.getMessage('btn_label_merge') }}</span>
      </button>
    </template>
  </ModalBase>
</template>
