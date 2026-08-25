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

/** 조회 단위 — 서버의 /schedule/{month|week|daily} 에 그대로 대응한다. */
type ScheduleView = 'month' | 'week' | 'daily'

const year = ref(today.getFullYear())
// 서버의 month 는 0-based 다(Calendar 규약). Date#getMonth() 와 같은 기준이라 그대로 쓴다.
const month = ref(today.getMonth())
const date = ref(today.getDate())
// 월간 · 주간 · 일간 — 서버가 세 조회를 모두 제공하므로 화면에서 고르게 한다.
const view = ref<ScheduleView>('month')
const actionError = ref<string | null>(null)

const { data, loading, error, reload } = useAsync(() => {
  if (view.value === 'week') return scheduleApi.week({ year: year.value, month: month.value, date: date.value })
  if (view.value === 'daily') return scheduleApi.daily({ year: year.value, month: month.value, date: date.value })
  return scheduleApi.month({ year: year.value, month: month.value })
}, [view, year, month, date])

const schedules = computed(() => (data.value?.resultList ?? []) as Schedule[])

/** 보기 단위만큼 앞뒤로 옮긴다 — 월간은 한 달, 주간은 7일, 일간은 하루. */
function move(delta: number) {
  const step = view.value === 'week' ? 7 * delta : delta
  const next =
    view.value === 'month'
      ? new Date(year.value, month.value + delta, 1)
      : new Date(year.value, month.value, date.value + step)
  year.value = next.getFullYear()
  month.value = next.getMonth()
  if (view.value !== 'month') date.value = next.getDate()
}

function goToday() {
  const now = new Date()
  year.value = now.getFullYear()
  month.value = now.getMonth()
  date.value = now.getDate()
}

/** 현재 보고 있는 기간 표시 */
const periodLabel = computed(() => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const ym = `${year.value}. ${pad(month.value + 1)}`
  if (view.value === 'month') return ym
  if (view.value === 'daily') return `${ym}. ${pad(date.value)}`
  // 주간은 일요일~토요일 범위를 보여준다(서버도 같은 기준으로 한 주를 판단한다).
  const base = new Date(year.value, month.value, date.value)
  const start = new Date(base)
  start.setDate(base.getDate() - base.getDay())
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (d: Date) => `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())}`
  return `${fmt(start)} ~ ${fmt(end)}`
})

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

  <div class="d-flex align-items-center flex-wrap gap-2 mb-3">
    <div class="btn-group" role="group" :aria-label="t('schedule.view', '조회 단위')">
      <button
        v-for="v in (['month', 'week', 'daily'] as const)"
        :key="v"
        type="button"
        class="krds-btn small"
        :class="view === v ? 'primary' : 'tertiary'"
        :aria-pressed="view === v"
        @click="view = v"
      >
        {{
          v === 'month'
            ? t('schedule.view.month', '월간')
            : v === 'week'
              ? t('schedule.view.week', '주간')
              : t('schedule.view.daily', '일간')
        }}
      </button>
    </div>

    <button type="button" class="krds-btn tertiary small" @click="move(-1)">
      <i class="bi bi-chevron-left" aria-hidden="true" /> {{ t('com.prev', '이전') }}
    </button>
    <strong aria-live="polite">{{ periodLabel }}</strong>
    <button type="button" class="krds-btn tertiary small" @click="move(1)">
      {{ t('com.next', '다음') }} <i class="bi bi-chevron-right" aria-hidden="true" />
    </button>
    <button type="button" class="krds-btn secondary small ms-2" @click="goToday">
      {{ t('schedule.today', '오늘') }}
    </button>
  </div>

  <AppFeedback v-if="loading" state="loading" />
  <AppFeedback v-else-if="error" state="error" :message="error" retryable @retry="reload" />

  <template v-else>
    <AppFeedback v-if="schedules.length === 0" state="empty">
      {{ t('schedule.empty', '해당 기간에 등록된 일정이 없습니다.') }}
    </AppFeedback>

    <div v-else class="krds-table-wrap">
      <table class="tbl">
        <caption>{{ t('schedule.listCaption', '일정 목록 — 일정명, 구분, 시작, 종료, 장소') }}</caption>
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
