<script setup lang="ts">
import { useI18n } from '../i18n/useI18n'

/**
 * 로딩·오류·빈 목록을 한 컴포넌트로 다룬다.
 * 세 상태를 화면마다 따로 그리면 한 군데씩 빠뜨리게 된다.
 */
const props = defineProps<{
  state: 'loading' | 'error' | 'empty'
  message?: string
  retryable?: boolean
}>()

const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>

<template>
  <div v-if="props.state === 'loading'" class="py-5 text-center" role="status" aria-live="polite">
    <span>{{ props.message ?? t('com.loading', '불러오는 중…') }}</span>
  </div>

  <div v-else-if="props.state === 'error'" class="krds-alert danger my-3" role="alert">
    <p class="mb-2">{{ props.message }}</p>
    <button v-if="props.retryable" type="button" class="krds-btn secondary small" @click="emit('retry')">
      {{ t('com.retry', '다시 시도') }}
    </button>
  </div>

  <div v-else class="py-5 text-center text-muted">
    <slot>{{ props.message ?? t('com.noData', '조회된 데이터가 없습니다.') }}</slot>
  </div>
</template>
