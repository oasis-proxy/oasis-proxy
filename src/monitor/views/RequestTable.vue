<script setup>
import Browser from '@/Browser/main'
import { computed } from 'vue'

const props = defineProps({
  tableList: Array,
  contentFilter: String,
  tabIdFilter: String
})
const title = [
  { name: '', show: true, width: '20px' },
  { name: Browser.I18n.getMessage('th_col_id'), show: true, width: '40px' },
  { name: Browser.I18n.getMessage('th_col_date'), show: true, width: '80px' },
  {
    name: Browser.I18n.getMessage('th_col_isCache'),
    show: true,
    width: '40px'
  },
  {
    name: Browser.I18n.getMessage('th_col_policy'),
    show: true,
    width: '160px'
  },
  { name: Browser.I18n.getMessage('th_col_rule'), show: true, width: '180px' },
  { name: Browser.I18n.getMessage('th_col_ip'), show: true, width: '120px' },
  {
    name: Browser.I18n.getMessage('th_col_duration'),
    show: true,
    width: '50px'
  },
  { name: Browser.I18n.getMessage('th_col_url'), show: true, width: 'auto' }
]

function tableFilter(item) {
  return (
    (props.tabIdFilter == '' || item.tabId == props.tabIdFilter) &&
    (item.url.indexOf(props.contentFilter) > -1 ||
      item.policy.indexOf(props.contentFilter) > -1 ||
      item.rule.indexOf(props.contentFilter) > -1)
  )
}
const list = computed(() => {
  return props.tableList.filter(tableFilter)
})
</script>
<template>
  <div>
    <table class="table table-sm table-striped">
      <thead class="table-primary text-nowrap">
        <tr>
          <th
            v-for="(item, index) in title"
            :key="index"
            :style="{ width: item.width }"
          >
            {{ item.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in list" class="text-nowrap" :key="index">
          <td style="width: 20px" class="text-end">
            <i
              class="bi bi-check-circle-fill text-success"
              v-if="item.status == 'complete'"
            ></i>
            <i
              class="bi bi-x-circle-fill text-danger"
              v-else-if="item.status == 'error'"
            ></i>
            <i class="bi bi-clock-fill text-info" v-else></i>
          </td>
          <td class="truncate-text cursor-point" style="width: 40px">
            {{ index }}
          </td>
          <td class="truncate-text cursor-point" style="width: 80px">
            {{ item.date }}
          </td>
          <td class="truncate-text cursor-point" style="width: 40px">
            {{
              item.fromCache
                ? Browser.I18n.getMessage('desc_yes')
                : Browser.I18n.getMessage('desc_no')
            }}
          </td>
          <td class="truncate-text cursor-point" style="width: 140px">
            {{ item.policy }}
          </td>
          <td class="truncate-text cursor-point" style="width: 160px">
            {{ item.rule }}
          </td>
          <td class="truncate-text cursor-point" style="width: 120px">
            {{ item.ip }}
          </td>
          <td class="truncate-text" style="width: 50px">
            {{ item.duration }}
          </td>
          <td
            scope="col"
            style="width: auto"
            class="truncate-text cursor-point"
            @click="$emit('copyToClipboard', item.url)"
          >
            {{ item.url }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<style scoped>
table {
  width: 100%;
  table-layout: fixed;
}
thead {
  position: sticky;
  top: 0;
  z-index: 1;
}
th td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
