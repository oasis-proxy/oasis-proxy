<script setup>
import Browser from '@/Browser/main'
import { onMounted, ref } from 'vue'
import PopoverTips from '@/components/PopoverTips.vue'

const props = defineProps({
  list: Array
})

const iptags = ref({})

const title = [
  { name: ' ', show: true, width: '20px' },
  {
    name: Browser.I18n.getMessage('th_col_id'),
    show: true,
    width: '60px'
  },
  {
    name: Browser.I18n.getMessage('th_col_date'),
    show: true,
    width: '90px'
  },
  {
    name: Browser.I18n.getMessage('th_col_policy'),
    show: true,
    width: '170px'
  },
  {
    name: Browser.I18n.getMessage('th_col_rule'),
    show: true,
    width: '180px',
    clickable: true
  },
  {
    name: Browser.I18n.getMessage('th_col_ip'),
    show: true,
    width: '160px',
    clickable: true
  },
  {
    name: Browser.I18n.getMessage('th_col_duration'),
    show: true,
    width: '80px'
  },
  {
    name: Browser.I18n.getMessage('th_col_url'),
    show: true,
    width: 'calc(100% - 760px)',
    clickable: true
  }
]

onMounted(async () => {
  loadIptags()
})

async function loadIptags() {
  const res = await Browser.Storage.getLocal('config_iptags')
  if (res.config_iptags != null) {
    iptags.value = res.config_iptags
  }
}
</script>
<template>
  <div>
    <table class="table table-sm table-striped">
      <thead class="table-primary text-nowrap">
        <tr>
          <th
            class="ps-3"
            v-for="(item, index) in title"
            :key="index"
            :style="{ width: item.width }"
          >
            {{ item.name }}
            <PopoverTips
              v-if="item.clickable"
              className="bi bi-copy icon-btn ms-2"
              :content="Browser.I18n.getMessage('popover_copyable')"
            ></PopoverTips>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in props.list"
          class="text-nowrap"
          :key="index"
        >
          <td style="width: 20px" class="ps-2">
            <i
              class="bi bi-check-circle-fill text-success"
              v-if="item.status == 'complete'"
            ></i>
            <PopoverTips
              v-else-if="item.status == 'error'"
              className="bi bi-x-circle-fill text-danger icon-btn"
              :content="item.error"
            ></PopoverTips>
            <PopoverTips
              v-else-if="item.status == 'redirect'"
              className="bi bi-r-circle-fill text-info icon-btn"
              :content="Browser.I18n.getMessage('popover_redirect')"
            ></PopoverTips>
            <i class="bi bi-clock-fill text-info" v-else></i>
          </td>
          <td class="truncate-text ps-3" style="width: 60px">
            {{ index }}
          </td>
          <td class="truncate-text ps-3" style="width: 80px">
            {{ item.date }}
          </td>
          <td class="truncate-text ps-3" style="width: 140px">
            {{ item.policy }}
          </td>
          <td
            class="truncate-text cursor-point ps-3"
            style="width: 160px"
            @click="$emit('copyToClipboard', item.rule)"
          >
            {{ item.rule }}
          </td>
          <td
            class="truncate-text cursor-point ps-3"
            style="width: 160px"
            @click="$emit('copyToClipboard', item.ip)"
          >
            <PopoverTips
              v-if="item.fromCache"
              className="bi bi-clock-history icon-btn me-2"
              :content="Browser.I18n.getMessage('popover_fromCache')"
            ></PopoverTips>
            {{ iptags[item.ip] != null ? iptags[item.ip] : item.ip }}
          </td>
          <td class="truncate-text ps-3" style="width: 80px">
            {{ item.duration }}
          </td>
          <td
            scope="col"
            style="width: auto"
            class="truncate-text cursor-point ps-3"
            @click="$emit('copyToClipboard', item.url)"
          >
            {{ item.url }}
          </td>
        </tr>
      </tbody>
      <tbody v-show="props.list.length === 0">
        <tr>
          <td colspan="8" class="text-center text-muted">
            {{ Browser.I18n.getMessage('desc_list_empty') }}
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
