import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppPagination from '../components/AppPagination.vue'
import type { PaginationInfo } from '../api/types'

function makeInfo(overrides: Partial<PaginationInfo> = {}): PaginationInfo {
  return {
    currentPageNo: 2,
    recordCountPerPage: 10,
    pageSize: 10,
    totalRecordCount: 35,
    totalPageCount: 4,
    firstPageNoOnPageList: 1,
    lastPageNoOnPageList: 4,
    firstPageNo: 1,
    lastPageNo: 4,
    ...overrides,
  }
}

describe('AppPagination', () => {
  it('페이지가 하나뿐이면 아무것도 그리지 않는다', () => {
    const wrapper = mount(AppPagination, {
      props: { info: makeInfo({ totalPageCount: 1, lastPageNoOnPageList: 1 }) },
    })
    expect(wrapper.find('nav').exists()).toBe(false)
  })

  it('서버가 준 페이지 범위를 그대로 그린다', () => {
    const wrapper = mount(AppPagination, { props: { info: makeInfo() } })
    // 페이지 버튼 4개 + 이전/다음 2개
    expect(wrapper.findAll('button')).toHaveLength(6)
  })

  it('현재 페이지에 aria-current 를 붙인다', () => {
    const wrapper = mount(AppPagination, { props: { info: makeInfo({ currentPageNo: 3 }) } })
    const currentButton = wrapper.findAll('button').find((b) => b.text() === '3')
    expect(currentButton?.attributes('aria-current')).toBe('page')
  })

  it('첫 페이지에서는 이전 버튼이 비활성화된다', () => {
    const wrapper = mount(AppPagination, { props: { info: makeInfo({ currentPageNo: 1 }) } })
    expect(wrapper.findAll('button')[0].attributes('disabled')).toBeDefined()
  })

  it('마지막 페이지에서는 다음 버튼이 비활성화된다', () => {
    const wrapper = mount(AppPagination, { props: { info: makeInfo({ currentPageNo: 4 }) } })
    const buttons = wrapper.findAll('button')
    expect(buttons[buttons.length - 1].attributes('disabled')).toBeDefined()
  })

  it('페이지 번호를 누르면 change 이벤트로 그 번호를 알린다', async () => {
    const wrapper = mount(AppPagination, { props: { info: makeInfo() } })
    const target = wrapper.findAll('button').find((b) => b.text() === '3')
    await target?.trigger('click')
    expect(wrapper.emitted('change')?.[0]).toEqual([3])
  })

  it('info 가 없으면 아무것도 그리지 않는다', () => {
    const wrapper = mount(AppPagination, { props: { info: null } })
    expect(wrapper.find('nav').exists()).toBe(false)
  })
})
