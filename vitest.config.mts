import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// 계산 로직(순수 함수) 단위 테스트 전용 설정.
// Next.js 빌드 파이프라인과 분리되어 있어 기존 build/lint 설정에 영향을 주지 않습니다.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
