<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { boardApi } from '../api/board'
import { api, ApiError } from '../api/client'
import { useAsync } from '../composables/useAsync'
import { useAuth } from '../auth/useAuth'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from '../components/AppFeedback.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { user, isAdmin } = useAuth()

const bbsId = computed(() => String(route.params.bbsId ?? ''))
const nttId = computed(() => String(route.params.nttId ?? ''))

const deleting = ref(false)
const actionError = ref<string | null>(null)

const { data, loading, error, reload } = useAsync(
  () => boardApi.detail(bbsId.value, nttId.value),
  [bbsId, nttId],
)

const article = computed(() => data.value?.boardVO ?? null)

// 작성자 본인 또는 관리자만 수정·삭제할 수 있다. 서버도 같은 규칙으로 다시 검사한다.
const canEdit = computed(
  () => isAdmin.value || (!!user.value?.uniqId && user.value.uniqId === article.value?.frstRegisterId),
)
const canReply = computed(() => data.value?.brdMstrVO?.replyPosblAt === 'Y' && user.value !== null)

function fileUrl(atchFileId: string, fileSn: string) {
  return api.fileUrl(atchFileId, fileSn)
}

async function handleDelete() {
  if (!window.confirm(t('bbs.confirmDelete', '이 게시물을 삭제하시겠습니까?'))) return
  deleting.value = true
  actionError.value = null
  try {
    await boardApi.remove(bbsId.value, nttId.value)
    await router.replace(`/board/${bbsId.value}`)
  } catch (e) {
    actionError.value = e instanceof ApiError ? e.message : t('bbs.deleteFail', '삭제하지 못했습니다.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <AppFeedback v-if="loading" state="loading" />
  <AppFeedback v-else-if="error" state="error" :message="error" retryable @retry="reload" />
  <AppFeedback
    v-else-if="!article"
    state="error"
    :message="t('bbs.notFound', '게시물을 찾을 수 없습니다.')"
  />

  <template v-else>
    <h1 class="h3 mb-3">{{ article.bbsNm }}</h1>

    <AppFeedback v-if="actionError" state="error" :message="actionError" />

    <article class="krds-panel">
      <div class="krds-panel-head">
        <h2 class="h5 mb-0">{{ article.nttSj }}</h2>
      </div>
      <div class="krds-panel-body">
        <dl class="row small text-muted border-bottom pb-3 mb-3">
          <dt class="col-3 col-md-2">{{ t('bbs.writer', '작성자') }}</dt>
          <dd class="col-9 col-md-4">{{ article.frstRegisterNm }}</dd>
          <dt class="col-3 col-md-2">{{ t('bbs.date', '등록일') }}</dt>
          <dd class="col-9 col-md-4">{{ article.frstRegisterPnttm }}</dd>
          <dt class="col-3 col-md-2">{{ t('bbs.hit', '조회') }}</dt>
          <dd class="col-9 col-md-4 mb-0">{{ article.inqireCo }}</dd>
        </dl>

        <!--
          본문은 서버가 HTMLTagFilter 로 escape 한 텍스트다.
          v-html 을 쓰지 않고 텍스트로 렌더링해 XSS 경로를 아예 만들지 않는다. 줄바꿈만 유지한다.
        -->
        <div style="white-space: pre-wrap">{{ article.nttCn }}</div>

        <section v-if="(data?.fileList?.length ?? 0) > 0" class="mt-4 pt-3 border-top">
          <h3 class="h6">{{ t('bbs.attach', '첨부파일') }}</h3>
          <ul class="list-unstyled mb-0">
            <li v-for="file in data?.fileList" :key="`${file.atchFileId}-${file.fileSn}`">
              <a :href="fileUrl(file.atchFileId, file.fileSn)">
                <i class="bi bi-paperclip" aria-hidden="true" /> {{ file.orignlFileNm }}
              </a>
            </li>
          </ul>
        </section>
      </div>
    </article>

    <div class="d-flex gap-2 mt-3">
      <RouterLink :to="`/board/${bbsId}`" class="krds-btn tertiary">{{ t('com.list', '목록') }}</RouterLink>
      <RouterLink v-if="canReply" :to="`/board/${bbsId}/${nttId}/reply`" class="krds-btn secondary">
        {{ t('bbs.reply', '답변') }}
      </RouterLink>
      <template v-if="canEdit">
        <RouterLink :to="`/board/${bbsId}/${nttId}/edit`" class="krds-btn secondary">
          {{ t('com.edit', '수정') }}
        </RouterLink>
        <button type="button" class="krds-btn danger" :disabled="deleting" @click="handleDelete">
          {{ deleting ? t('com.processing', '처리 중…') : t('com.delete', '삭제') }}
        </button>
      </template>
    </div>
  </template>
</template>
