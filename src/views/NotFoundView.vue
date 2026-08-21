<script setup lang="ts">
import { useI18n } from '../i18n/useI18n'

const { t } = useI18n()
</script>

<template>
  <div class="py-5 text-center">
    <h1 class="h3 mb-3">{{ t('error.notFound.title', '페이지를 찾을 수 없습니다') }}</h1>
    <p class="text-muted mb-4">{{ t('error.notFound.desc', '주소가 변경되었거나 삭제된 페이지입니다.') }}</p>
    <RouterLink to="/" class="krds-btn primary">{{ t('nav.home', '홈') }}</RouterLink>
  </div>
</template>
