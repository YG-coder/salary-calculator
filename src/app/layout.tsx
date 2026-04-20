/**
 * src/app/layout.tsx
 * 애드센스 + 서치콘솔 최종 완성 버전
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
        default: `연봉 실수령액 계산기 | ${SITE_NAME}`,
        template: `%s | ${SITE_NAME}`,
    },
    description:
        '연봉 실수령액 계산기. 국민연금, 건강보험, 고용보험, 소득세를 반영하여 월 실수령액을 자동 계산합니다. 최신 세법 기준 적용.',
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
            {/* 🔥 구글 서치콘솔 인증 (이거 추가) */}
            <meta
                name="google-site-verification"
                content="wRdD-XXVGdLkD1kbdoV_UaNa9Xz4VzYBsHAgwtEc1pU"
            />

            {/* 폰트 */}
            <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
            />
        </head>

        <body className="min-h-screen bg-surface font-sans antialiased">

        {/* 헤더 */}
        <Header />

        {/* 페이지 */}
        {children}

        {/* 푸터 */}
        <Footer />

        {/* 🔥 애드센스 코드 */}
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