/**
 * src/components/calculator/FaqAccordion.tsx
 * 역할: 범용 FAQ 아코디언 (Client Component)
 * - 페이지별 FAQ 데이터를 props로 받아 렌더링
 * - 한 번에 하나만 펼침 (UX 통일)
 * - aria-expanded 접근성 속성 포함
 *
 * 사용 예:
 *   <FaqAccordion
 *     title="자주 묻는 질문"
 *     items={[
 *       { q: '...', a: '...' },
 *       { q: '...', a: <>...</> },
 *     ]}
 *   />
 */
'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'

export interface FaqItem {
  q: string
  a: ReactNode
}

interface Props {
  items: FaqItem[]
  title?: string
}

export default function FaqAccordion({
  items,
  title = '자주 묻는 질문 (FAQ)',
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i))

  return (
    <section className="mt-6" aria-label="자주 묻는 질문">
      <div className="card p-6 sm:p-8">
        <h2 className="text-base font-bold text-slate-800 mb-5">{title}</h2>

        <ul className="divide-y divide-slate-100">
          {items.map((faq, i) => {
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
                    <div className="text-sm text-slate-600 leading-relaxed pl-0">
                      {faq.a}
                    </div>
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
