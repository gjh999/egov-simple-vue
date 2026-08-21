import { createApp } from 'vue'
import AppLayout from './components/AppLayout.vue'
import { router } from './router'
import { initAuth } from './auth/useAuth'
import { initI18n } from './i18n/useI18n'

/**
 * 앱 시작 전에 인증 상태와 메시지 번들을 한 번 받아 둔다.
 * 둘 다 실패해도 화면은 떠야 하므로(비로그인 상태로 진행) 오류를 삼킨다.
 */
async function bootstrap() {
  await Promise.allSettled([initAuth(), initI18n()])

  createApp(AppLayout).use(router).mount('#app')
}

void bootstrap()
