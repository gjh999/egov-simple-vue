import { ref, watch } from 'vue'
import type { Ref, WatchSource } from 'vue'
import { ApiError } from '../api/client'

interface AsyncState<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  /** 같은 조건으로 다시 불러온다 (등록·삭제 후 목록 갱신 등) */
  reload: () => void
}

/**
 * 비동기 조회를 상태와 함께 다루는 컴포저블.
 *
 * `sources` 가 바뀌면 자동으로 다시 조회하고, 늦게 도착한 이전 요청의 응답은 버린다
 * (페이지를 빠르게 넘길 때 옛 결과가 뒤늦게 덮어쓰는 것을 막는다).
 */
export function useAsync<T>(fetcher: () => Promise<T>, sources: WatchSource[] = []): AsyncState<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(true)
  const error = ref<string | null>(null)

  // 가장 최근 요청만 결과를 반영하도록 세대 번호를 매긴다
  let generation = 0

  const run = async () => {
    const current = ++generation
    loading.value = true
    error.value = null
    try {
      const result = await fetcher()
      if (current !== generation) return
      data.value = result
    } catch (e: unknown) {
      if (current !== generation) return
      data.value = null
      error.value = e instanceof ApiError ? e.message : '데이터를 불러오지 못했습니다.'
    } finally {
      if (current === generation) loading.value = false
    }
  }

  if (sources.length > 0) {
    watch(sources, run, { immediate: true })
  } else {
    void run()
  }

  return { data, loading, error, reload: run }
}
