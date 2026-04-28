'use client'

import { useEffect } from 'react'

interface AdSlotProps {
    slotId: string
    format?: 'auto' | 'rectangle' | 'horizontal'
    className?: string
}

export default function AdSlot({
                                   slotId,
                                   format = 'auto',
                                   className = '',
                               }: AdSlotProps) {
    const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
    const hasValidSlotId = /^\d+$/.test(slotId)

    const canRenderAd =
        process.env.NODE_ENV === 'production' &&
        !!clientId &&
        hasValidSlotId

    useEffect(() => {
        if (!canRenderAd) return

        try {
            const w = window as Window & { adsbygoogle?: unknown[] }
            w.adsbygoogle = w.adsbygoogle ?? []
            w.adsbygoogle.push({})
        } catch {
            // 광고 차단기 또는 중복 push 무시
        }
    }, [canRenderAd, slotId])

    if (!canRenderAd) {
        return (
            <div
                className={[
                    'flex flex-col items-center justify-center',
                    'bg-slate-50 border border-dashed border-slate-200 rounded-xl',
                    'text-xs text-slate-400 gap-1 select-none',
                    format === 'horizontal' ? 'h-[90px]' : 'h-[250px]',
                    className,
                ].join(' ')}
                aria-hidden="true"
                role="presentation"
            >
                <span className="font-medium">광고 영역</span>
                <span className="text-slate-300 font-mono text-[10px]">
          {slotId}
        </span>
            </div>
        )
    }

    return (
        <div className={className}>
            <ins
                key={slotId}
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={clientId}
                data-ad-slot={slotId}
                data-ad-format={format === 'rectangle' ? 'auto' : format}
                data-full-width-responsive="true"
            />
        </div>
    )
}