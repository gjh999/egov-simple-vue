import { readonly, ref } from 'vue'
import { api, setApiLanguage } from '../api/client'

export type Lang = 'ko' | 'en'

const STORAGE_KEY = 'egov-simple.lang'

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'ko' || stored === 'en') return stored
  } catch {
    // 사생활 보호 모드 등에서 localStorage 접근이 막힐 수 있다 — 기본값으로 진행한다
  }
  return 'ko'
}

const lang = ref<Lang>(readStoredLang())
const messages = ref<Record<string, string>>({})
const ready = ref(false)

/**
 * 문구의 원본은 백엔드의 properties 한 벌이다(`GET /api/i18n/{lang}`).
 * egov-simple-react 와 같은 번들을 받아 쓰므로 두 프론트의 문구가 갈라지지 않는다.
 */
async function loadMessages(next: Lang): Promise<void> {
  setApiLanguage(next)
  document.documentElement.lang = next
  try {
    messages.value = (await api.get<Record<string, string>>(`/i18n/${next}`)) ?? {}
  } catch {
    // 번들을 못 받아도 화면은 떠야 한다 — t() 가 fallback 문구를 쓴다
    messages.value = {}
  } finally {
    ready.value = true
  }
}

export async function initI18n(): Promise<void> {
  await loadMessages(lang.value)
}

export function useI18n() {
  const setLang = async (next: Lang) => {
    lang.value = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // 저장 실패는 무시한다 — 이번 세션 동안은 선택이 유지된다
    }
    await loadMessages(next)
  }

  /** 메시지 키를 현재 언어의 문구로 바꾼다. 키가 없으면 fallback(없으면 키 자체)을 돌려준다. */
  const t = (key: string, fallback?: string): string => messages.value[key] ?? fallback ?? key

  return { lang: readonly(lang), ready: readonly(ready), setLang, t }
}
