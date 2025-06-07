import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/test/setup.ts'], // Path to setup file
    css: true, // Enable CSS processing if your components import CSS files
    coverage: {
      provider: 'v8', // or 'istanbul'
      reporter: ['text', 'json', 'html', 'lcov'], // Added lcov for better coverage reports integration
      reportsDirectory: './coverage', // Specify output directory for coverage reports
      include: ['client/src/**/*.{ts,tsx}'], // Specify files to include in coverage
      exclude: [ // Specify files/patterns to exclude
        'client/src/main.tsx',
        'client/src/vite-env.d.ts',
        'client/src/test/',
        'client/src/workers/', // Typically workers are hard to cover with unit tests directly
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.config.{ts,js}',
        'client/src/lib/supabase.ts', // May want to mock this instead of testing directly
        'client/src/lib/database.ts', // Dexie can be complex to unit test directly
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
