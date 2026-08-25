<script setup lang="ts">
/**
 * SNS 간편 로그인 버튼.
 *
 * 백엔드에 공급자 키가 없으면 눌러 봐야 공급자 오류 화면으로 빠지므로,
 * `VITE_SNS_ENABLED` 가 켜져 있을 때만 그린다(기본 꺼짐).
 */
import { snsEnabled, startSnsLogin } from '../api/sns'
import { useI18n } from '../i18n/useI18n'

const { t } = useI18n()
</script>

<template>
  <div v-if="snsEnabled" class="mt-4">
    <p class="text-center text-muted small mb-2">{{ t('login.sns', 'SNS 계정으로 로그인') }}</p>
    <div class="d-flex gap-2">
      <button type="button" class="krds-btn secondary w-100" @click="startSnsLogin('kakao')">
        {{ t('login.sns.kakao', '카카오') }}
      </button>
      <button type="button" class="krds-btn secondary w-100" @click="startSnsLogin('naver')">
        {{ t('login.sns.naver', '네이버') }}
      </button>
    </div>
  </div>
</template>
