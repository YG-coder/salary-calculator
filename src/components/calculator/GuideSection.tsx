/**
 * src/components/calculator/GuideSection.tsx
 * 역할: 계산기 하단 SEO 콘텐츠 섹션 (Server Component, 범용)
 * - 페이지별로 props만 다르게 넘기면 동일한 시각 패턴으로 1,000자+ 본문 노출
 * - 애드센스 "가치가 별로 없는 콘텐츠" 회피 목적
 *
 * 사용 예:
 *   <GuideSection
 *     title="퇴직금이란?"
 *     intro="퇴직금은 ..."
 *     sections={[
 *       { heading: '지급 요건', body: '...' },
 *       { heading: '계산 공식', body: '...' },
 *     ]}
 *     formula={{ title: '계산 공식', items: [...] }}
 *     referenceTable={{ ... }}
 *     legalBasis={[ '근로자퇴직급여보장법 제8조', ... ]}
 *   />
 */
import Link from 'next/link'
import type { ReactNode } from 'react'

export interface GuideSubSection {
  heading: string
  body: ReactNode
}

export interface GuideFormulaItem {
  label: string
  value: string
}

export interface GuideReferenceRow {
  /** 좌측 헤더 셀 (예: "근속 1년") */
  label: string
  /** 우측 컬럼들 (예: ["월급 300만원", "300만원"]) */
  values: string[]
}

export interface GuideReferenceTable {
  caption?: string
  /** 1열(label) 제외한 헤더 */
  headers: string[]
  rows: GuideReferenceRow[]
  footnote?: string
}

interface Props {
  /** 섹션 전체의 메인 타이틀 (h2) - 보통 "{계산기명} 안내" 또는 "{주제}이란?" */
  title: string
  /** 도입부 단락 (h2 바로 아래) */
  intro: ReactNode
  /** 본문 서브섹션들 (각각 h3 + 단락) */
  sections: GuideSubSection[]
  /** 계산 공식 카드 (선택) */
  formula?: {
    title: string
    description?: ReactNode
    items: GuideFormulaItem[]
  }
  /** 참고 테이블 (선택) */
  referenceTable?: GuideReferenceTable
  /** 법적 근거 / 출처 (선택) */
  legalBasis?: { label: string; href?: string }[]
  /** 주의사항 박스 본문 */
  disclaimer?: ReactNode
}

export default function GuideSection({
  title,
  intro,
  sections,
  formula,
  referenceTable,
  legalBasis,
  disclaimer,
}: Props) {
  return (
    <section className="mt-10 space-y-6" aria-label={title}>
      {/* ── 본문 설명 카드 ───────────────────────────────────── */}
      <div className="card p-6 sm:p-8 space-y-7">
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-2">{title}</h2>
          <div className="text-sm text-slate-600 leading-relaxed">{intro}</div>
        </div>

        {sections.map(({ heading, body }) => (
          <div key={heading}>
            <h3 className="text-base font-bold text-slate-800 mb-2">{heading}</h3>
            <div className="text-sm text-slate-600 leading-relaxed space-y-2">
              {body}
            </div>
          </div>
        ))}

        {formula && (
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2">
              {formula.title}
            </h3>
            {formula.description && (
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                {formula.description}
              </p>
            )}
            <div className="bg-slate-50 rounded-xl p-4 sm:p-5 space-y-2.5">
              {formula.items.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3"
                >
                  <span className="text-xs font-semibold text-slate-500 flex-shrink-0 sm:w-32">
                    {label}
                  </span>
                  <span className="text-sm font-mono text-slate-800 break-all">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {legalBasis && legalBasis.length > 0 && (
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2">법적 근거</h3>
            <ul className="text-sm text-slate-600 leading-relaxed space-y-1.5 list-none pl-0">
              {legalBasis.map(({ label, href }) => (
                <li key={label} className="flex gap-2.5">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-brand-400 mt-[7px]" />
                  <span>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-brand-700"
                      >
                        {label}
                      </a>
                    ) : (
                      label
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {disclaimer && (
          <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
            <p className="text-xs text-brand-700 leading-relaxed">
              <strong className="font-semibold">📌 주의사항: </strong>
              {disclaimer}{' '}
              <Link href="/about" className="underline hover:text-brand-900">
                서비스 소개
              </Link>
              에서 계산 기준에 대해 더 알아볼 수 있습니다.
            </p>
          </div>
        )}
      </div>

      {/* ── 참고 테이블 카드 ──────────────────────────────────── */}
      {referenceTable && (
        <div className="card p-6 sm:p-8">
          <h2 className="text-base font-bold text-slate-800 mb-1">
            {referenceTable.caption ?? '참고 표'}
          </h2>
          {referenceTable.footnote && (
            <p className="text-xs text-slate-500 mb-4">
              {referenceTable.footnote}
            </p>
          )}
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm border-collapse min-w-[400px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 rounded-tl-lg">
                    구분
                  </th>
                  {referenceTable.headers.map((h, i) => (
                    <th
                      key={h}
                      className={[
                        'px-3 py-2.5 text-right text-xs font-semibold text-slate-600',
                        i === referenceTable.headers.length - 1
                          ? 'rounded-tr-lg'
                          : '',
                      ].join(' ')}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referenceTable.rows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                  >
                    <td className="px-3 py-2.5 font-semibold text-slate-800">
                      {row.label}
                    </td>
                    {row.values.map((v, vi) => (
                      <td
                        key={vi}
                        className={[
                          'px-3 py-2.5 text-right',
                          vi === row.values.length - 1
                            ? 'font-bold text-brand-700'
                            : 'text-slate-500',
                        ].join(' ')}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
