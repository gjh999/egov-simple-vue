<script setup lang="ts" generic="T">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../api/client'
// PagedResult 는 관리자 화면 골격이 기대하는 목록 응답 형태다 (api/admin.ts 에 정의)
import type { PagedResult } from '../api/admin'
import { useAsync } from '../composables/useAsync'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from './AppFeedback.vue'
import AppPagination from './AppPagination.vue'

/** 목록에 그릴 컬럼 하나 */
export interface Column<Row> {
  header: string
  /** 셀에 표시할 값 */
  value: (row: Row) => string | number
  /** colgroup 폭 (예: '15%') */
  width?: string
  /** 왼쪽 정렬 (제목·설명처럼 긴 텍스트) */
  alignStart?: boolean
  /** 배지로 표시 — 반환값이 true 면 강조색 */
  badge?: (row: Row) => boolean
}

/** 편집 폼의 입력 필드 하나 */
export interface Field {
  name: string
  label: string
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date'
  required?: boolean
  options?: { value: string; label: string }[]
  hint?: string
  /** 수정 시 잠글 필드 (기본키 등) */
  readOnlyOnEdit?: boolean
}

/**
 * 관리자 CRUD 화면의 공통 골격.
 *
 * 서버 렌더링 판은 도메인마다 목록·등록·수정·상세 네 개의 화면을 따로 두었다.
 * SPA 에서는 목록 화면 안에서 폼이 열리고 닫힌다 — 화면을 오갈 때마다 목록을 다시 불러오고
 * 검색 조건과 페이지를 잃어버리는 흐름을 없애기 위해서다.
 */
