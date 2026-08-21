<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../auth/useAuth'
import { useI18n } from '../i18n/useI18n'
import { ApiError } from '../api/client'

const { t } = useI18n()
const { login } = useAuth()
const router = useRouter()
const route = useRoute()

const id = ref('')
const password = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)

async function handleSubmit() {
  error.value = null
  submitting.value = true
  try {
    await login(id.value, password.value)
    // 라우트 가드가 남겨 둔 원래 목적지로 돌려보낸다
    const redirect = (route.query.redirect as string | undefined) ?? '/'
    await router.replace(redirect)
  } catch (e) {
    error.value =
      e instanceof ApiError ? e.message : t('login.fail', '아이디 또는 비밀번호가 올바르지 않습니다.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 col-md-6 col-lg-4">
      <div class="krds-panel">
        <div class="krds-panel-head">
          <h1 class="h4 mb-0">{{ t('login.title', '로그인') }}</h1>
        </div>
        <div class="krds-panel-body">
          <form novalidate @submit.prevent="handleSubmit">
            <div v-if="error" class="krds-alert danger mb-3" role="alert">{{ error }}</div>

            <div class="form-group">
              <div class="form-tit">
                <label for="login-id">{{ t('login.id', '아이디') }}</label>
              </div>
              <div class="form-conts">
                <input
                  id="login-id"
                  v-model="id"
                  class="krds-input"
                  type="text"
                  autocomplete="username"
                  required
                  autofocus
                />
              </div>
            </div>

            <div class="form-group">
              <div class="form-tit">
                <label for="login-password">{{ t('login.password', '비밀번호') }}</label>
              </div>
              <div class="form-conts">
                <input
                  id="login-password"
                  v-model="password"
                  class="krds-input"
                  type="password"
                  autocomplete="current-password"
                  required
                />
              </div>
            </div>

            <button type="submit" class="krds-btn primary w-100 mt-3" :disabled="submitting || !id || !password">
              {{ submitting ? t('com.processing', '처리 중…') : t('login.submit', '로그인') }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
