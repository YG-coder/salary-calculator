// src/components/ui/AdSlot.tsx
// 수정사항:
//   1. isProduction 을 모듈 최상단 평가 → 컴포넌트 내부 평가로 이동
//      (SSR 시 process.env 접근 타이밍 문제 방지)
//   2. slotId props 필수화 (string, 기본값 없음)
//   3. adsbygoogle.push() 를 useEffect 안에서만 호출
//   4. ins 태그 key 로 slotId 사용 → 슬롯마다 독립 인스턴스
//   5. 광고 높이 표준 규격 적용 (horizontal: 90px leaderboard, rectangle: 250px)
'use client'

import { useEffect } from 'react'

interface AdSlotProps {
  slotId: string
  format?: 'auto' | 'rectangle' | 'horizontal'
  className?: string
}

export default function AdSlot({ slotId, format = 'auto', className = '' }: AdSlotProps) {
  // ✅ 컴포넌트 렌더 시점에 평가 (SSR safe)
  const clientId  = process.env.NEXT_PUBLIC_ADSENSE_CLIENT
  const isProd    = process.env.NODE_ENV === 'production' && !!clientId

  useEffect(() => {
    if (!isProd) return
    try {
      const w = window as Window & { adsbygoogle?: unknown[] }
      w.adsbygoogle = w.adsbygoogle ?? []
      w.adsbygoogle.push({})
    } catch {
      // 광고 차단기 또는 중복 push 무시
    }
  }, [isProd])

  // 개발 환경 or 미승인: 플레이스홀더
  if (!isProd) {
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
        <span className="text-slate-300 font-mono text-[10px]">{slotId}</span>
      </div>
    )
  }

  // 실제 AdSense
  return (
    <div className={className}>
      <ins
        key={slotId}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
