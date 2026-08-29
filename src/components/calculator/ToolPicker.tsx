// src/components/calculator/ToolPicker.tsx
// 연봉↔실수령액 계산기 3종의 역할 구분 안내.
//
// 같은 설명을 여러 페이지에 복사하면 문구가 갈라지므로 한 곳에서만 정의하고
// 현재 보고 있는 페이지만 강조한다.

import Link from 'next/link'

export type SalaryToolKey = 'forward' | 'reverse' | 'comparison'

type Tool = {
  key: SalaryToolKey
  href: string
  emoji: string
  title: string
  /** 이 도구가 답하는 질문 */
  question: string
  input: string
  output: string
}

/** 역할 정의 단일 출처 */
export const SALARY_TOOLS: Tool[] = [
  {
    key: 'forward',
    href: '/salary-calculator',
    emoji: '💰',
    title: '연봉 실수령액 계산기',
    question: '이 연봉이면 실제로 얼마나 받나?',
    input: '세전 연봉',
    output: '월 실수령액과 공제 내역',
  },
  {
    key: 'comparison',
    href: '/salary-comparison-calculator',
    emoji: '📊',
    title: '연봉 비교 계산기',
    question: '연봉이 바뀌면 실수령액이 얼마나 달라지나?',
    input: '연봉 두 개 (A·B)',
    output: '실수령액 차이와 한계 실수령률',
  },
  {
    key: 'reverse',
    href: '/target-salary-calculator',
    emoji: '🎯',
    title: '목표 실수령액 역산 계산기',
    question: '원하는 실수령액을 받으려면 연봉이 얼마여야 하나?',
    input: '목표 월 실수령액',
    output: '필요한 최소 세전 연봉',
  },
]

/**
 * 세 계산기의 역할을 나란히 보여준다.
 * @param current 현재 페이지의 도구. 이 항목은 링크 대신 "지금 보는 계산기"로 표시된다.
 */
export default function ToolPicker({ current }: { current: SalaryToolKey }) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-bold text-slate-900 mb-1">
        연봉 계산기 3종, 언제 어느 것을 쓰나요?
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        셋 다 <strong>같은 계산 엔진</strong>을 씁니다. 같은 조건이면 결과가 서로 어긋나지
        않으며, 다른 것은 <strong>무엇을 알고 있고 무엇을 알고 싶은지</strong>뿐입니다.
      </p>

      <div className="space-y-3">
        {SALARY_TOOLS.map((t) => {
          const isCurrent = t.key === current
          const body = (
            <>
              <div className="flex items-center gap-2">
                <span aria-hidden>{t.emoji}</span>
                <span className={`font-semibold ${isCurrent ? 'text-slate-900' : 'text-brand-700'}`}>
                  {t.title}
                </span>
                {isCurrent && (
                  <span className="text-[11px] font-semibold text-white bg-slate-700 rounded-full px-2 py-0.5">
                    지금 보는 계산기
                  </span>
                )}
              </div>
              <p className={`mt-1 text-sm ${isCurrent ? 'text-slate-700' : 'text-slate-600'}`}>
                &ldquo;{t.question}&rdquo;
              </p>
              <p className="mt-1 text-xs text-slate-500">
                입력 {t.input} → 결과 {t.output}
              </p>
            </>
          )

          return isCurrent ? (
            <div key={t.key} className="rounded-xl border-2 border-slate-300 bg-slate-50 p-4">
              {body}
            </div>
          ) : (
            <Link
              key={t.key}
              href={t.href}
              className="block rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              {body}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
