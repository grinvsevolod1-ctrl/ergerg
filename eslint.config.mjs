import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'public/**',
      'scripts/**',
    ],
  },
  {
    rules: {
      // Pragmatic rules for an existing codebase: warn instead of error so
      // `lint` stays green while still surfacing issues to fix over time.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-empty-object-type': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      '@next/next/no-img-element': 'warn',
      // React Compiler diagnostics are advisory for this codebase. They flag
      // patterns that work today but could be optimized; surfacing them as
      // warnings keeps `lint` actionable without forcing a large refactor.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  {
    // The background email worker is a standalone CommonJS Node script.
    files: ['worker.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]

export default eslintConfig
