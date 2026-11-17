// 연봉 실수령액 표(/salary-table) 회귀 테스트
//
// ① 표의 연봉 목록·조건·금액이 연봉별 상세 페이지와 같은 원본에서 나오는지
// ② 엔진끼리의 일치만 보지 않도록, 손으로 계산한 독립 기대값과도 대조
// ③ 화면: 상세 링크, 조건 문구, 표 머리글, 내부 식별자 미노출
// ④ 사이트맵·진입 링크·공유 메타데이터

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  SALARY_TABLE_CONDITION_ITEMS,
  buildSalaryTableRows,
  salaryTableLabel,
} from '../salaryTable'
import {
  SALARY_AMOUNTS_MAN,
  SALARY_PAGE_CONDITIONS,
  buildSalaryPageData,
  isValidSalaryMan,
} from '../salaryPageData'
import { calculateSalary } from '../salary'
import { REFERENCE_ROUTES, ROUTES } from '../routes'
import { SITE } from '../site'
import sitemap from '@/app/sitemap'
import Page, { metadata } from '@/app/salary-table/page'
import { identifiers, uiHarness, visibleCopy } from '../uiHarness.test-support'

const rows = buildSalaryTableRows()

describe('표 데이터는 연봉별 상세 페이지와 같은 원본을 쓴다', () => {
  it('연봉 목록이 상세 페이지 목록과 같다 (2,000만~1억 5,000만원, 500만원 간격)', () => {
    expect(rows.map((row) => row.amountMan)).toEqual(SALARY_AMOUNTS_MAN)
    expect(rows).toHaveLength(27)
    expect(rows[0].amountMan).toBe(2000)
    expect(rows.at(-1)!.amountMan).toBe(15000)
  })

  it.each(rows.map((row) => [row.amountMan, row] as const))('연봉 %i만원: 상세 페이지·계산기와 금액이 같다', (amountMan, row) => {
    const detail = buildSalaryPageData(amountMan).result
    expect(row.monthlyGross).toBe(detail.monthlyGross)
    expect(row.monthlyDeduction).toBe(detail.breakdown.totalDeduction)
    expect(row.monthlyNet).toBe(detail.monthlyNet)

    // 실수령액 계산기에 같은 조건을 넣은 결과
    const calculator = calculateSalary({ annualSalary: amountMan * 10_000, nonTaxable: 0, dependents: 1, childCount8to20: 0, withholdingPercentage: 100 })
    expect(row.monthlyNet).toBe(calculator.monthlyNet)
    expect(row.monthlyDeduction).toBe(calculator.breakdown.totalDeduction)

    expect(row.annualSalary).toBe(amountMan * 10_000)
    expect(row.monthlyGross - row.monthlyDeduction).toBe(row.monthlyNet)
    expect(row.href).toBe(`/salary/${amountMan}`)
    expect(isValidSalaryMan(amountMan)).toBe(true)
  })

  it('연봉 표시는 1억원 이상을 억 단위로 읽는다', () => {
    expect(salaryTableLabel(2000)).toBe('2,000만원')
    expect(salaryTableLabel(9500)).toBe('9,500만원')
    expect(salaryTableLabel(10000)).toBe('1억원')
    expect(salaryTableLabel(10500)).toBe('1억 500만원')
    expect(salaryTableLabel(15000)).toBe('1억 5,000만원')
  })

  it('고정 조건은 비과세 0원·가족 1명·자녀 0명·원천징수 100%이다', () => {
    expect(SALARY_PAGE_CONDITIONS).toEqual({ nonTaxable: 0, dependents: 1, childCount8to20: 0, withholdingPercentage: 100 })
    expect(SALARY_TABLE_CONDITION_ITEMS).toEqual([
      '월 비과세 0원',
      '공제대상가족 1명 (본인 포함)',
      '8세 이상 20세 이하 자녀 0명',
      '소득세 원천징수 비율 100%',
    ])
  })
})

