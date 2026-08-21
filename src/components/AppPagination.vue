<script setup lang="ts">
import { computed } from 'vue'
import type { PaginationInfo } from '../api/types'
import { useI18n } from '../i18n/useI18n'

const props = defineProps<{ info: PaginationInfo | null | undefined }>()
const emit = defineEmits<{ change: [pageNo: number] }>()

const { t } = useI18n()

/**
 * 페이지 범위는 서버가 정해 준다(firstPageNoOnPageList~lastPageNoOnPageList).
 * 클라이언트에서 다시 계산하지 않는다 — 두 곳에서 계산하면 반드시 어긋난다.
 */
const pages = computed(() => {
  if (!props.info) return []
  const list: number[] = []
  for (let no = props.info.firstPageNoOnPageList; no <= props.info.lastPageNoOnPageList; no += 1) {
    list.push(no)
  }
  return list
})

const current = computed(() => props.info?.currentPageNo ?? 1)
const hasPrev = computed(() => current.value > 1)
const hasNext = computed(() => current.value < (props.info?.totalPageCount ?? 1))
</script>

<template>
  <nav
    v-if="info && info.totalPageCount > 1"
    :aria-label="t('com.pagination', '페이지 목록')"
    class="d-flex justify-content-center mt-4"
  >
    <ul class="pagination mb-0">
      <li class="page-item" :class="{ disabled: !hasPrev }">
        <button
          type="button"
          class="page-link"
          :disabled="!hasPrev"
          :aria-label="t('com.prevPage', '이전 페이지')"
          @click="emit('change', current - 1)"
        >
          <i class="bi bi-chevron-left" aria-hidden="true" />
        </button>
      </li>

      <li v-for="pageNo in pages" :key="pageNo" class="page-item" :class="{ active: pageNo === current }">
        <button
          type="button"
          class="page-link"
          :aria-current="pageNo === current ? 'page' : undefined"
          @click="emit('change', pageNo)"
        >
          {{ pageNo }}
        </button>
      </li>

      <li class="page-item" :class="{ disabled: !hasNext }">
        <button
          type="button"
          class="page-link"
          :disabled="!hasNext"
          :aria-label="t('com.nextPage', '다음 페이지')"
          @click="emit('change', current + 1)"
        >
          <i class="bi bi-chevron-right" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </nav>
</template>
