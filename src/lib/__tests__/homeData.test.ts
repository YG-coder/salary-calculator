// src/lib/__tests__/homeData.test.ts
// 홈 화면 데이터 회귀 테스트
//
// 두 가지를 강제한다.
//  ① 홈에 표시되는 숫자가 계산 엔진과 어긋나지 않을 것 (라벨만 낡는 사고 방지)
//  ② /salary/[amount] 로 링크하지 않을 것 (sitemap 제외 보류 사항 우회 방지)

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  buildSalaryQuickRows,
  buildKeyFigures,
  HOME_SALARY_SAMPLES_MAN,
  HOME_SALARY_ASSUMPTION,
  SITUATION_GROUPS,
  HOME_GUIDES,
} from '@/lib/homeData'
import { CALCULATORS } from '@/app/page'
import { calculateSalary } from '@/lib/salary'
import {
  RATES, TAX_YEAR, TAX_YEAR_AS_OF, MIN_HOURLY_WAGE_2026, getPensionRateForYear,
} from '@/lib/constants'
import { CALCULATOR_ROUTES, ROUTES } from '@/lib/routes'

describe('① 연봉별 빠른 표가 계산 엔진과 일치한다', () => {
  it.each(HOME_SALARY_SAMPLES_MAN.map((m) => [m]))(
    '연봉 %i만원 행이 calculateSalary()와 같다',
    (man) => {
      const row = buildSalaryQuickRows().find((r) => r.annualMan === man)!
      const expected = calculateSalary(
        {
          annualSalary: man * 10_000,
          nonTaxable: HOME_SALARY_ASSUMPTION.nonTaxable,
          dependents: HOME_SALARY_ASSUMPTION.dependents,
          childCount8to20: HOME_SALARY_ASSUMPTION.childCount8to20,
        },
        TAX_YEAR_AS_OF,
      )
      expect(row.monthlyGross).toBe(expected.monthlyGross)
      expect(row.monthlyNet).toBe(expected.monthlyNet)
      expect(row.monthlyDeduction).toBe(expected.breakdown.totalDeduction)
    },
  )

  it('행 안에서 세전 = 실수령 + 공제가 성립한다', () => {
    for (const r of buildSalaryQuickRows()) {
      expect(r.monthlyGross).toBe(r.monthlyNet + r.monthlyDeduction)
    }
  })

  it('연봉이 오를수록 실수령률이 낮아진다 (표시 구간 기준)', () => {
    const rows = buildSalaryQuickRows()
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].netRate).toBeLessThan(rows[i - 1].netRate)
    }
  })

  it('5개 구간이 오름차순으로 정의되어 있다', () => {
    expect(HOME_SALARY_SAMPLES_MAN).toHaveLength(5)
    for (let i = 1; i < HOME_SALARY_SAMPLES_MAN.length; i++) {
      expect(HOME_SALARY_SAMPLES_MAN[i]).toBeGreaterThan(HOME_SALARY_SAMPLES_MAN[i - 1])
    }
  })
})

describe('② ⚠️ /salary/[amount] 로 링크하지 않는다 (sitemap 제외 보류 사항)', () => {
  const homeSource = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8')
  const dataSource = readFileSync(resolve(process.cwd(), 'src/lib/homeData.ts'), 'utf8')

  it('홈 소스에 /salary/ 링크가 없다', () => {
    // href="/salary/3000" 같은 패턴을 금지한다 (/salary-calculator 등은 허용)
    expect(homeSource).not.toMatch(/href=["'{`]?\/salary\/\d/)
    expect(homeSource).not.toMatch(/["'`]\/salary\/\$\{/)
  })

  it('홈 데이터 계층에도 /salary/ 경로 생성이 없다', () => {
    expect(dataSource).not.toMatch(/\/salary\/\$\{/)
    expect(dataSource).not.toMatch(/["'`]\/salary\/\d/)
  })

  it('빠른 표 데이터에 링크 필드가 없다', () => {
    for (const r of buildSalaryQuickRows()) {
      expect(Object.keys(r)).not.toContain('href')
    }
  })
})

describe('③ 주요 기준 숫자가 상수에서 생성된다', () => {
  const figures = buildKeyFigures(TAX_YEAR)

  it('6개 항목이 있다', () => {
    expect(figures).toHaveLength(6)
  })

  it('국민연금 요율이 계산 요율과 일치한다', () => {
    const pension = figures.find((f) => f.label === '국민연금')!
    expect(pension.value).toBe(`${(getPensionRateForYear(TAX_YEAR) * 100).toFixed(2)}%`)
  })

  it('건강보험·고용보험 요율이 RATES와 일치한다', () => {
    expect(figures.find((f) => f.label === '건강보험')!.value)
      .toBe(`${(RATES.healthInsurance * 100).toFixed(3)}%`)
    expect(figures.find((f) => f.label === '고용보험 (근로자)')!.value)
      .toBe(`${(RATES.employment * 100).toFixed(1)}%`)
  })

  it('최저임금이 상수와 일치한다', () => {
    expect(figures.find((f) => f.label.includes('최저임금'))!.value)
      .toBe(`${MIN_HOURLY_WAGE_2026.toLocaleString('ko-KR')}원`)
  })

  it('⚠️ 요율 문자열이 소스에 하드코딩되어 있지 않다', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/lib/homeData.ts'), 'utf8')
    // 4.75%, 3.595% 같은 고정 요율 문자열 금지
    expect(src).not.toMatch(/['"`]\d\.\d{2,3}%['"`]/)
  })
})

describe('④ 상황별 분류', () => {
  it('4개 분류이며 빈 분류가 없다', () => {
    expect(SITUATION_GROUPS).toHaveLength(4)
    for (const g of SITUATION_GROUPS) {
      expect(g.items.length).toBeGreaterThan(0)
    }
  })

  it('⚠️ 존재하지 않는 계산기를 가리키지 않는다', () => {
    const known = Object.values(ROUTES) as string[]
    for (const g of SITUATION_GROUPS) {
      for (const item of g.items) {
        expect(known).toContain(item.href)
      }
    }
  })

  it('한 분류 안에 같은 계산기가 중복되지 않는다', () => {
    for (const g of SITUATION_GROUPS) {
      const hrefs = g.items.map((i) => i.href)
      expect(new Set(hrefs).size).toBe(hrefs.length)
    }
  })

  it('각 분류의 질문이 서로 다르다', () => {
    const qs = SITUATION_GROUPS.map((g) => g.question)
    expect(new Set(qs).size).toBe(SITUATION_GROUPS.length)
  })
})

describe('⑤ 홈이 전체 계산기를 빠짐없이 노출한다', () => {
  it('홈 카드가 CALCULATOR_ROUTES 전부를 담는다', () => {
    const hrefs = CALCULATORS.map((c) => c.href)
    for (const route of CALCULATOR_ROUTES) {
      expect(hrefs).toContain(route)
    }
    expect(hrefs).toHaveLength(CALCULATOR_ROUTES.length)
  })
})

describe('⑥ 가이드', () => {
  it('4개이며 모두 실제 계산기로 연결된다', () => {
    const known = Object.values(ROUTES) as string[]
    expect(HOME_GUIDES).toHaveLength(4)
    for (const g of HOME_GUIDES) {
      expect(known).toContain(g.href)
      expect(g.a.length).toBeGreaterThan(40)
    }
  })
})
