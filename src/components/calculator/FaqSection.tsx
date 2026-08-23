/**
 * src/components/calculator/FaqSection.tsx
 * 역할: FAQ 아코디언 섹션 (Client Component)
 * - 8개 항목으로 확장 (SEO 키워드: 연봉 구간, 4대보험, 절세)
 * - jsonld.ts 의 FAQPage 스키마와 항목 동기화
 * - 아코디언 UX: 하나만 열림 (체류시간 증가)
 * - aria-expanded 접근성 속성 포함
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TAX_YEAR, RATES } from '@/lib/constants'
import { calculateSalary, formatKRW } from '@/lib/salary'

interface FaqItem {
  q: string
  a: React.ReactNode
}

const salary50m = calculateSalary({ annualSalary: 50_000_000, nonTaxable: 0, dependents: 1 })

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs: FaqItem[] = [
    {
      q: '연봉 실수령액이란 무엇인가요?',
      a: `세전 연봉에서 4대보험(국민연금·건강보험·장기요양·고용보험)과 소득세·지방소득세를 공제한 뒤 실제로 통장에 입금되는 금액입니다. 비율은 연봉·비과세·부양가족·자녀 조건에 따라 달라집니다.`,
    },
    {
      q: `${TAX_YEAR}년 국민연금 요율은 얼마인가요?`,
      a: `${TAX_YEAR}년 기준 국민연금 근로자 부담율은 ${(RATES.nationalPension * 100).toFixed(2)}%입니다. 기준소득월액 상·하한 범위 내에서 계산됩니다.`,
    },
    {
      q: '건강보험료와 장기요양보험료는 어떻게 계산되나요?',
      a: `건강보험 근로자 부담율은 ${(RATES.healthInsurance * 100).toFixed(3)}%이며, 장기요양보험료는 건강보험료의 ${(RATES.longTermCare * 100).toFixed(2)}%가 추가로 부과됩니다. 연봉 5,000만원 기준 건강보험 월 약 14만원, 장기요양 약 1.8만원 수준입니다.`,
    },
    {
      q: '고용보험은 왜 공제되나요?',
      a: `고용보험은 실직 시 실업급여, 육아휴직급여, 직업훈련비 지원 등에 활용되는 사회보험입니다. ${TAX_YEAR}년 기준 근로자 부담율은 월 과세 급여의 ${(RATES.employment * 100).toFixed(1)}%로, 월 급여 400만원 기준 약 36,000원이 공제됩니다.`,
    },
    {
      q: '비과세 금액을 입력하면 어떻게 달라지나요?',
      a: '비과세 금액(식대 등)은 4대보험 및 소득세 산정 기준에서 제외됩니다. 비과세 금액이 클수록 공제액이 줄고 실수령액이 높아집니다. 월 20만원 식대를 비과세로 처리하면 연간 약 15~25만원의 절세 효과가 발생합니다. 계산기에 월 비과세 금액을 입력하면 자동 반영됩니다.',
    },
    {
      q: '부양가족 수를 늘리면 세금이 줄어드나요?',
      a: '네. 본인을 포함한 공제대상 가족 수에 따라 국세청 근로소득 간이세액표의 원천징수 세액이 달라집니다. 8세 이상 20세 이하 자녀 수에 따른 세액공제도 별도로 반영됩니다.',
    },
    {
      q: '연봉 5,000만원 실수령액은 얼마인가요?',
      a: (
        <>
          연봉 5,000만원 기준(부양가족 1명, 비과세 없음) 현재 계산 결과는 월 {formatKRW(salary50m.monthlyNet)}입니다.
          정확한 금액은{' '}
          <Link href="/" className="text-brand-600 hover:underline font-medium">
            위 계산기
          </Link>
          에 직접 입력해 확인하세요.
        </>
      ),
    },
    {
      q: '이 계산기 결과가 실제 급여와 다를 수 있나요?',
      a: (
        <>
          본 계산기는 {TAX_YEAR}년 기준 근사값을 제공합니다. 두루누리 사회보험 지원, 추가 공제
          항목, 회사별 규정, 중도 입·퇴사 등에 따라 실제 급여와 차이가 발생할 수 있습니다.
          정확한 정보는{' '}
          <a
            href="https://www.hometax.go.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 hover:underline font-medium"
          >
            국세청 홈택스
          </a>
          또는{' '}
          <Link href="/about" className="text-brand-600 hover:underline font-medium">
            서비스 소개
          </Link>
          를 참고하세요.
        </>
      ),
    },
  ]

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i))

  return (
    <section className="mt-6" aria-label="자주 묻는 질문">
      <div className="card p-6 sm:p-8">
        <h2 className="text-base font-bold text-slate-800 mb-5">
          자주 묻는 질문 (FAQ)
        </h2>

        <ul className="divide-y divide-slate-100">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className="w-full flex items-start justify-between gap-3 py-4 text-left group"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors leading-snug">
                    Q. {faq.q}
                  </span>
                  <span
                    className={[
                      'flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center',
                      'text-slate-400 text-xs transition-all duration-200 mt-0.5',
                      isOpen
                        ? 'rotate-180 border-brand-300 bg-brand-50 text-brand-500'
                        : 'border-slate-200',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-5 animate-fade-in">
                    <p className="text-sm text-slate-600 leading-relaxed pl-0">{faq.a}</p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
