<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { memberApi } from '../api/member'
import { ApiError } from '../api/client'
import { hashPassword } from '../auth/password'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from '../components/AppFeedback.vue'

/**
 * 회원가입.
 *
 * 비밀번호는 로그인과 같은 규칙으로 1차 해시해서 보낸다 —
 * 저장값이 이중 해시이고 서버가 나머지 한 번을 담당하기 때문이다.
 * 평문을 보내면 저장은 되지만 이후 로그인이 되지 않는다.
 */
const router = useRouter()
const { t } = useI18n()

const mberId = ref('')
const password = ref('')
const confirmPassword = ref('')
const mberNm = ref('')
const mberEmailAdres = ref('')
const moblphonNo = ref('')

const idChecked = ref<boolean | null>(null)
const error = ref<string | null>(null)
const submitting = ref(false)

async function handleCheckId() {
  error.value = null
  if (!mberId.value) return
  try {
    const result = await memberApi.checkId(mberId.value)
    // 서버가 사용중 건수(usedCnt) 또는 숫자를 돌려준다 — 0 이면 사용 가능
    const usedCount = typeof result === 'number' ? result : (result?.usedCnt ?? 0)
    idChecked.value = usedCount === 0
    if (!idChecked.value) {
      error.value = t('join.idTaken', '이미 사용 중인 아이디입니다.')
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('join.idCheckFail', '아이디를 확인하지 못했습니다.')
  }
}

async function handleSubmit() {
  error.value = null

  if (idChecked.value !== true) {
    error.value = t('join.needIdCheck', '아이디 중복 확인을 해 주세요.')
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = t('join.pwMismatch', '비밀번호가 서로 일치하지 않습니다.')
    return
  }

  submitting.value = true
  try {
    await memberApi.register({
      mberId: mberId.value,
      // 로그인과 같은 1차 해시 (저장값은 이중 해시)
      password: await hashPassword(mberId.value, password.value),
      mberNm: mberNm.value,
      mberEmailAdres: mberEmailAdres.value,
      moblphonNo: moblphonNo.value,
    })
    await router.replace('/login')
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('join.fail', '가입하지 못했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-lg-6">
      <h1 class="h3 mb-3">{{ t('nav.join', '회원가입') }}</h1>

      <AppFeedback v-if="error" state="error" :message="error" />

      <form class="krds-panel" novalidate @submit.prevent="handleSubmit">
        <div class="krds-panel-body">
          <div class="form-group">
            <div class="form-tit">
              <label for="reg-id">{{ t('login.id', '아이디') }} <span class="frm-rq">*</span></label>
            </div>
            <div class="form-conts d-flex gap-2">
              <input id="reg-id" v-model="mberId" class="krds-input" type="text" required @input="idChecked = null" />
              <button
                type="button"
                class="krds-btn secondary flex-shrink-0"
                :disabled="!mberId"
                @click="handleCheckId"
              >
                {{ t('join.checkId', '중복확인') }}
              </button>
            </div>
            <p v-if="idChecked === true" class="form-hint text-primary">
              {{ t('join.idAvailable', '사용할 수 있는 아이디입니다.') }}
            </p>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="reg-name">{{ t('mypage.name', '이름') }} <span class="frm-rq">*</span></label>
            </div>
            <div class="form-conts">
              <input id="reg-name" v-model="mberNm" class="krds-input" type="text" required />
            </div>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="reg-email">{{ t('mypage.email', '이메일') }}</label>
            </div>
            <div class="form-conts">
              <input id="reg-email" v-model="mberEmailAdres" class="krds-input" type="email" />
            </div>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="reg-phone">{{ t('member.phone', '휴대전화') }}</label>
            </div>
            <div class="form-conts">
              <input id="reg-phone" v-model="moblphonNo" class="krds-input" type="tel" placeholder="010-0000-0000" />
            </div>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="reg-pw">{{ t('login.password', '비밀번호') }} <span class="frm-rq">*</span></label>
            </div>
            <div class="form-conts">
              <input
                id="reg-pw"
                v-model="password"
                class="krds-input"
                type="password"
                autocomplete="new-password"
                minlength="8"
                required
              />
              <p class="form-hint">{{ t('mypage.pwHint', '8자 이상 입력하세요.') }}</p>
            </div>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="reg-pw-confirm">
                {{ t('mypage.confirmPw', '비밀번호 확인') }} <span class="frm-rq">*</span>
              </label>
            </div>
            <div class="form-conts">
              <input
                id="reg-pw-confirm"
                v-model="confirmPassword"
                class="krds-input"
                type="password"
                autocomplete="new-password"
                required
              />
            </div>
          </div>
        </div>

        <div class="krds-panel-body border-top d-flex gap-2">
          <button type="submit" class="krds-btn primary" :disabled="submitting">
            {{ submitting ? t('com.processing', '처리 중…') : t('nav.join', '회원가입') }}
          </button>
          <RouterLink to="/login" class="krds-btn tertiary">{{ t('com.cancel', '취소') }}</RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>
