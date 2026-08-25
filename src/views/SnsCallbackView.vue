<script setup lang="ts">
/**
 * SNS 로그인 콜백 화면.
 *
 * 공급자가 이 주소로 되돌려보내면 `code` 를 백엔드에 넘긴다.
 * 백엔드가 토큰을 교환해 ACCESS_TOKEN 쿠키를 심으므로, 여기서는 인증 상태만 다시 읽고
 * 홈으로 보낸다 — 응답 본문에 토큰이 없으니 프론트가 저장할 것이 없다.
 */
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { completeSnsLogin } from '../api/sns'
import type { SnsProvider } from '../api/sns'
import { useAuth } from '../auth/useAuth'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from '../components/AppFeedback.vue'

const route = useRoute()
const router = useRouter()
const { refresh } = useAuth()
const { t } = useI18n()

const error = ref<string | null>(null)

onMounted(async () => {
  const provider = String(route.params.provider ?? '')
  const code = route.query.code as string | undefined
  const state = (route.query.state as string | undefined) ?? null
  const denied = route.query.error

  if (denied) {
    error.value = t('login.sns.denied', 'SNS 로그인이 취소되었습니다.')
    return
  }
  if (!code || (provider !== 'kakao' && provider !== 'naver')) {
    error.value = t('login.sns.badRequest', '잘못된 접근입니다.')
    return
  }

  try {
    await completeSnsLogin(provider as SnsProvider, code, state)
    await refresh()
    router.replace('/')
  } catch {
    error.value = t('login.sns.fail', 'SNS 로그인에 실패했습니다.')
  }
})
</script>

<template>
  <AppFeedback
    v-if="error"
    state="error"
    :message="error"
    retryable
    @retry="router.replace('/login')"
  />
  <AppFeedback v-else state="loading" :message="t('login.sns.processing', 'SNS 로그인 처리 중…')" />
</template>
