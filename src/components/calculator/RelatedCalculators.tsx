// src/components/calculator/RelatedCalculators.tsx
import Link from 'next/link'

interface RelatedItem {
  href: string
  label: string
  description: string
  emoji: string
}

interface Props {
  items: RelatedItem[]
  title?: string
}

export default function RelatedCalculators({ items, title = '관련 계산기' }: Props) {
  return (
    <section className="mt-10">
      <h2 className="text-base font-bold text-slate-800 mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card p-4 flex items-start gap-3 hover:border-brand-200 hover:shadow-md transition-all group"
          >
            <span className="text-2xl flex-shrink-0">{item.emoji}</span>
            <div>
              <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700 transition-colors">
                {item.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
