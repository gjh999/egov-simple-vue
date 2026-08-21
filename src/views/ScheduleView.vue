<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { scheduleApi } from '../api/schedule'
import { ApiError } from '../api/client'
import { useAsync } from '../composables/useAsync'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from '../components/AppFeedback.vue'
import type { Schedule } from '../api/types'

const { t } = useI18n()
const router = useRouter()
const today = new Date()

const year = ref(today.getFullYear())
// 서버의 month 는 0-based 다(Calendar 규약). Date#getMonth() 와 같은 기준이라 그대로 쓴다.
const month = ref(today.getMonth())
const actionError = ref<string | null>(null)

const { data, loading, error, reload } = useAsync(
  () => scheduleApi.month({ year: year.value, month: month.value }),
  [year, month],
)

const schedules = computed(() => (data.value?.resultList ?? []) as Schedule[])

function moveMonth(delta: number) {
  const next = new Date(year.value, month.value + delta, 1)
  year.value = next.getFullYear()
  month.value = next.getMonth()
}

function goToday() {
  const now = new Date()
  year.value = now.getFullYear()
  month.value = now.getMonth()
}

/** yyyyMMddHHmm → yyyy-MM-dd HH:mm (서버가 붙여 보내는 원시 형식을 사람이 읽게 바꾼다) */
function formatDateTime(raw: string | undefined): string {
  if (!raw || raw.length < 8) return raw ?? ''
  const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  if (raw.length < 12) return date
  return `${date} ${raw.slice(8, 10)}:${raw.slice(10, 12)}`
}

function codeName(code: string): string {
  return data.value?.schdulSe?.find((item) => item.code === code)?.codeNm ?? code
}

async function handleDelete(schdulId: string) {
  if (!window.confirm(t('schedule.confirmDelete', '이 일정을 삭제하시겠습니까?'))) return
  actionError.value = null
  try {
    await scheduleApi.remove(schdulId)
    reload()
  } catch (e) {
    actionError.value = e instanceof ApiError ? e.message : t('com.deleteFail', '삭제하지 못했습니다.')
  }
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h1 class="h3 mb-0">{{ t('nav.schedule', '일정관리') }}</h1>
    <RouterLink to="/schedule/write" class="krds-btn primary">
      <i class="bi bi-plus-lg" aria-hidden="true" /> {{ t('schedule.write', '일정 등록') }}
    </RouterLink>
  </div>

  <AppFeedback v-if="actionError" state="error" :message="actionError" />

  <div class="d-flex align-items-center gap-2 mb-3">
    <button type="button" class="krds-btn tertiary small" @click="moveMonth(-1)">
      <i class="bi bi-chevron-left" aria-hidden="true" /> {{ t('schedule.prevMonth', '이전 달') }}
    </button>
    <strong aria-live="polite">{{ year }}. {{ String(month + 1).padStart(2, '0') }}</strong>
    <button type="button" class="krds-btn tertiary small" @click="moveMonth(1)">
      {{ t('schedule.nextMonth', '다음 달') }} <i class="bi bi-chevron-right" aria-hidden="true" />
    </button>
    <button type="button" class="krds-btn secondary small ms-2" @click="goToday">
      {{ t('schedule.today', '오늘') }}
    </button>
  </div>

  <AppFeedback v-if="loading" state="loading" />
  <AppFeedback v-else-if="error" state="error" :message="error" retryable @retry="reload" />

  <template v-else>
    <AppFeedback v-if="schedules.length === 0" state="empty">
      {{ t('schedule.empty', '해당 월에 등록된 일정이 없습니다.') }}
    </AppFeedback>

    <div v-else class="krds-table-wrap">
      <table class="tbl">
        <caption>{{ t('schedule.listCaption', '월별 일정 목록 — 일정명, 구분, 시작, 종료, 장소') }}</caption>
        <colgroup>
          <col />
          <col style="width: 10%" />
          <col style="width: 16%" />
          <col style="width: 16%" />
          <col style="width: 14%" />
          <col style="width: 14%" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{{ t('schedule.name', '일정명') }}</th>
            <th scope="col">{{ t('schedule.type', '구분') }}</th>
            <th scope="col">{{ t('schedule.begin', '시작') }}</th>
            <th scope="col">{{ t('schedule.end', '종료') }}</th>
            <th scope="col">{{ t('schedule.place', '장소') }}</th>
            <th scope="col">{{ t('com.manage', '관리') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in schedules" :key="item.schdulId">
            <td class="text-start">{{ item.schdulNm }}</td>
            <td>{{ codeName(item.schdulSe) }}</td>
            <td>{{ formatDateTime(item.schdulBgnde) }}</td>
            <td>{{ formatDateTime(item.schdulEndde) }}</td>
            <td>{{ item.schdulPlace ?? '-' }}</td>
            <td>
              <div class="d-flex gap-1 justify-content-center">
                <button
                  type="button"
                  class="krds-btn secondary small"
                  @click="router.push(`/schedule/${item.schdulId}/edit`)"
                >
                  {{ t('com.edit', '수정') }}
                </button>
                <button type="button" class="krds-btn danger small" @click="handleDelete(item.schdulId)">
                  {{ t('com.delete', '삭제') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>
