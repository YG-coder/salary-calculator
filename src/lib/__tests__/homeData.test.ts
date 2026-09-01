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
  HOME_SALARY_ASSUMPTION_TEXT,
  PREFILL_PARAMS,
  buildQuickRowHref,
  resolvePrefill,
  PREFILL_FALLBACK,
  PREFILL_MIN_SALARY,
  PREFILL_MAX_SALARY,
  SITUATION_GROUPS,
  HOME_GUIDES,
} from '@/lib/homeData'
import { CALCULATORS } from '@/app/page'
import { calculateSalary } from '@/lib/salary'
import {
  RATES, TAX_YEAR, TAX_YEAR_AS_OF, MIN_HOURLY_WAGE_2026, getPensionRateForYear,
} from '@/lib/constants'
import { CALCULATOR_ROUTES, ROUTES } from '@/lib/routes'
import { REPRESENTATIVE_SALARY_AMOUNTS_MAN } from '@/components/calculator/SalaryAmountLinks'

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
  const calculatorSource = readFileSync(
    resolve(process.cwd(), 'src/app/salary-calculator/page.tsx'),
    'utf8',
  )
  const detailSource = readFileSync(
    resolve(process.cwd(), 'src/app/salary/[amount]/page.tsx'),
    'utf8',
  )

  it('홈 소스에 /salary/ 링크가 없다', () => {
    // href="/salary/3000" 같은 패턴을 금지한다 (/salary-calculator 등은 허용)
    expect(homeSource).not.toMatch(/href=["'{`]?\/salary\/\d/)
    expect(homeSource).not.toMatch(/["'`]\/salary\/\$\{/)
  })

  it('홈 데이터 계층에도 /salary/ 경로 생성이 없다', () => {
    expect(dataSource).not.toMatch(/\/salary\/\$\{/)
    expect(dataSource).not.toMatch(/["'`]\/salary\/\d/)
  })

  it('두 화면이 같은 대표 연봉 링크 컴포넌트를 사용한다', () => {
    expect(calculatorSource).toContain('<SalaryAmountLinks />')
    expect(detailSource).toContain('<SalaryAmountLinks currentAmountMan={parsed} />')
  })

  it('대표 연봉은 2,000만~1억 1,500만원을 500만원 간격으로 제공한다', () => {
    expect(REPRESENTATIVE_SALARY_AMOUNTS_MAN).toHaveLength(20)
    expect(REPRESENTATIVE_SALARY_AMOUNTS_MAN[0]).toBe(2000)
    expect(REPRESENTATIVE_SALARY_AMOUNTS_MAN.at(-1)).toBe(11500)
    expect(new Set(REPRESENTATIVE_SALARY_AMOUNTS_MAN).size).toBe(20)
    for (let i = 1; i < REPRESENTATIVE_SALARY_AMOUNTS_MAN.length; i++) {
      expect(
        REPRESENTATIVE_SALARY_AMOUNTS_MAN[i] - REPRESENTATIVE_SALARY_AMOUNTS_MAN[i - 1],
      ).toBe(500)
    }
  })

  it('연봉 상세 페이지의 별도 이동은 이전·다음 두 개뿐이다', () => {
    expect(detailSource).not.toContain('relatedAmounts')
    expect(detailSource).not.toContain('다른 연봉 실수령액 보기')
    expect(detailSource.match(/href=\{`\/salary\/\$\{/g)).toHaveLength(2)
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


describe('⑦ ⚠️ 표의 전제가 화면에 전부 표시된다', () => {
  const homeSource = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8')

  it.each([
    ['본인 1명', '본인 1명'],
    ['부양가족 없음', '부양가족 없음'],
    ['자녀 없음', '자녀 없음'],
    ['비과세 월 20만원', '비과세 월 20만원'],
    ['퇴직금 별도', '퇴직금 별도'],
    ['12개월 균등 지급', '12개월 균등 지급'],
  ])('전제 문구에 "%s"가 있다', (_l, needle) => {
    expect(HOME_SALARY_ASSUMPTION_TEXT).toContain(needle)
  })

  it('전제 문구가 홈에서 실제로 렌더링된다', () => {
    expect(homeSource).toContain('HOME_SALARY_ASSUMPTION_TEXT')
  })

  it('"2026년 기준"과 "예상값" 표시가 있다', () => {
    expect(homeSource).toContain('{TAX_YEAR}년 기준')
    expect(homeSource).toContain('예상값')
  })

  it('표 제목이 "예상 월 실수령액"임을 밝힌다', () => {
    expect(homeSource).toContain('연봉별 예상 월 실수령액')
  })

  it('열 제목에 금액 단위(원)가 붙어 있다', () => {
    expect(homeSource).toContain('월 실수령액 (원)')
    expect(homeSource).toContain('월 세전 (원)')
  })

  it('⚠️ 전제 문구의 비과세 금액이 실제 계산 전제와 일치한다', () => {
    const man = HOME_SALARY_ASSUMPTION.nonTaxable / 10_000
    expect(HOME_SALARY_ASSUMPTION_TEXT).toContain(`비과세 월 ${man}만원`)
  })
})

describe('⑧ ⚠️ 행 클릭 시 계산기 결과가 홈 숫자와 일치한다', () => {
  it('링크가 /salary-calculator 로 가고 /salary/[amount] 가 아니다', () => {
    for (const r of buildSalaryQuickRows()) {
      const href = buildQuickRowHref(r.annualSalary)
      expect(href.startsWith('/salary-calculator?')).toBe(true)
      expect(href).not.toMatch(/\/salary\/\d/)
    }
  })

  it('링크가 연봉·비과세·부양가족·자녀를 모두 넘긴다', () => {
    const href = buildQuickRowHref(50_000_000)
    const q = new URLSearchParams(href.split('?')[1])
    expect(q.get(PREFILL_PARAMS.salary)).toBe('50000000')
    expect(q.get(PREFILL_PARAMS.nonTaxable)).toBe(String(HOME_SALARY_ASSUMPTION.nonTaxable))
    expect(q.get(PREFILL_PARAMS.dependents)).toBe(String(HOME_SALARY_ASSUMPTION.dependents))
    expect(q.get(PREFILL_PARAMS.children)).toBe(String(HOME_SALARY_ASSUMPTION.childCount8to20))
  })

  it('⚠️ 넘긴 조건으로 계산하면 홈 표의 값이 그대로 재현된다', () => {
    for (const row of buildSalaryQuickRows()) {
      const q = new URLSearchParams(buildQuickRowHref(row.annualSalary).split('?')[1])
      const reproduced = calculateSalary(
        {
          annualSalary: Number(q.get(PREFILL_PARAMS.salary)),
          nonTaxable: Number(q.get(PREFILL_PARAMS.nonTaxable)),
          dependents: Number(q.get(PREFILL_PARAMS.dependents)),
          childCount8to20: Number(q.get(PREFILL_PARAMS.children)),
        },
        TAX_YEAR_AS_OF,
      )
      expect(reproduced.monthlyNet).toBe(row.monthlyNet)
      expect(reproduced.monthlyGross).toBe(row.monthlyGross)
    }
  })

  it('⚠️ 연봉만 넘기면 계산기 기본값(비과세 0)과 어긋난다 — 전제를 함께 넘겨야 하는 이유', () => {
    const row = buildSalaryQuickRows().find((r) => r.annualMan === 5_000)!
    const salaryOnly = calculateSalary(
      { annualSalary: row.annualSalary, nonTaxable: 0, dependents: 1, childCount8to20: 0 },
      TAX_YEAR_AS_OF,
    )
    expect(salaryOnly.monthlyNet).not.toBe(row.monthlyNet)
  })

  it('계산기 폼이 프리필을 실제로 읽고 검증 함수를 거친다', () => {
    const form = readFileSync(
      resolve(process.cwd(), 'src/components/calculator/CalculatorForm.tsx'), 'utf8',
    )
    expect(form).toContain('useSearchParams')
    expect(form).toContain('resolvePrefill')
    expect(form).toContain('PREFILL_FALLBACK')
  })
})


// ── 쿼리값 방어 ─────────────────────────────────────────────
function q(params: Record<string, string>) {
  const sp = new URLSearchParams(params)
  return (key: string) => sp.get(key)
}

describe('⑨ ⚠️ 잘못된 쿼리값은 억지 보정이 아니라 기본값으로 복구된다', () => {
  it('정상 홈 링크 5개는 그대로 적용된다', () => {
    for (const row of buildSalaryQuickRows()) {
      const sp = new URLSearchParams(buildQuickRowHref(row.annualSalary).split('?')[1])
      const p = resolvePrefill((k) => sp.get(k))!
      expect(p).not.toBeNull()
      expect(p.annualSalary).toBe(row.annualSalary.toLocaleString('ko-KR'))
      expect(p.nonTaxable).toBe(HOME_SALARY_ASSUMPTION.nonTaxable.toLocaleString('ko-KR'))
      expect(p.dependents).toBe(String(HOME_SALARY_ASSUMPTION.dependents))
      expect(p.children).toBe(String(HOME_SALARY_ASSUMPTION.childCount8to20))
    }
  })

  it.each([
    ['문자열', 'abc'],
    ['0', '0'],
    ['음수', '-5000'],
    ['빈 값', ''],
    ['범위 초과', String(PREFILL_MAX_SALARY + 1)],
    ['최소 미만', String(PREFILL_MIN_SALARY - 1)],
    ['지수 표기', '1e9'],
    ['아주 긴 숫자', '9'.repeat(30)],
  ])('연봉이 %s이면 프리필하지 않는다 (계산기 기본 화면)', (_l, salary) => {
    expect(resolvePrefill(q({ salary }))).toBeNull()
  })

  it('연봉 파라미터가 아예 없으면 프리필하지 않는다', () => {
    expect(resolvePrefill(q({}))).toBeNull()
    expect(resolvePrefill(q({ nonTaxable: '200000', dependents: '3' }))).toBeNull()
  })

  it.each([
    ['99', PREFILL_FALLBACK.dependents],
    ['0', PREFILL_FALLBACK.dependents],
    ['-3', PREFILL_FALLBACK.dependents],
    ['abc', PREFILL_FALLBACK.dependents],
    ['11', PREFILL_FALLBACK.dependents],
    ['3', '3'],
    ['10', '10'],
  ])('dependents=%s → %s (10으로 클램프하지 않는다)', (dep, expected) => {
    const p = resolvePrefill(q({ salary: '50000000', dependents: dep }))!
    expect(p.dependents).toBe(expected)
  })

  it('비과세가 월 세전 급여보다 크면 기본값으로 되돌린다', () => {
    // 연봉 5,000만원 → 월 4,166,666원. 그보다 큰 비과세는 불가능하다.
    const p = resolvePrefill(q({ salary: '50000000', nonTaxable: '9000000' }))!
    expect(p.nonTaxable).toBe(PREFILL_FALLBACK.nonTaxable)
  })

  it.each([['음수', '-100000'], ['문자열', 'abc']])(
    '비과세가 %s이면 기본값',
    (_l, nt) => {
      const p = resolvePrefill(q({ salary: '50000000', nonTaxable: nt }))!
      expect(p.nonTaxable).toBe(PREFILL_FALLBACK.nonTaxable)
    },
  )

  it('비과세가 월 세전 이하면 그대로 적용된다', () => {
    const p = resolvePrefill(q({ salary: '50000000', nonTaxable: '200000' }))!
    expect(p.nonTaxable).toBe('200,000')
  })

  it('자녀 수가 부양가족 수를 넘으면 기본값 0으로 되돌린다', () => {
    const p = resolvePrefill(q({ salary: '50000000', dependents: '2', children: '5' }))!
    expect(p.children).toBe(PREFILL_FALLBACK.children)
  })

  it('자녀 수는 최대 부양가족-1까지 허용된다 (본인 제외)', () => {
    expect(resolvePrefill(q({ salary: '50000000', dependents: '3', children: '2' }))!.children).toBe('2')
    expect(resolvePrefill(q({ salary: '50000000', dependents: '3', children: '3' }))!.children).toBe('0')
  })

  it('누락된 값은 계산기 기본값이 된다', () => {
    const p = resolvePrefill(q({ salary: '50000000' }))!
    expect(p.nonTaxable).toBe(PREFILL_FALLBACK.nonTaxable)
    expect(p.dependents).toBe(PREFILL_FALLBACK.dependents)
    expect(p.children).toBe(PREFILL_FALLBACK.children)
  })

  it('⚠️ 어떤 입력에도 NaN·undefined가 새어나가지 않는다', () => {
    const nasty = ['abc', '', '-1', '0', 'NaN', 'Infinity', '1e999', '9'.repeat(40), '１２３']
    for (const salary of [...nasty, '50000000']) {
      for (const other of nasty) {
        const p = resolvePrefill(q({ salary, nonTaxable: other, dependents: other, children: other }))
        if (p === null) continue
        for (const v of Object.values(p)) {
          expect(typeof v).toBe('string')
          expect(v).not.toContain('NaN')
          expect(v).not.toContain('undefined')
        }
      }
    }
  })
})

describe('⑩ 세금계산기 링크가 푸터에 한 번만 있다', () => {
  it('홈에는 taxsim 링크가 없다', () => {
    const home = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8')
    expect(home).not.toContain('taxsim')
  })

  it('푸터에 정확히 한 번 있다', () => {
    const footer = readFileSync(resolve(process.cwd(), 'src/components/ui/Footer.tsx'), 'utf8')
    expect((footer.match(/taxsim\.kr/g) ?? []).length).toBe(1)
  })

  it('실수령액 계산기의 문맥 링크는 유지된다', () => {
    const page = readFileSync(resolve(process.cwd(), 'src/app/salary-calculator/page.tsx'), 'utf8')
    expect((page.match(/taxsim\.kr/g) ?? []).length).toBe(1)
  })
})

describe('⑪ /salary-calculator canonical', () => {
  const page = readFileSync(resolve(process.cwd(), 'src/app/salary-calculator/page.tsx'), 'utf8')

  it('명시적 canonical이 있다', () => {
    expect(page).toContain('alternates:')
    expect(page).toContain('canonical:')
  })

  it('SITE_URL 기반이며 URL을 하드코딩하지 않는다 (퓨니코드 표기 통일)', () => {
    expect(page).toContain('`${SITE_URL}${PATH}`')
    expect(page).not.toMatch(/canonical:\s*['"]https/)
  })
})


describe('⑫ 접근성·모바일 열 구성', () => {
  const home = readFileSync(resolve(process.cwd(), 'src/app/page.tsx'), 'utf8')

  it('연봉 링크에 목적을 밝히는 aria-label이 있다', () => {
    expect(home).toContain('aria-label')
    expect(home).toContain('으로 실수령액 계산하기')
  })

  it('표시 라벨과 aria-label이 같은 함수를 쓴다 (문구 갈라짐 방지)', () => {
    expect(home).toContain('function quickRowLabel')
    expect((home.match(/quickRowLabel\(/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('⚠️ 모바일에서 월 공제·실수령률만 숨긴다 (핵심 3열은 항상 표시)', () => {
    // hidden sm:table-cell 이 정확히 4번 (헤더 2 + 셀 2)
    expect((home.match(/hidden sm:table-cell/g) ?? []).length).toBe(4)
    // 핵심 3열(연봉·월 세전·월 실수령액)에는 hidden이 붙으면 안 된다.
    // 해당 열 자신의 <th ...> 여는 태그를 본다 (뒤를 보면 다음 열이 잡힌다).
    const thOf = (label: string) => {
      const end = home.indexOf(label)
      const start = home.lastIndexOf('<th', end)
      return home.slice(start, end)
    }
    for (const label of ['연봉</th>', '월 세전 (원)', '월 실수령액 (원)']) {
      expect(thOf(label)).not.toContain('hidden sm:table-cell')
    }
    for (const label of ['월 공제 (원)', '실수령률']) {
      expect(thOf(label)).toContain('hidden sm:table-cell')
    }
  })

  it('연봉·금액 셀에 whitespace-nowrap이 적용되어 줄바꿈되지 않는다', () => {
    expect((home.match(/whitespace-nowrap/g) ?? []).length).toBeGreaterThanOrEqual(7)
  })
})
