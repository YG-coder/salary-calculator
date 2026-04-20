/**
 * src/app/layout.tsx
 * 역할: 전체 앱 루트 레이아웃
 * - 전역 metadata / viewport / OG 설정
 * - Pretendard 폰트 (CDN, 한국어 가변 폰트)
 * - Google AdSense 스크립트 조건부 로드
 *   next/script Strategy="afterInteractive" 사용
 *   → <script> 직접 삽입 대신 Next.js 권장 방식으로 교체
 *   → ESLint next/no-page-custom-font, @next/next/no-script-in-head 경고 제거
 */
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { SITE_URL, SITE_NAME } from '@/lib/constants'
import './globals.css'

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `연봉 실수령액 계산기 | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    '최신 기준 연봉 실수령액 계산기. 국민연금, 건강보험, 고용보험, 소득세까지 자동 계산. 월 실수령액을 바로 확인하세요.',
  keywords: [
    '연봉 실수령액 계산기',
    '연봉계산기',
    '실수령액 계산',
    '월급 실수령액',
    '4대보험 계산기',
    '소득세 계산',
    '국민연금 계산',
    '건강보험 계산',
    '고용보험 계산',
    '연봉 세금 계산',
  ],
  authors:   [{ name: SITE_NAME }],
  creator:   SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type:     'website',
    locale:   'ko_KR',
    url:      SITE_URL,
    siteName: SITE_NAME,
    title:    `연봉 실수령액 계산기 | ${SITE_NAME}`,
    description:
      '최신 기준 연봉 실수령액 계산기. 4대보험·소득세 자동 계산으로 월 실수령액을 바로 확인하세요.',
    images: [
      {
        url:    '/og-image.png',
        width:  1200,
        height: 630,
        alt:    `${SITE_NAME} — 연봉 실수령액 계산기`,
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       `연봉 실수령액 계산기 | ${SITE_NAME}`,
    description: '4대보험·소득세 자동 계산으로 월 실수령액을 바로 확인하세요.',
    images:      ['/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export const viewport: Viewport = {
  width:         'device-width',
  initialScale:  1,
  maximumScale:  5,
  themeColor:    '#0ea5e9',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* Pretendard 가변 폰트 — 한국어 최적화 CDN */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-screen bg-surface font-sans antialiased">
        {children}

        {/*
          Google AdSense 스크립트
          - next/script Strategy="afterInteractive": 페이지 hydration 후 로드 → LCP 영향 최소화
          - NEXT_PUBLIC_ADSENSE_CLIENT 환경변수 미설정 시 로드 안 함
          - 환경변수 설정 방법: .env.local 에 NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
        */}
        {ADSENSE_CLIENT && (
          <Script
            id="google-adsense"
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
