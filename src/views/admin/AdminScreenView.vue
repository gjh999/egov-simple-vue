<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AdminCrudView from '../../components/AdminCrudView.vue'
import NotFoundView from '../NotFoundView.vue'
import { useI18n } from '../../i18n/useI18n'
import { ADMIN_SCREENS } from './adminScreens'

/**
 * 관리자 화면 진입점.
 *
 * 라우트 meta 의 `screen` 이름으로 정의를 찾아 공통 골격에 넘긴다.
 * 화면을 추가할 때는 `adminScreens.ts` 에 정의 한 덩이와 라우트 한 줄만 더하면 된다.
 *
 * 정의를 `computed` 로 만드는 이유는 언어를 바꿨을 때 컬럼 헤더·라벨이 함께 갱신되게 하기 위해서다.
 */
const route = useRoute()
const { t } = useI18n()

const screen = computed(() => {
  const name = route.meta.screen as string | undefined
  const factory = name ? ADMIN_SCREENS[name] : undefined
  return factory ? factory(t) : null
})
</script>

<template>
  <AdminCrudView
    v-if="screen"
    :key="route.path"
    :title="screen.title"
    :caption="screen.caption"
    :columns="screen.columns"
    :row-key="screen.rowKey"
    :fetch-list="screen.fetchList"
    :fields="screen.fields"
    :to-form-values="screen.toFormValues"
    :on-create="screen.onCreate"
    :on-update="screen.onUpdate"
    :on-delete="screen.onDelete"
    :searchable="screen.searchable"
    :search-placeholder="screen.searchPlaceholder"
  />
  <NotFoundView v-else />
</template>