const props = defineProps<{
  title: string
  caption: string
  columns: Column<T>[]
  rowKey: (row: T) => string
  fetchList: (pageIndex: number, keyword: string) => Promise<PagedResult<T>>
  fields?: Field[]
  toFormValues?: (row: T) => Record<string, string>
  onCreate?: (values: Record<string, string>) => Promise<unknown>
  onUpdate?: (row: T, values: Record<string, string>) => Promise<unknown>
  onDelete?: (row: T) => Promise<unknown>
  searchable?: boolean
  searchPlaceholder?: string
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const pageIndex = computed(() => Number(route.query.page ?? '1'))
const keyword = computed(() => String(route.query.wrd ?? ''))

const searchInput = ref(keyword.value)
watch(keyword, (value) => {
  searchInput.value = value
})

/** null = 폼 닫힘, 'new' = 등록, 그 외 = 수정 대상 행 */
const editing = ref<T | 'new' | null>(null)
const values = ref<Record<string, string>>({})
const formError = ref<string | null>(null)
const submitting = ref(false)

const { data, loading, error, reload } = useAsync(
  () => props.fetchList(pageIndex.value, keyword.value),
  [pageIndex, keyword],
)

const rows = computed(() => data.value?.resultList ?? [])
const editable = computed(() => Boolean(props.fields && (props.onCreate || props.onUpdate)))
const showSearch = computed(() => props.searchable !== false)

function handleSearch() {
  void router.push({ query: { page: '1', wrd: searchInput.value } })
}

function goPage(pageNo: number) {
  void router.push({ query: { page: String(pageNo), wrd: keyword.value } })
}

function openCreate() {
  editing.value = 'new'
  values.value = {}
  formError.value = null
}

function openEdit(row: T) {
  editing.value = row
  values.value = props.toFormValues ? props.toFormValues(row) : {}
  formError.value = null
}

function closeForm() {
  editing.value = null
  formError.value = null
}

function isLocked(field: Field) {
  return editing.value !== 'new' && field.readOnlyOnEdit
}

async function handleSubmit() {
  formError.value = null
  submitting.value = true
  try {
    if (editing.value === 'new') {
      await props.onCreate?.(values.value)
    } else if (editing.value) {
      await props.onUpdate?.(editing.value as T, values.value)
    }
    closeForm()
    reload()
  } catch (e) {
    formError.value = e instanceof ApiError ? e.message : t('com.saveFail', '저장하지 못했습니다.')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row: T) {
  if (!window.confirm(t('com.confirmDelete', '삭제하시겠습니까?'))) return
  try {
    await props.onDelete?.(row)
    reload()
  } catch (e) {
    formError.value = e instanceof ApiError ? e.message : t('com.deleteFail', '삭제하지 못했습니다.')
  }
}
</script>

<template>
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h1 class="h3 mb-0">{{ props.title }}</h1>
    <button v-if="editable && props.onCreate" type="button" class="krds-btn primary" @click="openCreate">
      <i class="bi bi-plus-lg" aria-hidden="true" /> {{ t('com.create', '등록') }}
    </button>
  </div>

  <form v-if="showSearch" class="d-flex gap-2 mb-3" role="search" @submit.prevent="handleSearch">
    <label class="visually-hidden" for="admin-keyword">{{ t('bbs.searchKeyword', '검색어') }}</label>
    <input
      id="admin-keyword"
      v-model="searchInput"
      class="krds-input"
      type="search"
      :placeholder="props.searchPlaceholder ?? t('bbs.searchPlaceholder', '검색어를 입력하세요')"
    />
    <button type="submit" class="krds-btn secondary flex-shrink-0">{{ t('com.search', '검색') }}</button>
  </form>

  <AppFeedback v-if="formError" state="error" :message="formError" />

  <!-- 편집 폼 — 목록 위에 펼쳐진다 -->
  <form v-if="editing && props.fields" class="krds-panel mb-4" @submit.prevent="handleSubmit">
    <div class="krds-panel-head">
      <h2 class="h5 mb-0">{{ editing === 'new' ? t('com.create', '등록') : t('com.edit', '수정') }}</h2>
    </div>
    <div class="krds-panel-body">
      <div v-for="field in props.fields" :key="field.name" class="form-group">
        <div class="form-tit">
          <label :for="`field-${field.name}`">
            {{ field.label }}<span v-if="field.required" class="frm-rq"> *</span>
          </label>
        </div>
        <div class="form-conts">
          <textarea
            v-if="field.type === 'textarea'"
            :id="`field-${field.name}`"
            v-model="values[field.name]"
            class="krds-input"
            rows="8"
            :required="field.required"
          />
          <select
            v-else-if="field.type === 'select'"
            :id="`field-${field.name}`"
            v-model="values[field.name]"
            class="krds-form-select"
            :required="field.required"
          >
            <option value="">{{ t('com.select', '선택') }}</option>
            <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <input
            v-else
            :id="`field-${field.name}`"
            v-model="values[field.name]"
            class="krds-input"
            :type="field.type ?? 'text'"
            :required="field.required"
            :readonly="isLocked(field)"
          />
          <p v-if="field.hint" class="form-hint">{{ field.hint }}</p>
        </div>
      </div>
    </div>
    <div class="krds-panel-body border-top d-flex gap-2">
      <button type="submit" class="krds-btn primary" :disabled="submitting">
        {{ submitting ? t('com.processing', '처리 중…') : t('com.save', '저장') }}
      </button>
      <button type="button" class="krds-btn tertiary" @click="closeForm">{{ t('com.cancel', '취소') }}</button>
    </div>
  </form>

  <AppFeedback v-if="loading" state="loading" />
  <AppFeedback v-else-if="error" state="error" :message="error" retryable @retry="reload" />

  <template v-else>
    <AppFeedback v-if="rows.length === 0" state="empty" />
    <div v-else class="krds-table-wrap">
      <table class="tbl">
        <caption>{{ props.caption }}</caption>
        <colgroup>
          <col v-for="(col, i) in props.columns" :key="i" :style="col.width ? { width: col.width } : undefined" />
          <col v-if="editable" style="width: 14%" />
        </colgroup>
        <thead>
          <tr>
            <th v-for="(col, i) in props.columns" :key="i" scope="col">{{ col.header }}</th>
            <th v-if="editable" scope="col">{{ t('com.manage', '관리') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="props.rowKey(row)">
            <td v-for="(col, i) in props.columns" :key="i" :class="col.alignStart ? 'text-start' : undefined">
              <span v-if="col.badge" class="krds-badge" :class="col.badge(row) ? 'bg-primary' : 'bg-gray'">
                {{ col.value(row) }}
              </span>
              <template v-else>{{ col.value(row) }}</template>
            </td>
            <td v-if="editable">
              <div class="d-flex gap-1 justify-content-center">
                <button
                  v-if="props.onUpdate"
                  type="button"
                  class="krds-btn secondary small"
                  @click="openEdit(row)"
                >
                  {{ t('com.edit', '수정') }}
                </button>
                <button
                  v-if="props.onDelete"
                  type="button"
                  class="krds-btn danger small"
                  @click="handleDelete(row)"
                >
                  {{ t('com.delete', '삭제') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppPagination :info="data?.paginationInfo" @change="goPage" />
  </template>
</template>
