<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { boardApi } from '../api/board'
import { useAsync } from '../composables/useAsync'
import { useAuth } from '../auth/useAuth'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from '../components/AppFeedback.vue'
import AppPagination from '../components/AppPagination.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { isAuthenticated } = useAuth()

const bbsId = computed(() => String(route.params.bbsId ?? ''))
const pageIndex = computed(() => Number(route.query.page ?? '1'))
const searchCnd = computed(() => String(route.query.cnd ?? '0'))
const searchWrd = computed(() => String(route.query.wrd ?? ''))

const condition = ref(searchCnd.value)
const keyword = ref(searchWrd.value)

// 뒤로가기 등으로 URL 이 바뀌면 검색 입력도 맞춰 준다
watch([searchCnd, searchWrd], ([cnd, wrd]) => {
  condition.value = cnd
  keyword.value = wrd
})

const { data, loading, error, reload } = useAsync(
  () =>
    boardApi.list({
      bbsId: bbsId.value,
      pageIndex: pageIndex.value,
      searchCnd: searchCnd.value,
      searchWrd: searchWrd.value,
    }),
  [bbsId, pageIndex, searchCnd, searchWrd],
)

const boardName = computed(() => data.value?.brdMstrVO?.bbsNm ?? t('nav.board', '게시판'))

function handleSearch() {
  // 검색 조건이 바뀌면 항상 1페이지부터 — 3페이지에서 검색했는데 결과가 1페이지뿐이면 빈 화면이 된다
  void router.push({ query: { page: '1', cnd: condition.value, wrd: keyword.value } })
}

function goPage(pageNo: number) {
  void router.push({ query: { page: String(pageNo), cnd: searchCnd.value, wrd: searchWrd.value } })
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h1 class="h3 mb-0">{{ boardName }}</h1>
    <RouterLink v-if="isAuthenticated" :to="`/board/${bbsId}/write`" class="krds-btn primary">
      <i class="bi bi-pencil" aria-hidden="true" /> {{ t('bbs.write', '글쓰기') }}
    </RouterLink>
  </div>

  <form class="d-flex gap-2 mb-3" role="search" @submit.prevent="handleSearch">
    <label class="visually-hidden" for="search-condition">{{ t('bbs.searchCondition', '검색 조건') }}</label>
    <select id="search-condition" v-model="condition" class="krds-form-select">
      <option value="0">{{ t('bbs.subject', '제목') }}</option>
      <option value="1">{{ t('bbs.content', '내용') }}</option>
      <option value="2">{{ t('bbs.writer', '작성자') }}</option>
    </select>

    <label class="visually-hidden" for="search-keyword">{{ t('bbs.searchKeyword', '검색어') }}</label>
    <input
      id="search-keyword"
      v-model="keyword"
      class="krds-input"
      type="search"
      :placeholder="t('bbs.searchPlaceholder', '검색어를 입력하세요')"
    />

    <button type="submit" class="krds-btn secondary flex-shrink-0">{{ t('com.search', '검색') }}</button>
  </form>

  <AppFeedback v-if="loading" state="loading" />
  <AppFeedback v-else-if="error" state="error" :message="error" retryable @retry="reload" />

  <template v-else>
    <AppFeedback v-if="(data?.resultList?.length ?? 0) === 0" state="empty" />
    <div v-else class="krds-table-wrap">
      <table class="tbl">
        <caption>{{ t('bbs.listCaption', '게시물 목록 — 번호, 제목, 작성자, 등록일, 조회수') }}</caption>
        <colgroup>
          <col style="width: 8%" />
          <col />
          <col style="width: 15%" />
          <col style="width: 15%" />
          <col style="width: 10%" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{{ t('bbs.no', '번호') }}</th>
            <th scope="col">{{ t('bbs.subject', '제목') }}</th>
            <th scope="col">{{ t('bbs.writer', '작성자') }}</th>
            <th scope="col">{{ t('bbs.date', '등록일') }}</th>
            <th scope="col">{{ t('bbs.hit', '조회') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data?.resultList" :key="item.nttId">
            <td>{{ item.nttId }}</td>
            <td class="text-start">
              <!-- 답변 글은 깊이만큼 들여쓴다 -->
              <span :style="{ paddingLeft: `${Number(item.replyLc ?? 0) * 1.25}rem` }">
                <i v-if="Number(item.replyLc ?? 0) > 0" class="bi bi-arrow-return-right me-1" aria-hidden="true" />
                <RouterLink :to="`/board/${item.bbsId}/${item.nttId}`">{{ item.nttSj }}</RouterLink>
              </span>
            </td>
            <td>{{ item.frstRegisterNm }}</td>
            <td>{{ item.frstRegisterPnttm }}</td>
            <td>{{ item.inqireCo }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination :info="data?.paginationInfo" @change="goPage" />
  </template>
</template>
