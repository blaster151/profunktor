import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: [
      'tests/**/*.{test,spec}.ts',
      'tests/importedTests/**/*.{test,spec}.ts'
    ],
    exclude: [
      'tests/excluded/**',
    ],
    reporters: [
      [
        'default',
        { summary: false }
      ]
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'tests/**',
        'tests/excluded/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/node_modules/**'
      ]
    }
  }
});


