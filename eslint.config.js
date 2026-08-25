import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tseslint from 'typescript-eslint'

/**
 * ESLint 설정 (flat config).
 *
 * 타입 검사는 `npm run build` 의 vue-tsc 가 맡는다. 여기서는 vue-tsc 가 잡지 못하는 것 —
 * 템플릿 규칙 위반, 쓰지 않는 변수 — 을 본다.
 *
 * `public/` 은 KRDS 가 배포한 자산을 그대로 둔 곳이라 검사 대상이 아니다.
 * 우리가 고칠 코드가 아니고, 검사하면 수천 건의 소음만 남는다.
 */
export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'public'] },
  {
    files: ['src/**/*.{ts,vue}'],
    // vue 는 essential 만 쓴다. recommended 에는 속성 줄바꿈·self-closing 같은
    // 포맷팅 규칙이 들어 있어(이 코드베이스에서만 490여 건) 실제 결함을 덮는다.
    // 서식은 도구로 강제하지 않고, 오류로 이어지는 규칙만 본다.
    extends: [js.configs.recommended, ...tseslint.configs.recommended, ...pluginVue.configs['flat/essential']],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        // .vue 의 <script setup lang="ts"> 안을 TypeScript 로 읽는다.
        parser: tseslint.parser,
      },
    },
    rules: {
      // 의도적으로 쓰지 않는 인자는 밑줄로 표시한다.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // 이 프로젝트의 화면은 파일 하나에 컴포넌트 하나이고 파일명이 곧 이름이라
      // 여러 단어 규칙(MyView 대신 View)까지 강제하지 않는다.
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    files: ['src/**/*.vue'],
    languageOptions: { parser: vueParser },
  },
  {
    files: ['src/test/**/*.{ts,vue}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
)
