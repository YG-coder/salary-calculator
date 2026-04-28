/**
 * src/app/layout.tsx
 * 애드센스 + SEO + OG + 인증 최종 완성
 */

import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { SITE_URL, SITE_NAME } from '@/lib/constants'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import './globals.css'

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `직장인 급여 계산기 | ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },

  description:
      '실수령액, 4대보험, 퇴직금, 연차수당, 주휴수당, 실업급여까지 직장인 필수 급여 계산기 모음. 국민연금·건강보험·소득세 자동 반영. 최신 세법 기준.',

  alternates: {
    canonical: SITE_URL,
  },

  // ✅ Open Graph (공유/SEO)
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `직장인 급여 계산기 | ${SITE_NAME}`,
    description:
        '실수령액, 4대보험, 퇴직금, 연차수당, 주휴수당, 실업급여까지 직장인 필수 급여 계산기 모음.',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} 대표 이미지`,
      },
    ],
  },

  // ✅ Twitter 카드
  twitter: {
    card: 'summary_large_image',
    title: `직장인 급여 계산기 | ${SITE_NAME}`,
    description:
        '실수령액, 4대보험, 퇴직금, 연차수당, 주휴수당, 실업급여까지 직장인 필수 급여 계산기 모음.',
    images: [`${SITE_URL}/og-image.png`],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="ko">
      <head>
        {/* ✅ 구글 서치콘솔 인증 */}
        <meta
            name="google-site-verification"
            content="wRdD-XXVGdLkD1kbdoV_UaNa9Xz4VzYBsHAgwtEc1pU"
        />

        {/* ✅ 네이버 서치어드바이저 인증 */}
        <meta
            name="naver-site-verification"
            content="d95d98873ed547abe124200609268ab5c78f9ad8"
        />

        {/* ✅ 폰트 최적화 */}
        <link
            rel="preconnect"
            href="https://cdn.jsdelivr.net"
            crossOrigin="anonymous"
        />
        <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>

      <body className="min-h-screen bg-surface font-sans antialiased flex flex-col">
      <Header />

      <main className="flex-1">{children}</main>

      <Footer />

      {/* ✅ 애드센스 스크립트 (승인 전에도 넣어도 OK) */}
      {ADSENSE_CLIENT && (
          <Script
              id="adsense-script"
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