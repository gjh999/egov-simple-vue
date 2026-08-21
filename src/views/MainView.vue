<script setup lang="ts">
import { mainApi } from '../api/schedule'
import { useAsync } from '../composables/useAsync'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from '../components/AppFeedback.vue'
import { GALLERY_BBS_ID, NOTICE_BBS_ID } from '../constants'
import type { BoardListItem } from '../api/types'

const { t } = useI18n()
const { data, loading, error, reload } = useAsync(() => mainApi.summary())

function summaryOf(items: BoardListItem[] | undefined): BoardListItem[] {
  return (items ?? []).slice(0, 5)
}
</script>

<template>
  <AppFeedback v-if="loading" state="loading" />
  <AppFeedback v-else-if="error" state="error" :message="error" retryable @retry="reload" />

  <template v-else>
    <h1 class="h3 mb-4">{{ t('main.title', '전자정부표준프레임워크 심플 홈페이지') }}</h1>

    <div class="row g-4">
      <div v-for="card in [
             { title: t('nav.notice', '공지사항'), bbsId: NOTICE_BBS_ID, items: summaryOf(data?.notiList) },
             { title: t('nav.gallery', '갤러리'), bbsId: GALLERY_BBS_ID, items: summaryOf(data?.galleryList) },
           ]"
           :key="card.bbsId"
           class="col-12 col-lg-6">
        <section class="krds-panel h-100">
          <div class="krds-panel-head d-flex align-items-center justify-content-between">
            <h2 class="h5 mb-0">{{ card.title }}</h2>
            <RouterLink :to="`/board/${card.bbsId}`" class="krds-btn tertiary small">
              {{ t('com.more', '더보기') }}
            </RouterLink>
          </div>
          <div class="krds-panel-body">
            <AppFeedback v-if="card.items.length === 0" state="empty" />
            <ul v-else class="list-unstyled mb-0">
              <li
                v-for="item in card.items"
                :key="`${item.bbsId}-${item.nttId}`"
                class="d-flex justify-content-between gap-3 py-2 border-bottom"
              >
                <RouterLink :to="`/board/${item.bbsId}/${item.nttId}`" class="text-truncate">
                  {{ item.nttSj }}
                </RouterLink>
                <span class="small text-muted flex-shrink-0">{{ item.frstRegisterPnttm }}</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  </template>
</template>
