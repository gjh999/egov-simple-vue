<script setup lang="ts">
import { memberApi } from '../api/member'
import { useAsync } from '../composables/useAsync'
import { useAuth } from '../auth/useAuth'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from '../components/AppFeedback.vue'

/**
 * 마이페이지.
 *
 * 주의: `/mypage` 는 **일반회원(GNR)** 테이블을 조회한다. 업무사용자(USR·관리자 계정)로 로그인하면
 * 회원 정보가 없어 서버가 "회원 정보를 찾을 수 없습니다"를 돌려준다 — 오류가 아니라 계정 종류의 차이다.
 * 그래서 서버 조회가 실패해도 로그인 정보(/auth/me)로 기본 정보는 보여준다.
 */
const { t } = useI18n()
const { user } = useAuth()
const { data, loading, error } = useAsync(() => memberApi.myPage())
</script>

<template>
  <AppFeedback v-if="loading" state="loading" />

  <template v-else>
    <h1 class="h3 mb-3">{{ t('nav.mypage', '마이페이지') }}</h1>

    <div class="krds-panel">
      <div class="krds-panel-head">
        <h2 class="h5 mb-0">{{ t('mypage.info', '내 정보') }}</h2>
      </div>
      <div class="krds-panel-body">
        <div class="krds-table-wrap">
          <table class="tbl col">
            <caption>{{ t('mypage.infoCaption', '내 정보 — 아이디, 이름, 이메일') }}</caption>
            <tbody>
              <tr>
                <th scope="row">{{ t('login.id', '아이디') }}</th>
                <td>{{ data?.mberId ?? data?.emplyrId ?? user?.id ?? '-' }}</td>
              </tr>
              <tr>
                <th scope="row">{{ t('mypage.name', '이름') }}</th>
                <td>{{ data?.mberNm ?? data?.userNm ?? user?.name ?? '-' }}</td>
              </tr>
              <tr>
                <th scope="row">{{ t('mypage.email', '이메일') }}</th>
                <td>{{ data?.emailAdres ?? '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="error" class="mt-3">
          <AppFeedback state="error" :message="error" />
          <p class="form-hint mb-0">
            {{ t('mypage.notMember', '업무사용자 계정은 회원 정보가 없습니다. 로그인 정보만 표시합니다.') }}
          </p>
        </div>
      </div>
    </div>
  </template>
</template>
