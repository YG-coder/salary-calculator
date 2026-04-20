/**
 * src/lib/jsonld.ts
 * 역할: 구조화 데이터(JSON-LD) 생성 팩토리
 * - WebApplication 스키마: /salary-calculator 페이지용
 * - FAQPage 스키마: FAQ 섹션 SEO용
 * - 두 페이지(/, /salary-calculator)가 공유 → 중복 제거
 */
import {
  SITE_URL, OPERATOR_NAME, OPERATOR_EMAIL, TAX_YEAR, RATES,
} from './constants'

export function buildWebAppJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '연봉 실수령액 계산기',
    url: `${SITE_URL}/salary-calculator`,
    description: `연봉 입력만으로 4대보험과 소득세를 자동 계산하여 월·연 실수령액을 즉시 확인할 수 있는 무료 계산기 (${TAX_YEAR}년 기준)`,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
    creator: {
      '@type': 'Organization',
      name: OPERATOR_NAME,
      email: OPERATOR_EMAIL,
    },
    inLanguage: 'ko',
    featureList: [
      '연봉 실수령액 계산',
      `4대보험 계산 (국민연금 ${(RATES.nationalPension * 100).toFixed(1)}%, 건강보험 ${(RATES.healthInsurance * 100).toFixed(3)}%, 장기요양, 고용보험 ${(RATES.employment * 100).toFixed(1)}%)`,
      '소득세 및 지방소득세 계산',
      '부양가족 수에 따른 인적공제 반영',
      '월 비과세 금액 반영',
    ],
  }
}

export function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '연봉 실수령액이란 무엇인가요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '세전 연봉에서 4대보험(국민연금·건강보험·장기요양·고용보험)과 소득세·지방소득세를 공제한 뒤 실제로 통장에 입금되는 금액입니다. 보통 연봉의 75~88% 수준이며, 연봉이 높을수록 실효세율이 높아집니다.',
        },
      },
      {
        '@type': 'Question',
        name: `${TAX_YEAR}년 국민연금 요율은 얼마인가요?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${TAX_YEAR}년 기준 국민연금 근로자 부담율은 ${(RATES.nationalPension * 100).toFixed(1)}%입니다. 기준소득월액 하한은 39만원, 상한은 617만원입니다.`,
        },
      },
      {
        '@type': 'Question',
        name: '건강보험료와 장기요양보험료는 어떻게 계산되나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `건강보험 근로자 부담율은 ${(RATES.healthInsurance * 100).toFixed(3)}%, 장기요양보험료는 건강보험료의 ${(RATES.longTermCare * 100).toFixed(2)}%가 추가로 부과됩니다.`,
        },
      },
      {
        '@type': 'Question',
        name: '비과세 금액을 입력하면 어떻게 달라지나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '비과세 금액(식대 등)은 4대보험 및 소득세 산정 기준에서 제외되므로, 비과세 금액이 클수록 공제액이 줄고 실수령액이 높아집니다. 월 20만원 식대를 비과세로 처리하면 연간 약 10~20만원의 절세 효과가 있습니다.',
        },
      },
      {
        '@type': 'Question',
        name: '부양가족 수를 늘리면 세금이 줄어드나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '네. 부양가족 1인당 연 150만원의 기본공제가 적용되어 소득세 과세표준이 낮아집니다. 예를 들어 본인 포함 3명이면 연 300만원 추가 공제가 발생해 소득세가 감소합니다.',
        },
      },
      {
        '@type': 'Question',
        name: '고용보험은 왜 공제되나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `고용보험은 실직 시 실업급여, 육아휴직급여, 직업훈련 지원 등의 재원입니다. ${TAX_YEAR}년 기준 근로자 부담율은 월 과세 급여의 ${(RATES.employment * 100).toFixed(1)}%입니다.`,
        },
      },
      {
        '@type': 'Question',
        name: '연봉 5000만원 실수령액은 얼마인가요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `연봉 5,000만원 기준(부양가족 1명, 비과세 0원) 월 실수령액은 약 350~360만원 수준입니다. 비과세 식대 20만원을 적용하면 약 5~10만원 추가로 수령할 수 있습니다. 정확한 금액은 위 계산기를 이용하세요.`,
        },
      },
      {
        '@type': 'Question',
        name: '이 계산기 결과가 실제 급여와 다를 수 있나요?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '본 계산기는 일반적인 근사값을 제공합니다. 두루누리 사회보험 지원, 각종 추가공제 항목, 회사별 규정, 중도 입·퇴사 등에 따라 실제 급여와 차이가 발생할 수 있습니다.',
        },
      },
    ],
  }
}
