<script setup lang="ts">
import { ref } from 'vue'
import { siteAdminApi } from '../api/admin'
import { ApiError } from '../api/client'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from '../components/AppFeedback.vue'

/**
 * 관리자 비밀번호 변경.
 *
 * 서버가 현재 비밀번호를 저장값과 대조한 뒤에만 바꾼다.
 * 이 API 는 평문을 받는다(서버가 이중 해시를 직접 만든다) — 로그인과 규칙이 다르다.
 */
const { t } = useI18n()

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref<string | null>(null)
const done = ref(false)
const submitting = ref(false)

async function handleSubmit() {
  error.value = null
  done.value = false

  if (newPassword.value !== confirmPassword.value) {
    error.value = t('adminpw.mismatch', '비밀번호가 일치하지 않습니다.')
    return
  }

  submitting.value = true
  try {
    await siteAdminApi.changePassword(oldPassword.value, newPassword.value)
    done.value = true
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('adminpw.fail', '비밀번호를 변경하지 못했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-md-6">
      <h1 class="h3 mb-3">{{ t('adminpw.title', '관리자 비밀번호 변경') }}</h1>

      <AppFeedback v-if="error" state="error" :message="error" />
      <div v-if="done" class="krds-alert success mb-3" role="status">
        {{ t('adminpw.done', '비밀번호를 변경했습니다.') }}
      </div>

      <form class="krds-panel" novalidate @submit.prevent="handleSubmit">
        <div class="krds-panel-body">
          <div class="form-group">
            <div class="form-tit">
              <label for="adminpw-old">{{ t('adminpw.cur', '현재 비밀번호') }}</label>
            </div>
            <div class="form-conts">
              <input
                id="adminpw-old"
                v-model="oldPassword"
                class="krds-input"
                type="password"
                :placeholder="t('adminpw.ph.cur', '현재 비밀번호를 입력하세요')"
                autocomplete="current-password"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="adminpw-new">{{ t('adminpw.new', '새 비밀번호') }}</label>
            </div>
            <div class="form-conts">
              <input
                id="adminpw-new"
                v-model="newPassword"
                class="krds-input"
                type="password"
                :placeholder="t('adminpw.ph.new', '새 비밀번호를 입력하세요 (8자 이상)')"
                autocomplete="new-password"
                minlength="8"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <div class="form-tit">
              <label for="adminpw-confirm">{{ t('adminpw.confirm', '새 비밀번호 확인') }}</label>
            </div>
            <div class="form-conts">
              <input
                id="adminpw-confirm"
                v-model="confirmPassword"
                class="krds-input"
                type="password"
                :placeholder="t('adminpw.ph.confirm', '새 비밀번호를 다시 입력하세요')"
                autocomplete="new-password"
                required
              />
            </div>
          </div>
        </div>

        <div class="krds-panel-body border-top">
          <button
            type="submit"
            class="krds-btn primary"
            :disabled="submitting || !oldPassword || !newPassword || !confirmPassword"
          >
            {{ submitting ? t('com.processing', '처리 중…') : t('com.save', '저장') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
