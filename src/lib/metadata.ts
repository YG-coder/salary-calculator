// src/lib/metadata.ts
import type { Metadata } from 'next'
import { SITE } from '@/lib/site'
import { ROUTES } from '@/lib/routes'

type PageMeta = {
    title: string
    description: string
    path: string
    keywords?: string[]
}

export const PAGE_META = {
    home: {
        title: '연봉계산기 | 실수령액·세금·4대보험 계산기',
        description:
            '연봉 실수령액, 월급, 4대보험, 원천징수, 퇴직금, 연차수당, 주휴수당, 실업급여를 쉽게 계산할 수 있는 무료 연봉계산기입니다.',
        path: ROUTES.HOME,
        keywords: ['연봉계산기', '실수령액 계산기', '월급 계산기', '4대보험 계산기'],
    },

    salaryCalculator: {
        title: '연봉 실수령액 계산기 | 세후 월급 계산',
        description:
            '연봉을 입력하면 국민연금, 건강보험, 고용보험, 소득세를 반영한 예상 월 실수령액을 계산합니다.',
        path: ROUTES.SALARY_CALCULATOR,
        keywords: ['연봉 실수령액 계산기', '세후 월급 계산기', '월급 실수령액'],
    },

    payrollTaxCalculator: {
        title: '원천징수 계산기 | 근로소득세·지방소득세 계산',
        description:
            '월급 기준 근로소득세와 지방소득세 원천징수 예상액을 간단히 계산합니다.',
        path: ROUTES.PAYROLL_TAX_CALCULATOR,
        keywords: ['원천징수 계산기', '근로소득세 계산기', '지방소득세 계산기'],
    },

    socialInsuranceCalculator: {
        title: '4대보험 계산기 | 국민연금·건강보험·고용보험 계산',
        description:
            '월급 기준 국민연금, 건강보험, 장기요양보험, 고용보험 등 4대보험 예상 공제액을 계산합니다.',
        path: ROUTES.SOCIAL_INSURANCE_CALCULATOR,
        keywords: ['4대보험 계산기', '국민연금 계산기', '건강보험 계산기', '고용보험 계산기'],
    },

    severancePayCalculator: {
        title: '퇴직금 계산기 | 예상 퇴직급여 계산',
        description:
            '근무기간과 평균임금을 기준으로 예상 퇴직금을 계산합니다.',
        path: ROUTES.SEVERANCE_PAY_CALCULATOR,
        keywords: ['퇴직금 계산기', '퇴직급여 계산기', '평균임금 계산'],
    },

    annualLeavePayCalculator: {
        title: '연차수당 계산기 | 미사용 연차수당 계산',
        description:
            '미사용 연차일수와 통상임금을 기준으로 예상 연차수당을 계산합니다.',
        path: ROUTES.ANNUAL_LEAVE_PAY_CALCULATOR,
        keywords: ['연차수당 계산기', '미사용 연차 계산기', '통상임금 계산'],
    },

    weeklyHolidayPayCalculator: {
        title: '주휴수당 계산기 | 알바·시급 주휴수당 계산',
        description:
            '시급과 근무시간을 입력하면 예상 주휴수당을 계산합니다.',
        path: ROUTES.WEEKLY_HOLIDAY_PAY_CALCULATOR,
        keywords: ['주휴수당 계산기', '알바 주휴수당', '시급 계산기'],
    },

    unemploymentBenefitCalculator: {
        title: '실업급여 계산기 | 구직급여 예상액 계산',
        description:
            '평균임금과 고용보험 가입기간을 기준으로 예상 실업급여를 계산합니다.',
        path: ROUTES.UNEMPLOYMENT_BENEFIT_CALCULATOR,
        keywords: ['실업급여 계산기', '구직급여 계산기', '고용보험 실업급여'],
    },

    about: {
        title: '소개 | 연봉계산기',
        description:
            '연봉계산기.kr은 연봉 실수령액과 근로자 급여 관련 계산을 쉽게 확인할 수 있도록 만든 무료 계산기 사이트입니다.',
        path: ROUTES.ABOUT,
        keywords: ['연봉계산기 소개', '급여 계산기', '실수령액 계산'],
    },

    privacy: {
        title: '개인정보처리방침 | 연봉계산기',
        description: '연봉계산기.kr의 개인정보처리방침 안내 페이지입니다.',
        path: ROUTES.PRIVACY,
        keywords: ['연봉계산기 개인정보처리방침'],
    },

    contact: {
        title: '문의하기 | 연봉계산기',
        description: '연봉계산기.kr 문의 안내 페이지입니다.',
        path: ROUTES.CONTACT,
        keywords: ['연봉계산기 문의', '계산기 문의'],
    },
} satisfies Record<string, PageMeta>

export function buildMetadata(meta: PageMeta): Metadata {
    const url = meta.path === ROUTES.HOME ? SITE.url : `${SITE.url}${meta.path}`

    return {
        title: meta.title,
        description: meta.description,
        keywords: meta.keywords,
        alternates: {
            canonical: url,
        },
        openGraph: {
            title: meta.title,
            description: meta.description,
            url,
            siteName: SITE.name,
            type: 'website',
            locale: 'ko_KR',
        },
        twitter: {
            card: 'summary_large_image',
            title: meta.title,
            description: meta.description,
        },
    }
}