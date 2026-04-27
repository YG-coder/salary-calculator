// src/lib/routes.ts

export const ROUTES = {
    HOME: '/',
    SALARY_CALCULATOR: '/salary-calculator',
    PAYROLL_TAX_CALCULATOR: '/payroll-tax-calculator',
    SOCIAL_INSURANCE_CALCULATOR: '/social-insurance-calculator',
    SEVERANCE_PAY_CALCULATOR: '/severance-pay-calculator',
    ANNUAL_LEAVE_PAY_CALCULATOR: '/annual-leave-pay-calculator',
    WEEKLY_HOLIDAY_PAY_CALCULATOR: '/weekly-holiday-pay-calculator',
    UNEMPLOYMENT_BENEFIT_CALCULATOR: '/unemployment-benefit-calculator',

    ABOUT: '/about',
    PRIVACY: '/privacy',
    CONTACT: '/contact',
} as const

export const CALCULATOR_ROUTES = [
    ROUTES.SALARY_CALCULATOR,
    ROUTES.PAYROLL_TAX_CALCULATOR,
    ROUTES.SOCIAL_INSURANCE_CALCULATOR,
    ROUTES.SEVERANCE_PAY_CALCULATOR,
    ROUTES.ANNUAL_LEAVE_PAY_CALCULATOR,
    ROUTES.WEEKLY_HOLIDAY_PAY_CALCULATOR,
    ROUTES.UNEMPLOYMENT_BENEFIT_CALCULATOR,
] as const

export const STATIC_ROUTES = [
    ROUTES.ABOUT,
    ROUTES.PRIVACY,
    ROUTES.CONTACT,
] as const