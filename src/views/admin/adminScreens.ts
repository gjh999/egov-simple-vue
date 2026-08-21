import type { Column, Field } from '../../components/AdminCrudView.vue'
import { boardMasterAdminApi, boardUseAdminApi } from '../../api/admin'
import type { PagedResult } from '../../api/admin'

/**
 * 관리자 화면 정의.
 *
 * 서버 렌더링 판에서 도메인마다 목록·등록·수정·상세 네 개씩 있던 화면을,
 * `AdminCrudView` 골격 위에 컬럼·필드·API 세 가지만 지정해 만든다.
 *
 * `t` 를 인자로 받는 팩토리 형태인 이유는, 언어를 바꿨을 때 컬럼 헤더와 라벨도 함께
 * 바뀌어야 하기 때문이다(모듈 로드 시점에 문구를 고정하면 언어 전환이 반영되지 않는다).
 */

type Translate = (key: string, fallback?: string) => string

export interface AdminScreen<T = Record<string, unknown>> {
  title: string
  caption: string
  columns: Column<T>[]
  rowKey: (row: T) => string
  fetchList: (pageIndex: number, keyword: string) => Promise<PagedResult<T>>
  fields?: Field[]
  toFormValues?: (row: T) => Record<string, string>
  onCreate?: (values: Record<string, string>) => Promise<unknown>
  onUpdate?: (row: T, values: Record<string, string>) => Promise<unknown>
  onDelete?: (row: T) => Promise<unknown>
  searchable?: boolean
  searchPlaceholder?: string
}

/** 사용여부 Y/N 셀렉트 — 여러 화면이 같은 선택지를 쓴다 */
function useAtField(t: Translate): Field {
  return {
    name: 'useAt',
    label: t('bbsMaster.use', '사용여부'),
    type: 'select',
    options: [
      { value: 'Y', label: t('com.yes', '사용') },
      { value: 'N', label: t('com.no', '미사용') },
    ],
  }
}

/** 사용여부 배지 컬럼 */
function useAtColumn<T extends { useAt?: string }>(t: Translate): Column<T> {
  return {
    header: t('bbsMaster.use', '사용'),
    width: '10%',
    value: (row) => (row.useAt === 'Y' ? t('com.yes', '사용') : t('com.no', '미사용')),
    badge: (row) => row.useAt === 'Y',
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export const ADMIN_SCREENS: Record<string, (t: Translate) => AdminScreen<any>> = {
  boardMaster: (t) => ({
    title: t('nav.boardManage', '게시판 관리'),
    caption: t('bbsMaster.listCaption', '게시판 목록 — 게시판명, 유형, 속성, 사용여부, 등록일'),
    rowKey: (row) => row.bbsId,
    columns: [
      { header: t('bbsMaster.name', '게시판명'), alignStart: true, value: (row) => row.bbsNm },
      { header: t('bbsMaster.type', '유형'), width: '14%', value: (row) => row.bbsTyCodeNm },
      { header: t('bbsMaster.attribute', '속성'), width: '14%', value: (row) => row.bbsAttrbCodeNm },
      useAtColumn(t),
      { header: t('bbs.date', '등록일'), width: '14%', value: (row) => row.frstRegisterPnttm ?? '-' },
    ],
    fields: [
      { name: 'bbsNm', label: t('bbsMaster.name', '게시판명'), required: true },
      { name: 'bbsIntrcn', label: t('bbsMaster.intro', '게시판 소개'), type: 'textarea' },
      {
        name: 'bbsTyCode',
        label: t('bbsMaster.type', '유형'),
        type: 'select',
        required: true,
        options: [
          { value: 'BBST01', label: t('bbsMaster.typeNormal', '일반게시판') },
          { value: 'BBST02', label: t('bbsMaster.typeAnonymous', '익명게시판') },
          { value: 'BBST03', label: t('bbsMaster.typeNotice', '공지게시판') },
        ],
      },
      {
        name: 'bbsAttrbCode',
        label: t('bbsMaster.attribute', '속성'),
        type: 'select',
        required: true,
        options: [
          { value: 'BBSA01', label: t('bbsMaster.attrNormal', '일반') },
          { value: 'BBSA02', label: t('bbsMaster.attrGallery', '갤러리') },
          { value: 'BBSA03', label: t('bbsMaster.attrGeneral', '일반게시판') },
        ],
      },
      {
        name: 'fileAtchPosblAt',
        label: t('bbsMaster.fileAttach', '첨부 가능'),
        type: 'select',
        options: [
          { value: 'Y', label: t('com.yes', '예') },
          { value: 'N', label: t('com.no', '아니오') },
        ],
      },
      {
        name: 'posblAtchFileNumber',
        label: t('bbsMaster.fileCount', '첨부 가능 개수'),
        type: 'number',
        hint: t('bbsMaster.fileCountHint', '첨부 가능 여부가 "예"일 때만 의미가 있습니다.'),
      },
      {
        name: 'replyPosblAt',
        label: t('bbsMaster.reply', '답변 가능'),
        type: 'select',
        options: [
          { value: 'Y', label: t('com.yes', '예') },
          { value: 'N', label: t('com.no', '아니오') },
        ],
      },
      useAtField(t),
    ],
    toFormValues: (row) => ({
      bbsNm: row.bbsNm ?? '',
      bbsIntrcn: row.bbsIntrcn ?? '',
      bbsTyCode: row.bbsTyCode ?? '',
      bbsAttrbCode: row.bbsAttrbCode ?? '',
      fileAtchPosblAt: row.fileAtchPosblAt ?? 'N',
      posblAtchFileNumber: String(row.posblAtchFileNumber ?? 0),
      replyPosblAt: row.replyPosblAt ?? 'N',
      useAt: row.useAt ?? 'Y',
    }),
    fetchList: (pageIndex, keyword) => boardMasterAdminApi.list(pageIndex, keyword),
    onCreate: (v) => boardMasterAdminApi.create(v),
    onUpdate: (row, v) => boardMasterAdminApi.update(row.bbsId, v),
    onDelete: (row) => boardMasterAdminApi.remove(row.bbsId),
    searchPlaceholder: t('bbsMaster.searchPlaceholder', '게시판명을 입력하세요'),
  }),

  boardUse: (t) => ({
    title: t('nav.boardUse', '게시판 사용정보'),
    caption: t('boardUse.listCaption', '게시판 사용정보 목록 — 대상, 게시판, 사용여부'),
    rowKey: (row) => `${row.trgetId}-${row.bbsId}`,
    columns: [
      { header: t('boardUse.target', '대상'), width: '28%', value: (row) => row.trgetId },
      { header: t('bbsMaster.name', '게시판명'), alignStart: true, value: (row) => row.bbsNm ?? row.bbsId },
      useAtColumn(t),
    ],
    fields: [
      {
        name: 'trgetId',
        label: t('boardUse.target', '대상 ID'),
        required: true,
        readOnlyOnEdit: true,
        hint: t('boardUse.targetHint', '게시판을 사용할 커뮤니티·동호회 등의 식별자입니다.'),
      },
      { name: 'bbsId', label: t('boardUse.bbsId', '게시판 ID'), required: true, readOnlyOnEdit: true },
      useAtField(t),
    ],
    toFormValues: (row) => ({ trgetId: row.trgetId, bbsId: row.bbsId, useAt: row.useAt ?? 'Y' }),
    fetchList: (pageIndex) => boardUseAdminApi.list(pageIndex),
    onCreate: (v) => boardUseAdminApi.create(v),
    onUpdate: (row, v) => boardUseAdminApi.update(row.bbsId, v),
    searchable: false,
  }),
}