describe('손으로 계산한 독립 기대값 (2026년 7~12월 기준)', () => {
  // 구현 출력을 복사한 값이 아니다. 요율과 공식 간이세액표 값으로 직접 계산했다.
  // 국민연금 4.75%, 건강보험 3.595%, 장기요양 = 건강보험료 × 9,448/71,900,
  // 고용보험 0.9%, 지방소득세 = 소득세의 10%, 각 10원 미만 절사.
  it('연봉 6,000만원: 월 500만원', () => {
    // 국민연금 237,500 / 건강 179,750 / 장기요양 23,620 / 고용 45,000
    // 소득세 335,470 (간이세액표 5,000~5,020천원·1명) / 지방소득세 33,540
    const row = rows.find((item) => item.amountMan === 6000)!
    expect(row.monthlyGross).toBe(5_000_000)
    expect(row.monthlyDeduction).toBe(854_880)
    expect(row.monthlyNet).toBe(4_145_120)
  })

  it('연봉 1억 2,000만원: 월 1,000만원 (국민연금 상한 적용)', () => {
    // 국민연금 313,020 (기준소득월액 상한 659만원) / 건강 359,500 / 장기요양 47,240
    // 고용 90,000 / 소득세 1,507,400 (간이세액표 10,000천원·1명) / 지방소득세 150,740
    const row = rows.find((item) => item.amountMan === 12000)!
    expect(row.monthlyGross).toBe(10_000_000)
    expect(row.monthlyDeduction).toBe(2_467_900)
    expect(row.monthlyNet).toBe(7_532_100)
  })
})

describe('화면', () => {
  const html = uiHarness(Page).html()
  const copy = visibleCopy(html)

  it('모든 연봉이 상세 페이지 링크와 금액으로 표시된다', () => {
    for (const row of rows) {
      expect(html).toContain(`href="${row.href}"`)
      expect(copy).toContain(row.label)
      expect(copy).toContain(row.monthlyNet.toLocaleString('ko-KR'))
      expect(copy).toContain(row.monthlyGross.toLocaleString('ko-KR'))
      expect(copy).toContain(row.monthlyDeduction.toLocaleString('ko-KR'))
    }
    expect([...html.matchAll(/href="\/salary\/\d+"/g)]).toHaveLength(rows.length)
  })

  it('표 제목·열 머리글·행 머리글을 제공한다', () => {
    // 공통 layout이 main을 제공하므로 페이지에서 중첩된 본문 랜드마크를 만들지 않는다.
    expect(html).not.toMatch(/<main\b/)
    expect(html).toContain('<caption')
    for (const heading of ['연봉', '월 실수령액', '월 세전 급여', '월 총 공제액']) {
      expect(html).toMatch(new RegExp(`<th scope="col"[^>]*>${heading}</th>`))
    }
    expect([...html.matchAll(/<th scope="row"/g)]).toHaveLength(rows.length)
  })

  it('기준 기간·계산 조건·참고표 안내와 계산기 링크를 표시한다', () => {
    expect(copy).toContain('2026년 7~12월 기준')
    for (const item of SALARY_TABLE_CONDITION_ITEMS) expect(copy).toContain(item)
    expect(copy).toContain('참고표')
    expect(html).toContain(`href="${ROUTES.SALARY_CALCULATOR}"`)
  })

  it('내부 식별자를 노출하지 않고 입력폼을 두지 않는다', () => {
    expect(identifiers(copy)).toEqual([])
    expect(html).not.toMatch(/<(?:input|select|form)\b/)
  })
})

describe('사이트맵·진입 경로·공유 메타데이터', () => {
  it('사이트맵에 표가 한 번 들어가고 연봉별 상세 페이지 정책은 그대로다', () => {
    const urls = sitemap().map((entry) => entry.url)
    expect(REFERENCE_ROUTES).toContain(ROUTES.SALARY_TABLE)
    expect(urls.filter((url) => url === `${SITE.url}${ROUTES.SALARY_TABLE}`)).toHaveLength(1)
    expect(urls.filter((url) => /\/salary\/\d/.test(url))).toEqual([])
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('홈과 대표 연봉 링크 영역에서 표로 갈 수 있다', () => {
    const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')
    expect(read('src/app/page.tsx')).toContain('href={ROUTES.SALARY_TABLE}')
    expect(read('src/components/calculator/SalaryAmountLinks.tsx')).toContain('href={ROUTES.SALARY_TABLE}')
  })

  it('canonical·공유 주소가 기준 주소이고 공유 이미지와 큰 카드가 있다', () => {
    const expected = `${SITE.url}${ROUTES.SALARY_TABLE}`
    // 사이트명은 공통 layout의 title template에서 한 번만 붙인다.
    expect(metadata.title).toBe('2026년 연봉 실수령액 표')
    expect(/^[\x00-\x7f]+$/.test(expected)).toBe(true)
    expect(metadata.alternates?.canonical).toBe(expected)
    const openGraph = metadata.openGraph as { url?: string; images?: unknown[] }
    expect(openGraph.url).toBe(expected)
    expect(openGraph.images?.length).toBeGreaterThan(0)
    const twitter = metadata.twitter as { card?: string; images?: unknown[] }
    expect(twitter.card).toBe('summary_large_image')
    expect(twitter.images?.length).toBeGreaterThan(0)
  })
})
