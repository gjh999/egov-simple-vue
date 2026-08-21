import { computed, readonly, ref } from 'vue'
import { authApi } from '../api/auth'
import type { CurrentUser } from '../api/auth'
import { setUnauthorizedHandler } from '../api/client'

/**
 * 인증 상태.
 *
 * React 판의 AuthContext 와 같은 역할이다. Vue 에서는 컨텍스트 대신 모듈 스코프의 ref 를 공유한다 —
 * 인증 상태는 앱 전체에 하나뿐이므로 provide/inject 를 거칠 이유가 없다.
 */
const user = ref<CurrentUser | null>(null)
const loading = ref(true)
let initialized = false

/** 어떤 API 든 401 을 받으면 화면 상태를 즉시 로그아웃으로 되돌린다 */
setUnauthorizedHandler(() => {
  user.value = null
})

/**
 * 앱 시작 시 한 번 호출한다.
 * 쿠키가 HttpOnly 라 JS 가 읽을 수 없으므로, 로그인 여부는 서버에 묻는 수밖에 없다.
 */
export async function initAuth(): Promise<void> {
  if (initialized) return
  initialized = true
  try {
    user.value = await authApi.me()
  } finally {
    loading.value = false
  }
}

export function useAuth() {
  const login = async (id: string, password: string) => {
    await authApi.login(id, password)
    // 로그인 응답에는 roles 가 없다 — 권한까지 담긴 정보를 /auth/me 로 다시 받는다
    user.value = await authApi.me()
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      // 서버 호출이 실패해도 화면은 로그아웃 상태로 만든다
      user.value = null
    }
  }

  const refresh = async () => {
    user.value = await authApi.me()
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    isAuthenticated: computed(() => user.value !== null),
    isAdmin: computed(() => user.value?.roles?.includes('ROLE_ADMIN') ?? false),
    login,
    logout,
    refresh,
  }
}
