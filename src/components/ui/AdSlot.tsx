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
    // 환경 변수
    const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

    // ✅ 슬롯 ID 숫자 검증 (핵심)
    const hasValidSlotId = /^\d+$/.test(slotId)

    // ✅ 광고 렌더 조건
    const canRenderAd =
        process.env.NODE_ENV === 'production' &&
        !!clientId &&
        hasValidSlotId

    // ✅ 광고 push (조건 만족 시만)
    useEffect(() => {
        if (!canRenderAd) return

        try {
            const w = window as Window & { adsbygoogle?: unknown[] }
            w.adsbygoogle = w.adsbygoogle ?? []
            w.adsbygoogle.push({})
        } catch {
            // 광고 차단기 / 중복 push 방지
        }
    }, [canRenderAd, slotId])

    // ❌ 광고 안 띄우는 상태 (개발 / 승인 전 / 잘못된 slotId)
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

    // ✅ 실제 애드센스 광고
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