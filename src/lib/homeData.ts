// src/lib/homeData.ts
// ────────────────────────────────────────────────────────────
// 홈 화면 데이터 계층.
//
// ⚠️ 숫자를 하드코딩하지 않는다. 요율·최저임금은 정책 상수에서, 실수령액은
//    공통 계산 엔진에서 생성한다. 그래야 요율이 바뀔 때 홈이 조용히 낡지 않는다.
//    (국민연금 요율 라벨이 계산과 어긋났던 전례가 있다)
// ────────────────────────────────────────────────────────────

import { calculateSalary } from './salary'
import {
  RATES, TAX_YEAR, TAX_YEAR_AS_OF, MIN_HOURLY_WAGE_2026,
  getPensionRateForYear, getPensionLimits,
} from './constants'
import { ROUTES } from './routes'

// ── 연봉별 실수령액 빠른 표 ─────────────────────────────────
/**
 * 홈에 표시할 대표 연봉 구간 (만원).
 *
 * ⚠️ `/salary/[amount]` 페이지로 **링크하지 않는다.** 그 27개 페이지는 AdSense
 *    doorway 우려로 sitemap에서 제외된 상태이며(src/app/sitemap.ts 참고),
 *    홈에서 강한 내부 링크를 만들면 그 취지를 우회하게 된다.
 *    여기서는 홈 자체 콘텐츠로 숫자만 보여주고, 클릭은 실수령액 계산기로 보낸다.
 */
export const HOME_SALARY_SAMPLES_MAN = [3_000, 4_000, 5_000, 6_000, 10_000] as const

/** 빠른 표의 가정 — 화면에 함께 표시해 오해를 막는다 */
export const HOME_SALARY_ASSUMPTION = {
  nonTaxable: 200_000,
  dependents: 1,
  childCount8to20: 0,
} as const

export interface SalaryQuickRow {
  /** 연봉 (만원) */
  annualMan: number
  /** 연봉 (원) */
  annualSalary: number
  /** 월 세전 */
  monthlyGross: number
  /** 월 실수령액 */
  monthlyNet: number
  /** 월 공제 합계 */
  monthlyDeduction: number
  /** 실수령률 (연 실수령 ÷ 연봉) */
  netRate: number
}

/** 빠른 표 행을 공통 계산 엔진으로 생성한다. */
export function buildSalaryQuickRows(asOfDate: Date = TAX_YEAR_AS_OF): SalaryQuickRow[] {
  return HOME_SALARY_SAMPLES_MAN.map((man) => {
    const annualSalary = man * 10_000
    const r = calculateSalary(
      {
        annualSalary,
        nonTaxable: HOME_SALARY_ASSUMPTION.nonTaxable,
        dependents: HOME_SALARY_ASSUMPTION.dependents,
        childCount8to20: HOME_SALARY_ASSUMPTION.childCount8to20,
      },
      asOfDate,
    )
    return {
      annualMan: man,
      annualSalary,
      monthlyGross: r.monthlyGross,
      monthlyNet: r.monthlyNet,
      monthlyDeduction: r.breakdown.totalDeduction,
      netRate: r.annualNet / annualSalary,
    }
  })
}

// ── 2026년 주요 기준 ────────────────────────────────────────
export interface KeyFigure {
  label: string
  value: string
  note: string
}

/** 요율·금액을 상수에서 생성한다. 문자열에 숫자를 직접 쓰지 않는다. */
export function buildKeyFigures(year: number = TAX_YEAR): KeyFigure[] {
  const pensionRate = getPensionRateForYear(year)
  const limits = getPensionLimits(TAX_YEAR_AS_OF)
  return [
    {
      label: '최저임금 (시급)',
      value: `${MIN_HOURLY_WAGE_2026.toLocaleString('ko-KR')}원`,
      note: `월 환산 ${Math.floor(MIN_HOURLY_WAGE_2026 * 209).toLocaleString('ko-KR')}원 (209시간)`,
    },
    {
      label: '국민연금',
      value: `${(pensionRate * 100).toFixed(2)}%`,
      note: `근로자·사업주 각각 · 기준소득월액 상한 ${Math.floor(limits.max / 10_000).toLocaleString('ko-KR')}만원`,
    },
    {
      label: '건강보험',
      value: `${(RATES.healthInsurance * 100).toFixed(3)}%`,
      note: `근로자·사업주 각각 · 장기요양은 건강보험료의 ${(RATES.longTermCare * 100).toFixed(2)}%`,
    },
    {
      label: '고용보험 (근로자)',
      value: `${(RATES.employment * 100).toFixed(1)}%`,
      note: '사업주는 고용안정·직업능력개발분을 추가 부담',
    },
    {
      label: '비과세 식대',
      value: '월 20만원',
      note: '소득세법 시행령 제17조의2 — 4대보험·소득세 산정에서 제외',
    },
    {
      label: '소득세',
      value: '간이세액표',
      note: '소득세법 시행령 별표2 조견표 조회 · 부양가족·자녀 수 반영',
    },
  ]
}

