<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { scheduleApi } from '../api/schedule'
import { ApiError } from '../api/client'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from '../components/AppFeedback.vue'
import type { CommonCode } from '../api/types'

/**
 * 일정 등록 / 수정.
 *
 * 서버는 시작·종료 일시를 `yyyyMMddHHmm` 문자열로 주고받는다.
 * 브라우저의 datetime-local 입력은 `yyyy-MM-ddTHH:mm` 이라 양방향 변환이 필요하다 —
 * 이 변환을 빠뜨리면 저장은 되는데 목록에 이상한 날짜가 찍힌다.
 */
const props = defineProps<{ mode: 'create' | 'edit' }>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const schdulId = computed(() => (route.params.schdulId ? String(route.params.schdulId) : ''))

const schdulNm = ref('')
const schdulCn = ref('')
const schdulSe = ref('')
const schdulBgnde = ref('')
const schdulEndde = ref('')
const schdulPlace = ref('')
/** 일정 구분 선택지 (공통코드 COM030) */
const codes = ref<CommonCode[]>([])
const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)

/** `yyyyMMddHHmm` → `<input type="datetime-local">` 의 `yyyy-MM-ddTHH:mm` */
function toInputValue(raw: string | undefined): string {
  if (!raw || raw.length < 12) return ''
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}`
}

function toServerValue(input: string): string {
  return input.replace(/[-T:]/g, '').slice(0, 12)
}

onMounted(async () => {
  const now = new Date()

  // 일정 구분 선택지는 월별 조회 응답에 함께 온다 (별도 코드 API 가 없다)
  try {
    const res = await scheduleApi.month({ year: now.getFullYear(), month: now.getMonth() })
    codes.value = res.schdulSe ?? []
  } catch {
    codes.value = []
  }

  if (props.mode === 'create' || !schdulId.value) {
    loading.value = false
    return
  }

  try {
    const res = await scheduleApi.detail(schdulId.value)
    // 상세 응답은 컨트롤러에 따라 scheduleDetail 로 감싸 오기도 한다
    const detail = (res as { scheduleDetail?: typeof res }).scheduleDetail ?? res
    schdulNm.value = detail.schdulNm ?? ''
    schdulCn.value = detail.schdulCn ?? ''
    schdulSe.value = detail.schdulSe ?? ''
    schdulBgnde.value = toInputValue(detail.schdulBgnde)
    schdulEndde.value = toInputValue(detail.schdulEndde)
    schdulPlace.value = detail.schdulPlace ?? ''
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('schedule.loadFail', '일정을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  error.value = null

  if (schdulBgnde.value && schdulEndde.value && schdulBgnde.value > schdulEndde.value) {
    error.value = t('schedule.rangeError', '종료 일시가 시작 일시보다 빠릅니다.')
    return
  }

  submitting.value = true
  try {
    const input = {
      schdulNm: schdulNm.value,
      schdulCn: schdulCn.value,
      schdulSe: schdulSe.value,
      schdulBgnde: toServerValue(schdulBgnde.value),
      schdulEndde: toServerValue(schdulEndde.value),
      schdulPlace: schdulPlace.value,
    }
    if (props.mode === 'create') {
      await scheduleApi.create(input)
    } else {
      await scheduleApi.update(schdulId.value, input)
    }
    await router.replace('/schedule')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('com.saveFail', '저장하지 못했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppFeedback v-if="loading" state="loading" />

  <div v-else class="row justify-content-center">
    <div class="col-12 col-lg-8">
      <h1 class="h3 mb-3">
        {{ props.mode === 'create' ? t('schedule.write', '일정 등록') : t('schedule.edit', '일정 수정') }}
      </h1>

      <AppFeedback v-if="error" state="error" :message="error" />

      <form class="krds-panel" novalidate @submit.prevent="handleSubmit">
        <div class="krds-panel-body">
          <div class="form-group">
            <div class="form-tit">
              <label for="schdul-nm">{{ t('schedule.name', '일정명') }} <span class="frm-rq">*</span></label>
            </div>
            <div class="form-conts">
              <input id="schdul-nm" v-model="schdulNm" class="krds-input" type="text" maxlength="100" required />
            </div>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="schdul-se">{{ t('schedule.type', '일정 구분') }}</label>
            </div>
            <div class="form-conts">
              <select id="schdul-se" v-model="schdulSe" class="krds-form-select">
                <option value="">{{ t('com.select', '선택') }}</option>
                <option v-for="code in codes" :key="code.code" :value="code.code">{{ code.codeNm }}</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="schdul-bgnde">{{ t('schedule.begin', '시작') }} <span class="frm-rq">*</span></label>
            </div>
            <div class="form-conts">
              <input id="schdul-bgnde" v-model="schdulBgnde" class="krds-input" type="datetime-local" required />
            </div>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="schdul-endde">{{ t('schedule.end', '종료') }} <span class="frm-rq">*</span></label>
            </div>
            <div class="form-conts">
              <input id="schdul-endde" v-model="schdulEndde" class="krds-input" type="datetime-local" required />
            </div>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="schdul-place">{{ t('schedule.place', '장소') }}</label>
            </div>
            <div class="form-conts">
              <input id="schdul-place" v-model="schdulPlace" class="krds-input" type="text" />
            </div>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="schdul-cn">{{ t('schedule.content', '내용') }}</label>
            </div>
            <div class="form-conts">
              <textarea id="schdul-cn" v-model="schdulCn" class="krds-input" rows="8" />
            </div>
          </div>
        </div>

        <div class="krds-panel-body border-top d-flex gap-2">
          <button
            type="submit"
            class="krds-btn primary"
            :disabled="submitting || !schdulNm || !schdulBgnde || !schdulEndde"
          >
            {{ submitting ? t('com.processing', '처리 중…') : t('com.save', '저장') }}
          </button>
          <button type="button" class="krds-btn tertiary" @click="router.push('/schedule')">
            {{ t('com.cancel', '취소') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
