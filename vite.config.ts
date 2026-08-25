// vitest 설정(test 블록)을 같은 파일에 두기 위해 vitest/config 의 defineConfig 를 쓴다.
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // React 프론트(3000)와 동시에 띄울 수 있도록 다른 포트를 쓴다
    port: 3001,
    // 개발 중 /api 요청을 백엔드로 프록시한다 — 브라우저에서 동일 출처로 보여 쿠키가 그대로 실린다.
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: false,
  },
})
