<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../auth/useAuth'
import { useI18n } from '../i18n/useI18n'
import { GALLERY_BBS_ID, NOTICE_BBS_ID } from '../constants'

const { t, lang, setLang } = useI18n()
const { user, isAuthenticated, isAdmin, logout } = useAuth()
const router = useRouter()

const navOpen = ref(false)
const showScrollTop = ref(false)

async function handleLogout() {
  await logout()
  await router.push('/')
}

function onScroll() {
  showScrollTop.value = window.scrollY > 300
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <!-- 접근성: 반복되는 헤더/내비게이션을 건너뛰고 본문으로 이동 (KWCAG 2.2) -->
  <a href="#content" class="skip-nav">{{ t('com.skipNav', '본문 바로가기') }}</a>

  <header class="egov-header bg-white border-bottom shadow-sm">
    <div class="container-fluid d-flex align-items-center justify-content-between py-2 px-4">
      <div class="egov-header-logo">
        <RouterLink to="/" class="text-decoration-none d-flex align-items-center">
          <span class="fw-bold text-primary fs-5">{{ t('header.brand', '전자정부 표준프레임워크') }}</span>
        </RouterLink>
      </div>

      <div class="egov-header-user d-flex align-items-center gap-2">
        <div class="egov-lang" role="group" :aria-label="t('lang.select', '언어 선택')">
          <button
            type="button"
            class="lang-btn"
            :class="{ active: lang === 'ko' }"
            :aria-pressed="lang === 'ko'"
            @click="setLang('ko')"
          >
            {{ t('lang.korean.short', '한국어') }}
          </button>
          <button
            type="button"
            class="lang-btn"
            :class="{ active: lang === 'en' }"
            :aria-pressed="lang === 'en'"
            @click="setLang('en')"
          >
            EN
          </button>
        </div>

        <RouterLink
          v-if="isAuthenticated && isAdmin"
          to="/admin/members"
          class="krds-btn secondary small"
          :title="t('nav.member', '회원관리')"
        >
          <i class="bi bi-person-gear" aria-hidden="true" />
          <strong>{{ user?.name }}</strong> <span>{{ t('header.honorific', '님') }}</span>
        </RouterLink>

        <RouterLink
          v-if="isAuthenticated && !isAdmin"
          to="/mypage"
          class="krds-btn secondary small"
          :title="t('nav.mypage', '마이페이지')"
        >
          <i class="bi bi-person-circle" aria-hidden="true" />
          <strong>{{ user?.name }}</strong> <span>{{ t('header.honorific', '님') }}</span>
        </RouterLink>

        <button v-if="isAuthenticated" type="button" class="krds-btn tertiary small" @click="handleLogout">
          <i class="bi bi-box-arrow-right" aria-hidden="true" />
          <span>{{ t('header.logout', '로그아웃') }}</span>
        </button>
        <template v-else>
          <RouterLink to="/register" class="krds-btn tertiary small">{{ t('nav.join', '회원가입') }}</RouterLink>
          <RouterLink to="/login" class="krds-btn primary small">
            <i class="bi bi-box-arrow-in-right" aria-hidden="true" />
            <span>{{ t('login.submit', '로그인') }}</span>
          </RouterLink>
        </template>
      </div>
    </div>
  </header>

  <nav class="egov-nav navbar navbar-expand-lg navbar-dark bg-primary" :aria-label="t('nav.main', '주요 메뉴')">
    <div class="container-fluid px-4">
      <button
        class="navbar-toggler"
        type="button"
        aria-controls="mainNav"
        :aria-expanded="navOpen"
        :aria-label="t('nav.toggle', '메뉴 펼치기')"
        @click="navOpen = !navOpen"
      >
        <span class="navbar-toggler-icon" />
      </button>

      <div id="mainNav" class="collapse navbar-collapse" :class="{ show: navOpen }">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <RouterLink to="/" class="nav-link" @click="navOpen = false">{{ t('nav.home', '홈') }}</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink :to="`/board/${NOTICE_BBS_ID}`" class="nav-link" @click="navOpen = false">
              {{ t('nav.notice', '공지사항') }}
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink :to="`/board/${GALLERY_BBS_ID}`" class="nav-link" @click="navOpen = false">
              {{ t('nav.gallery', '갤러리') }}
            </RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink to="/schedule" class="nav-link" @click="navOpen = false">
              {{ t('nav.schedule', '일정관리') }}
            </RouterLink>
          </li>
          <li v-if="isAuthenticated && !isAdmin" class="nav-item">
            <RouterLink to="/mypage" class="nav-link" @click="navOpen = false">
              {{ t('nav.mypage', '마이페이지') }}
            </RouterLink>
          </li>
          <template v-if="isAdmin">
            <li class="nav-item">
              <RouterLink to="/admin/members" class="nav-link" @click="navOpen = false">
                {{ t('nav.member', '회원관리') }}
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink to="/admin/board-master" class="nav-link" @click="navOpen = false">
                {{ t('nav.boardManage', '게시판 관리') }}
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink to="/admin/board-use" class="nav-link" @click="navOpen = false">
                {{ t('nav.boardUse', '게시판 사용정보') }}
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink to="/admin/password" class="nav-link" @click="navOpen = false">
                {{ t('nav.changePw', '비밀번호 변경') }}
              </RouterLink>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>

  <main id="content" class="egov-content container-fluid py-4">
    <RouterView />
  </main>

  <footer class="egov-footer border-top mt-5 py-4">
    <div class="container-fluid px-4">
      <p class="mb-1 fw-bold">{{ t('footer.title', '전자정부표준프레임워크') }}</p>
      <p class="mb-0 small text-muted">
        {{ t('footer.copyright', '© 전자정부표준프레임워크. All rights reserved.') }}
      </p>
    </div>
  </footer>

  <button
    type="button"
    class="scroll-top-btn"
    :class="{ show: showScrollTop }"
    :aria-label="t('com.scrollTop', '맨 위로')"
    :title="t('com.scrollTop', '맨 위로')"
    @click="scrollToTop"
  >
    <i class="bi bi-arrow-up" aria-hidden="true" />
  </button>
</template>
