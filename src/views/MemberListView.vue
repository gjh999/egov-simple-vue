<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { memberApi } from '../api/member'
import { useAsync } from '../composables/useAsync'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from '../components/AppFeedback.vue'
import AppPagination from '../components/AppPagination.vue'

/** 회원 관리 (ROLE_ADMIN 전용) */
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const pageIndex = computed(() => Number(route.query.page ?? '1'))
const searchCondition = computed(() => String(route.query.cnd ?? '0'))
const searchKeyword = computed(() => String(route.query.wrd ?? ''))

const condition = ref(searchCondition.value)
const keyword = ref(searchKeyword.value)

watch([searchCondition, searchKeyword], ([cnd, wrd]) => {
  condition.value = cnd
  keyword.value = wrd
})

const { data, loading, error, reload } = useAsync(
  () =>
    memberApi.list({
      pageIndex: pageIndex.value,
      searchCondition: searchCondition.value,
      searchKeyword: searchKeyword.value,
    }),
  [pageIndex, searchCondition, searchKeyword],
)

const members = computed(() => data.value?.resultList ?? [])

function handleSearch() {
  void router.push({ query: { page: '1', cnd: condition.value, wrd: keyword.value } })
}

function goPage(pageNo: number) {
  void router.push({
    query: { page: String(pageNo), cnd: searchCondition.value, wrd: searchKeyword.value },
  })
}
</script>

<template>
  <h1 class="h3 mb-3">{{ t('nav.member', '회원관리') }}</h1>

  <form class="d-flex gap-2 mb-3" role="search" @submit.prevent="handleSearch">
    <label class="visually-hidden" for="member-condition">{{ t('member.searchCondition', '검색 조건') }}</label>
    <select id="member-condition" v-model="condition" class="krds-form-select">
      <option value="0">{{ t('mypage.name', '이름') }}</option>
      <option value="1">{{ t('login.id', '아이디') }}</option>
    </select>

    <label class="visually-hidden" for="member-keyword">{{ t('bbs.searchKeyword', '검색어') }}</label>
    <input
      id="member-keyword"
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
    <AppFeedback v-if="members.length === 0" state="empty" />
    <div v-else class="krds-table-wrap">
      <table class="tbl">
        <caption>{{ t('member.listCaption', '회원 목록 — 아이디, 이름, 이메일, 상태') }}</caption>
        <colgroup>
          <col style="width: 20%" />
          <col style="width: 20%" />
          <col />
          <col style="width: 15%" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{{ t('login.id', '아이디') }}</th>
            <th scope="col">{{ t('mypage.name', '이름') }}</th>
            <th scope="col">{{ t('mypage.email', '이메일') }}</th>
            <th scope="col">{{ t('member.status', '상태') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in members" :key="member.uniqId">
            <td>{{ member.mberId ?? member.emplyrId ?? '-' }}</td>
            <td>{{ member.mberNm ?? member.userNm ?? '-' }}</td>
            <td class="text-start">{{ member.emailAdres ?? '-' }}</td>
            <td>{{ member.mberSttus ?? member.emplyrSttusCode ?? '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination :info="data?.paginationInfo" @change="goPage" />
  </template>
</template>
