import { RATES } from './constants'
import { createFloor10Rate } from './rateMath'

export const calculateHealthInsurance = createFloor10Rate(RATES.healthInsurance)
export const calculateEmployeeEmploymentInsurance = createFloor10Rate(RATES.employment)
export const calculateLocalTax = createFloor10Rate(RATES.localTax)

/** 공단 산식: 건강보험료 × 소득 대비 장기요양 요율 / 전체 건강보험 요율. */
export const calculateLongTermCare = createFloor10Rate(RATES.longTermCareIncome, RATES.healthInsuranceTotal)
