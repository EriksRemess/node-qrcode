import globals from 'globals'

export default [
  {
    ignores: [
      'node_modules/**',
      'lib/core/regex.js'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      'no-var': 'error',
      'prefer-const': 'error'
    }
  }
]
