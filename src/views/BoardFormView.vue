<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { boardApi } from '../api/board'
import { ApiError } from '../api/client'
import { useI18n } from '../i18n/useI18n'
import AppFeedback from '../components/AppFeedback.vue'

/**
 * 게시물 등록 / 수정 / 답변 폼.
 *
 * 세 화면의 입력 항목이 같아 하나로 합쳤다. 다른 점은 (1) 초기값을 불러오는지,
 * (2) 어떤 API 를 호출하는지 뿐이다. 모드는 라우트 meta 로 받는다.
 */
const props = defineProps<{ mode: 'create' | 'edit' | 'reply' }>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const bbsId = computed(() => String(route.params.bbsId ?? ''))
const nttId = computed(() => (route.params.nttId ? String(route.params.nttId) : ''))

const subject = ref('')
const content = ref('')
const files = ref<File[]>([])
const atchFileId = ref('')
const loading = ref(props.mode !== 'create')
const submitting = ref(false)
const error = ref<string | null>(null)

/** 답변 등록에 필요한 부모 게시물의 정렬 정보 */
const parentInfo = ref<{ parnts: string; sortOrdr: number; replyLc: string } | null>(null)
/** 이 게시판이 첨부를 허용하는지 (허용 개수 0 이면 입력 자체를 감춘다) */
const maxFiles = ref(0)

const title = computed(() =>
  props.mode === 'create'
    ? t('bbs.write', '글쓰기')
    : props.mode === 'edit'
      ? t('com.edit', '수정')
      : t('bbs.reply', '답변'),
)

onMounted(async () => {
  try {
    const info = await boardApi.fileAttachInfo(bbsId.value)
    maxFiles.value = info.fileAtchPosblAt === 'Y' ? info.posblAtchFileNumber : 0
  } catch {
    maxFiles.value = 0
  }

  if (props.mode === 'create' || !nttId.value) {
    loading.value = false
    return
  }

  try {
    const detail = await boardApi.detail(bbsId.value, nttId.value)
    const article = detail.boardVO
    if (props.mode === 'edit') {
      subject.value = article.nttSj
      content.value = article.nttCn
      atchFileId.value = article.atchFileId ?? ''
    } else {
      // 답변은 제목에 원글 제목을 이어 붙이는 관례를 따른다
      subject.value = `RE: ${article.nttSj}`
      parentInfo.value = {
        parnts: String(article.nttId),
        sortOrdr: article.sortOrdr ?? 0,
        replyLc: article.replyLc ?? '0',
      }
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('bbs.loadFail', '게시물을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
})

function handleFileChange(event: Event) {
  const selected = Array.from((event.target as HTMLInputElement).files ?? [])
  if (maxFiles.value > 0 && selected.length > maxFiles.value) {
    error.value = t('bbs.tooManyFiles', `첨부는 최대 ${maxFiles.value}개까지 가능합니다.`)
    files.value = selected.slice(0, maxFiles.value)
    return
  }
  error.value = null
  files.value = selected
}

async function handleSubmit() {
  error.value = null
  submitting.value = true
  try {
    const input = {
      bbsId: bbsId.value,
      nttSj: subject.value,
      nttCn: content.value,
      atchFileId: atchFileId.value,
      files: files.value,
    }

    if (props.mode === 'create') {
      await boardApi.create(input)
    } else if (props.mode === 'edit') {
      await boardApi.update(nttId.value, input)
    } else {
      if (!parentInfo.value) {
        throw new ApiError(t('bbs.parentMissing', '원글 정보를 확인하지 못했습니다.'), 900, 400)
      }
      await boardApi.reply({ ...input, nttId: Number(nttId.value), ...parentInfo.value })
    }

    await router.replace(`/board/${bbsId.value}`)
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('bbs.saveFail', '저장하지 못했습니다.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppFeedback v-if="loading" state="loading" />

  <template v-else>
    <h1 class="h3 mb-3">{{ title }}</h1>

    <AppFeedback v-if="error" state="error" :message="error" />

    <form class="krds-panel" @submit.prevent="handleSubmit">
      <div class="krds-panel-body">
        <div class="form-group">
          <div class="form-tit">
            <label for="ntt-subject"> {{ t('bbs.subject', '제목') }} <span class="frm-rq">*</span> </label>
          </div>
          <div class="form-conts">
            <input id="ntt-subject" v-model="subject" class="krds-input" type="text" maxlength="200" required />
          </div>
        </div>

        <div class="form-group">
          <div class="form-tit">
            <label for="ntt-content"> {{ t('bbs.content', '내용') }} <span class="frm-rq">*</span> </label>
          </div>
          <div class="form-conts">
            <textarea id="ntt-content" v-model="content" class="krds-input" rows="12" required />
          </div>
        </div>

        <div v-if="maxFiles > 0" class="form-group">
          <div class="form-tit">
            <label for="ntt-files">{{ t('bbs.attach', '첨부파일') }}</label>
          </div>
          <div class="form-conts">
            <input id="ntt-files" class="krds-input" type="file" multiple @change="handleFileChange" />
            <p class="form-hint">
              {{ t('bbs.attachHint', `최대 ${maxFiles}개, 파일당 10MB 까지 첨부할 수 있습니다.`) }}
            </p>
          </div>
        </div>
      </div>

      <div class="krds-panel-body border-top d-flex gap-2">
        <button type="submit" class="krds-btn primary" :disabled="submitting || !subject || !content">
          {{ submitting ? t('com.processing', '처리 중…') : t('com.save', '저장') }}
        </button>
        <button type="button" class="krds-btn tertiary" @click="router.back()">
          {{ t('com.cancel', '취소') }}
        </button>
      </div>
    </form>
  </template>
</template>
