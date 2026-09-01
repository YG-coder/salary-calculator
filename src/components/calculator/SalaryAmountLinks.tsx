import Link from 'next/link'

export const REPRESENTATIVE_SALARY_AMOUNTS_MAN = Array.from(
  { length: 20 },
  (_, index) => 2000 + index * 500,
)

type SalaryAmountLinksProps = {
  currentAmountMan?: number
}

export default function SalaryAmountLinks({ currentAmountMan }: SalaryAmountLinksProps) {
  return (
    <section aria-labelledby="representative-salary-heading">
      <h2 id="representative-salary-heading" className="text-lg font-bold text-slate-900">
        대표 연봉 실수령액
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        자주 찾는 연봉의 세후 월급과 공제 내역을 바로 확인하세요.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {REPRESENTATIVE_SALARY_AMOUNTS_MAN.map((amount) => {
          const isCurrent = amount === currentAmountMan
          const className = [
            'rounded-xl border px-4 py-3 text-center text-sm font-semibold transition-colors',
            isCurrent
              ? 'border-brand-300 bg-brand-50 text-brand-800'
              : 'border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700',
          ].join(' ')

          if (isCurrent) {
            return (
              <span key={amount} aria-current="page" className={className}>
                연봉 {amount.toLocaleString()}만원
              </span>
            )
          }

          return (
            <Link key={amount} href={`/salary/${amount}`} className={className}>
              연봉 {amount.toLocaleString()}만원
            </Link>
          )
        })}
      </div>
    </section>
  )
}
