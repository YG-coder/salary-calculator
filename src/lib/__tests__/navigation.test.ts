// src/lib/__tests__/navigation.test.ts
// 내비게이션 구조 회귀 테스트
//
// 배경: 계산기 페이지를 만들고 라우트만 등록해 두면 sitemap에는 들어가지만
// 사이트 안에서 클릭으로 도달할 경로가 없다. 실제로 /target-salary-calculator가
// 헤더·푸터·홈 어디에도 없이 배포되어 있었고, /salary-comparison-calculator도
// 같은 상태로 한 번 배포됐다. 사람이 기억하는 대신 여기서 강제한다.

import { describe, it, expect } from 'vitest'
import { CALCULATOR_ROUTES, ROUTES } from '@/lib/routes'
import { NAV_ITEMS, MORE_ITEMS } from '@/components/ui/Header'
import { CALC_LINKS } from '@/components/ui/Footer'
import { CALCULATORS } from '@/app/page'
import { SALARY_TOOLS } from '@/components/calculator/ToolPicker'

const headerHrefs = [...NAV_ITEMS, ...MORE_ITEMS].map((i) => i.href)
const footerHrefs = CALC_LINKS.map((i) => i.href)
const homeHrefs = CALCULATORS.map((c) => c.href)

describe('모든 계산기 라우트에 진입 경로가 있다', () => {
  it.each(CALCULATOR_ROUTES.map((r) => [r]))('%s — 헤더(상단+더보기)에 있다', (route) => {
    expect(headerHrefs).toContain(route)
  })

  it.each(CALCULATOR_ROUTES.map((r) => [r]))('%s — 푸터에 있다', (route) => {
    expect(footerHrefs).toContain(route)
  })

  it.each(CALCULATOR_ROUTES.map((r) => [r]))('%s — 홈 계산기 카드에 있다', (route) => {
    expect(homeHrefs).toContain(route)
  })
})

describe('내비게이션에 존재하지 않는 경로가 없다', () => {
  const knownRoutes = Object.values(ROUTES) as string[]

  it.each([
    ['헤더', headerHrefs],
    ['푸터', footerHrefs],
    ['홈 카드', homeHrefs],
  ])('%s의 모든 링크가 ROUTES에 정의되어 있다', (_label, hrefs) => {
    for (const href of hrefs) {
      expect(knownRoutes).toContain(href)
    }
  })
})

describe('중복 링크가 없다', () => {
  it.each([
    // 데스크톱 직접 링크는 모바일에서 숨겨지므로, 모바일 드롭다운에도 같은
    // 계산기가 있어야 한다. 두 영역을 합친 배열의 중복은 의도적이며,
    // 각 영역 안에서의 중복만 금지한다.
    ['헤더 직접 링크', NAV_ITEMS.map((item) => item.href)],
    ['헤더 계산기 메뉴', MORE_ITEMS.map((item) => item.href)],
    ['푸터', footerHrefs],
    ['홈 카드', homeHrefs],
  ])('%s에 같은 경로가 두 번 들어가지 않는다', (_label, hrefs) => {
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})

describe('연봉 계산기 3종 역할 구분 (ToolPicker)', () => {
  it('세 도구가 모두 정의되어 있다', () => {
    expect(SALARY_TOOLS.map((t) => t.key).sort()).toEqual(['comparison', 'forward', 'reverse'])
  })

  it('세 도구의 경로가 실제 라우트와 일치한다', () => {
    const byKey = Object.fromEntries(SALARY_TOOLS.map((t) => [t.key, t.href]))
    expect(byKey.forward).toBe(ROUTES.SALARY_CALCULATOR)
    expect(byKey.comparison).toBe(ROUTES.SALARY_COMPARISON_CALCULATOR)
    expect(byKey.reverse).toBe(ROUTES.TARGET_SALARY_CALCULATOR)
  })

  it('각 도구가 답하는 질문이 서로 다르다', () => {
    const questions = SALARY_TOOLS.map((t) => t.question)
    expect(new Set(questions).size).toBe(3)
  })

  it('비교·역산의 역할 설명이 로드맵 정의와 맞다', () => {
    const byKey = Object.fromEntries(SALARY_TOOLS.map((t) => [t.key, t]))
    // 비교: 연봉이 바뀌면 실수령액이 얼마나 달라지는가
    expect(byKey.comparison.question).toContain('연봉이 바뀌면')
    expect(byKey.comparison.question).toContain('실수령액')
    // 역산: 원하는 실수령액을 받으려면 연봉이 얼마여야 하는가
    expect(byKey.reverse.question).toContain('원하는 실수령액')
    expect(byKey.reverse.question).toContain('연봉이 얼마')
  })
})
