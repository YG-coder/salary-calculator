// src/lib/routes.ts

export const ROUTES = {
    HOME: '/',
    SALARY_CALCULATOR: '/salary-calculator',
    SALARY_TABLE: '/salary-table',
    SALARY_COMPARISON_CALCULATOR: '/salary-comparison-calculator',
    TARGET_SALARY_CALCULATOR: '/target-salary-calculator',
    PAYROLL_TAX_CALCULATOR: '/payroll-tax-calculator',
    BONUS_WITHHOLDING_CALCULATOR: '/bonus-withholding-calculator',
    SOCIAL_INSURANCE_CALCULATOR: '/social-insurance-calculator',
    EMPLOYER_COST_CALCULATOR: '/employer-cost-calculator',
    SEVERANCE_PAY_CALCULATOR: '/severance-pay-calculator',
    ANNUAL_LEAVE_PAY_CALCULATOR: '/annual-leave-pay-calculator',
    WEEKLY_HOLIDAY_PAY_CALCULATOR: '/weekly-holiday-pay-calculator',
    UNEMPLOYMENT_BENEFIT_CALCULATOR: '/unemployment-benefit-calculator',
    WAGE_CONVERTER: '/wage-converter',

    ABOUT: '/about',
    PRIVACY: '/privacy',
    CONTACT: '/contact',
} as const

export const CALCULATOR_ROUTES = [
    ROUTES.SALARY_CALCULATOR,
    ROUTES.SALARY_COMPARISON_CALCULATOR,
    ROUTES.TARGET_SALARY_CALCULATOR,
    ROUTES.PAYROLL_TAX_CALCULATOR,
    ROUTES.BONUS_WITHHOLDING_CALCULATOR,
    ROUTES.SOCIAL_INSURANCE_CALCULATOR,
    ROUTES.EMPLOYER_COST_CALCULATOR,
    ROUTES.SEVERANCE_PAY_CALCULATOR,
    ROUTES.ANNUAL_LEAVE_PAY_CALCULATOR,
    ROUTES.WEEKLY_HOLIDAY_PAY_CALCULATOR,
    ROUTES.UNEMPLOYMENT_BENEFIT_CALCULATOR,
    ROUTES.WAGE_CONVERTER,
] as const

/** 입력 없이 읽는 참고 페이지. 사이트맵에는 넣지만 계산기 메뉴(헤더·푸터·홈 카드) 강제 대상은 아니다. */
export const REFERENCE_ROUTES = [
    ROUTES.SALARY_TABLE,
] as const

export const STATIC_ROUTES = [
    ROUTES.ABOUT,
    ROUTES.PRIVACY,
    ROUTES.CONTACT,
] as const