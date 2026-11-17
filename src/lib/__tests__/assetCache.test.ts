import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { expect, it } from 'vitest'

// source는 단순 정규식이 아닌 경로 패턴이다. Next가 사용하는 경로 컴파일러로 검사한다.
const { pathToRegexp } = createRequire(import.meta.url)('next/dist/compiled/path-to-regexp') as {
  pathToRegexp: (source: string) => RegExp
}
const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[]
}
// 경로만 검사한다. 쿼리 문자열 처리와 실제 응답 헤더는 배포 후 별도로 확인한다.
function cacheHeaders(path: string) {
  return config.headers.filter(rule => pathToRegexp(rule.source).test(path))
    .flatMap(rule => rule.headers).filter(header => header.key.toLowerCase() === 'cache-control')
    .map(header => header.value)
}

it.each(['/og-image.png', '/logo.svg', '/og-image.png/', '/logo.svg/'])(
  '%s에는 장기 캐시가 중복 적용되지 않고 한 시간 이후 재검증한다', path => {
    const headers = cacheHeaders(path)
    expect(headers).toHaveLength(1)
    expect(headers[0]).toContain('max-age=3600')
    expect(headers[0]).toContain('must-revalidate')
    expect(headers[0]).not.toContain('immutable')
  },
)
it.each(['/_next/static/chunks/app-abc123.js', '/_next/static/css/abc123.css', '/favicon-32x32.png', '/images/other.svg', '/_next/static/media/logo.svg', '/x/og-image.png', '/og-image.png.js'])(
  '%s의 기존 정적 파일 캐시는 유지한다', path => {
    expect(cacheHeaders(path)).toEqual(['public, max-age=31536000, immutable'])
  },
)
it.each(['/', '/severance-pay-calculator'])('%s HTML에는 이미지 캐시를 적용하지 않는다', path => {
  expect(cacheHeaders(path)).toEqual([])
})
