import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { initAuth, useAuth } from '../auth/useAuth'
import { NOTICE_BBS_ID } from '../constants'
import MainView from '../views/MainView.vue'
import LoginView from '../views/LoginView.vue'
import SnsCallbackView from '../views/SnsCallbackView.vue'
import InfoView from '../views/InfoView.vue'
import RegisterView from '../views/RegisterView.vue'
import BoardListView from '../views/BoardListView.vue'
import BoardDetailView from '../views/BoardDetailView.vue'
import BoardFormView from '../views/BoardFormView.vue'
import ScheduleView from '../views/ScheduleView.vue'
import ScheduleFormView from '../views/ScheduleFormView.vue'
import MyPageView from '../views/MyPageView.vue'
import MemberListView from '../views/MemberListView.vue'
import AdminPasswordView from '../views/AdminPasswordView.vue'
import AdminScreenView from '../views/admin/AdminScreenView.vue'
import NotFoundView from '../views/NotFoundView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** 로그인이 필요한 화면 */
    requiresAuth?: boolean
    /** ROLE_ADMIN 이 필요한 화면 */
    adminOnly?: boolean
    /** 관리자 화면 정의 이름 (adminScreens.ts 의 키) */
    screen?: string
  }
}

/** 관리자 CRUD 라우트를 한 줄로 정의한다 */
function adminRoute(path: string, name: string, screen: string): RouteRecordRaw {
  return {
    path: `/admin/${path}`,
    name,
    component: AdminScreenView,
    meta: { requiresAuth: true, adminOnly: true, screen },
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'main', component: MainView },
  // 사이트 소개 — 슬러그별 문구는 서버 메시지 번들에서 온다
  { path: '/info', redirect: '/info/about' },
  { path: '/info/:slug', name: 'info', component: InfoView },
  { path: '/login', name: 'login', component: LoginView },
  // SNS 공급자가 되돌려보내는 주소. 백엔드 Sns.*.callbackUrl 과 같아야 한다.
  { path: '/login/:provider/callback', name: 'sns-callback', component: SnsCallbackView },
  { path: '/register', name: 'register', component: RegisterView },

  // 게시판 — 목록·상세는 비로그인도 볼 수 있고, 쓰기는 로그인이 필요하다
  // (백엔드 SecurityConfig 의 GET 화이트리스트와 같은 정책)
  { path: '/board', redirect: `/board/${NOTICE_BBS_ID}` },
  { path: '/board/:bbsId', name: 'board-list', component: BoardListView },
  {
    path: '/board/:bbsId/write',
    name: 'board-write',
    component: BoardFormView,
    props: { mode: 'create' },
    meta: { requiresAuth: true },
  },
  { path: '/board/:bbsId/:nttId', name: 'board-detail', component: BoardDetailView },
  {
    path: '/board/:bbsId/:nttId/edit',
    name: 'board-edit',
    component: BoardFormView,
    props: { mode: 'edit' },
    meta: { requiresAuth: true },
  },
  {
    path: '/board/:bbsId/:nttId/reply',
    name: 'board-reply',
    component: BoardFormView,
    props: { mode: 'reply' },
    meta: { requiresAuth: true },
  },

  // 일정
  { path: '/schedule', name: 'schedule', component: ScheduleView, meta: { requiresAuth: true } },
  {
    path: '/schedule/write',
    name: 'schedule-write',
    component: ScheduleFormView,
    props: { mode: 'create' },
    meta: { requiresAuth: true },
  },
  {
    path: '/schedule/:schdulId/edit',
    name: 'schedule-edit',
    component: ScheduleFormView,
    props: { mode: 'edit' },
    meta: { requiresAuth: true },
  },

  { path: '/mypage', name: 'mypage', component: MyPageView, meta: { requiresAuth: true } },

  // 관리자
  {
    path: '/admin/members',
    name: 'admin-members',
    component: MemberListView,
    meta: { requiresAuth: true, adminOnly: true },
  },
  adminRoute('board-master', 'admin-board-master', 'boardMaster'),
  adminRoute('board-use', 'admin-board-use', 'boardUse'),
  {
    path: '/admin/password',
    name: 'admin-password',
    component: AdminPasswordView,
    meta: { requiresAuth: true, adminOnly: true },
  },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

/**
 * 라우트 가드.
 *
 * 서버 권한 검사를 대신하는 장치가 아니다 — 백엔드가 모든 요청을 다시 검사한다.
 * 권한 없는 화면을 그렸다가 401/403 을 받고 깨지는 것을 막는 UX 장치다.
 */
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  // 쿠키가 HttpOnly 라 JS 로는 로그인 여부를 알 수 없다 — 첫 진입 시 서버에 한 번 물어본다
  await initAuth()

  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated.value) {
    // 로그인 후 원래 가려던 곳으로 돌려보내기 위해 경로를 남긴다
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.meta.adminOnly && !isAdmin.value) {
    return { path: '/' }
  }

  return true
})
