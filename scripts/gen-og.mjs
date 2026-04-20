// scripts/gen-og.mjs
// og-image.png 재생성 스크립트
// 실행: npm run gen:og
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const out   = join(__dir, '../public/og-image.png')

const W = 1200, H = 630

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#0369a1"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.13"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.04"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1080" cy="80"  r="220" fill="white" fill-opacity="0.05"/>
  <circle cx="150"  cy="540" r="160" fill="white" fill-opacity="0.05"/>
  <circle cx="980"  cy="500" r="100" fill="white" fill-opacity="0.07"/>
  <rect x="64" y="60" width="520" height="130" rx="20" fill="url(#card)" stroke="white" stroke-opacity="0.15" stroke-width="1"/>
  <text x="104" y="108" font-family="Apple SD Gothic Neo,sans-serif" font-size="22" font-weight="600" fill="white" fill-opacity="0.7">월 실수령액</text>
  <text x="104" y="168" font-family="Apple SD Gothic Neo,sans-serif" font-size="48" font-weight="900" fill="white" letter-spacing="-1">3,247,000원</text>
  <text x="64" y="310" font-family="Apple SD Gothic Neo,sans-serif" font-size="64" font-weight="900" fill="white" letter-spacing="-2">연봉 실수령액</text>
  <text x="64" y="390" font-family="Apple SD Gothic Neo,sans-serif" font-size="64" font-weight="900" fill="white" letter-spacing="-2">계산기</text>
  <text x="64" y="450" font-family="Apple SD Gothic Neo,sans-serif" font-size="26" font-weight="400" fill="white" fill-opacity="0.75">국민연금 · 건강보험 · 고용보험 · 소득세 자동 계산</text>
  <rect x="64" y="480" width="560" height="2" fill="white" fill-opacity="0.2" rx="1"/>
  <text x="64" y="526" font-family="Apple SD Gothic Neo,sans-serif" font-size="28" font-weight="700" fill="white" fill-opacity="0.9">연봉계산기.kr</text>
  <rect x="64"  y="554" width="100" height="36" rx="18" fill="white" fill-opacity="0.2"/>
  <text x="114" y="577" font-family="Apple SD Gothic Neo,sans-serif" font-size="16" font-weight="600" fill="white" text-anchor="middle">무료</text>
  <rect x="176" y="554" width="100" height="36" rx="18" fill="white" fill-opacity="0.2"/>
  <text x="226" y="577" font-family="Apple SD Gothic Neo,sans-serif" font-size="16" font-weight="600" fill="white" text-anchor="middle">2026년</text>
  <rect x="288" y="554" width="130" height="36" rx="18" fill="white" fill-opacity="0.2"/>
  <text x="353" y="577" font-family="Apple SD Gothic Neo,sans-serif" font-size="16" font-weight="600" fill="white" text-anchor="middle">4대보험 포함</text>
</svg>`

const info = await sharp(Buffer.from(svg)).png().toFile(out)
console.log(`✅ og-image.png 생성: ${info.width}×${info.height} → ${out}`)