// ── 상황별 계산기 ───────────────────────────────────────────
export interface SituationGroup {
  key: string
  emoji: string
  title: string
  /** 이 상황에 있는 사람이 던지는 질문 */
  question: string
  items: { href: string; label: string }[]
}

/**
 * 상황별 분류.
 *
 * ⚠️ 실제로 존재하는 계산기만 넣는다. 분류를 먼저 만들고 빈 칸을 두지 않는다.
 *    아르바이트 분류는 주휴수당 1종뿐이라 만들지 않고 직장인에 포함했다.
 *    시급·야간수당 계산기가 생기면 그때 분리한다.
 */
export const SITUATION_GROUPS: SituationGroup[] = [
  {
    key: 'employee',
    emoji: '🧑‍💼',
    title: '직장인',
    question: '내 월급, 실제로 얼마나 들어오나?',
    items: [
      { href: ROUTES.SALARY_CALCULATOR, label: '연봉 실수령액' },
      { href: ROUTES.PAYROLL_TAX_CALCULATOR, label: '급여 세금 간편 계산' },
      { href: ROUTES.SOCIAL_INSURANCE_CALCULATOR, label: '4대보험' },
      { href: ROUTES.WEEKLY_HOLIDAY_PAY_CALCULATOR, label: '주휴수당' },
    ],
  },
  {
    key: 'negotiation',
    emoji: '📈',
    title: '연봉협상',
    question: '연봉이 오르면 실수령은 얼마나 늘까?',
    items: [
      { href: ROUTES.SALARY_COMPARISON_CALCULATOR, label: '연봉 비교 (인상 전후 차이)' },
      { href: ROUTES.TARGET_SALARY_CALCULATOR, label: '목표 실수령액 역산' },
      { href: ROUTES.BONUS_WITHHOLDING_CALCULATOR, label: '상여금 원천징수' },
    ],
  },
  {
    key: 'leaving',
    emoji: '📦',
    title: '이직·퇴직',
    question: '퇴직할 때 얼마를 받게 되나?',
    items: [
      { href: ROUTES.SEVERANCE_PAY_CALCULATOR, label: '퇴직금' },
      { href: ROUTES.ANNUAL_LEAVE_PAY_CALCULATOR, label: '연차수당' },
      { href: ROUTES.UNEMPLOYMENT_BENEFIT_CALCULATOR, label: '실업급여' },
    ],
  },
  {
    key: 'employer',
    emoji: '🏢',
    title: '사업주·인사담당자',
    question: '직원 한 명에 회사가 쓰는 돈은 얼마인가?',
    items: [
      { href: ROUTES.EMPLOYER_COST_CALCULATOR, label: '기업 총 인건비' },
      { href: ROUTES.SOCIAL_INSURANCE_CALCULATOR, label: '4대보험 (사업주 부담)' },
      { href: ROUTES.BONUS_WITHHOLDING_CALCULATOR, label: '상여금 원천징수' },
      { href: ROUTES.PAYROLL_TAX_CALCULATOR, label: '급여 세금 간편 계산' },
    ],
  },
]

// ── 가이드 ──────────────────────────────────────────────────
export interface HomeGuide {
  q: string
  a: string
  href: string
  cta: string
}

export const HOME_GUIDES: HomeGuide[] = [
  {
    q: '연봉과 월급은 왜 다른가요?',
    a: '연봉을 12로 나눈 금액이 세전 월급이고, 여기서 4대보험과 소득세·지방소득세를 뺀 것이 실수령액입니다. 연봉이 오를수록 공제 비율도 함께 올라가기 때문에 실수령액은 연봉에 정비례하지 않습니다.',
    href: ROUTES.SALARY_CALCULATOR,
    cta: '실수령액 계산하기',
  },
  {
    q: '퇴직금은 어떻게 계산하나요?',
    a: '1일 평균임금 × 30일 × (재직일수 ÷ 365)로 계산합니다. 평균임금은 퇴직 전 3개월 임금 총액을 그 기간의 총일수로 나눈 값이며, 연간 상여금과 연차수당의 3/12도 포함됩니다. 계속근로기간 1년 이상이어야 지급 대상입니다.',
    href: ROUTES.SEVERANCE_PAY_CALCULATOR,
    cta: '퇴직금 계산하기',
  },
  {
    q: '비과세 항목은 무엇이 있나요?',
    a: '월 20만원 이내의 식대가 대표적입니다. 비과세 금액은 4대보험과 소득세 산정 기준에서 빠지므로, 같은 연봉이라도 비과세 구성에 따라 실수령액이 달라집니다.',
    href: ROUTES.SOCIAL_INSURANCE_CALCULATOR,
    cta: '4대보험 계산하기',
  },
  {
    q: '부양가족이 늘면 실수령액이 얼마나 달라지나요?',
    a: '소득세가 근로소득 간이세액표에서 공제대상가족 수에 따라 조회되므로, 부양가족이 많을수록 매월 원천징수되는 소득세가 줄어듭니다. 8~20세 자녀가 있으면 자녀세액공제가 추가로 적용됩니다.',
    href: ROUTES.SALARY_CALCULATOR,
    cta: '조건 넣고 비교하기',
  },
]
