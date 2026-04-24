// src/components/calculator/CalcCard.tsx
// 공통 계산기 카드 레이아웃 컴포넌트

interface Props {
  children: React.ReactNode
  title?: string
}

export function InputCard({ children, title = '정보 입력' }: Props) {
  return (
    <div className="card p-6 space-y-5">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      {children}
    </div>
  )
}

interface ResultHighlightProps {
  label: string
  value: string
  subtitle?: string
  color?: string
}

export function ResultHighlight({ label, value, subtitle, color = '#0284c7' }: ResultHighlightProps) {
  return (
    <div
      className="rounded-2xl p-6 text-white"
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
        boxShadow: '0 10px 24px -4px rgb(0 0 0 / 0.15)',
      }}
    >
      <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums leading-none">
        {value}
      </p>
      {subtitle && (
        <p className="mt-2 text-sm text-white/80">{subtitle}</p>
      )}
    </div>
  )
}

interface BreakdownItem {
  label: string
  value: string
  highlight?: boolean
  color?: string
}

export function BreakdownCard({ title, items }: { title: string; items: BreakdownItem[] }) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-slate-700 mb-4">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item.label}
            className={[
              'flex items-center justify-between',
              item.highlight ? 'pt-3 border-t border-slate-100' : '',
            ].join(' ')}
          >
            <span className={item.highlight ? 'text-sm font-bold text-slate-800' : 'text-sm text-slate-600'}>
              {item.label}
            </span>
            <span
              className={[
                'text-sm font-bold tabular-nums',
                item.color ?? (item.highlight ? 'text-brand-700' : 'text-slate-700'),
              ].join(' ')}
            >
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface DisclaimerProps {
  year: number
  extra?: string
}

export function Disclaimer({ year, extra }: DisclaimerProps) {
  return (
    <p className="text-xs text-slate-400 text-center px-2 leading-relaxed">
      본 계산 결과는 {year}년 기준 근사값으로, 실제와 다를 수 있습니다.
      {extra && ` ${extra}`}
      {' '}정확한 내용은 담당 세무사 또는 관계 기관에 문의하세요.
    </p>
  )
}
