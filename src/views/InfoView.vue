<script setup lang="ts">
/**
 * 사이트 소개 화면.
 *
 * 서버 렌더링 판은 소개 4종(사이트소개·연혁·조직·찾아오시는 길)을 각각 별도 HTML 로 두었지만
 * 구조가 제목 + 본문 패널로 같고 문구만 다르다. 문구는 서버 메시지 번들에 있으므로
 * 화면 하나가 슬러그별 키 접두어만 바꿔 그린다 — 항목이 늘어도 아래 목록에 한 줄만 더하면 된다.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../i18n/useI18n'

/** 슬러그 → 메시지 키 접두어 (서버 번들의 키와 맞춰야 한다) */
const PAGES: Record<string, { prefix: string; icon: string }> = {
  about: { prefix: 'about', icon: 'bi-building' },
  history: { prefix: 'history', icon: 'bi-clock-history' },
  organization: { prefix: 'org', icon: 'bi-diagram-3' },
  location: { prefix: 'location', icon: 'bi-geo-alt' },
}

const route = useRoute()
const { t } = useI18n()

const page = computed(() => PAGES[String(route.params.slug ?? 'about')] ?? null)
</script>

<template>
  <template v-if="page">
    <nav :aria-label="t('com.breadcrumb', '현재 위치')">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <RouterLink to="/">{{ t('nav.home', '홈') }}</RouterLink>
        </li>
        <li class="breadcrumb-item">{{ t('nav.introGroup', '사이트 소개') }}</li>
        <li class="breadcrumb-item active" aria-current="page">{{ t(`${page.prefix}.title`) }}</li>
      </ol>
    </nav>

    <div class="d-flex align-items-center gap-2 mb-2">
      <i :class="`bi ${page.icon} fs-4 text-primary`" aria-hidden="true" />
      <span class="text-muted small">{{ t(`${page.prefix}.eyebrow`) }}</span>
    </div>
    <h1 class="h3 mb-2">{{ t(`${page.prefix}.heading`) }}</h1>
    <p class="text-muted mb-4">{{ t(`${page.prefix}.lead`) }}</p>

    <div class="krds-panel">
      <div class="krds-panel-head fw-bold">{{ t(`${page.prefix}.panel.title`) }}</div>
      <div class="krds-panel-body">
        <p class="mb-0" style="white-space: pre-wrap">{{ t(`${page.prefix}.body`) }}</p>
      </div>
    </div>
  </template>

  <div v-else class="py-5 text-center">
    <h1 class="h4 mb-2">{{ t('error.notFound.title', '페이지를 찾을 수 없습니다') }}</h1>
    <RouterLink to="/" class="krds-btn primary">{{ t('nav.home', '홈') }}</RouterLink>
  </div>
</template>
