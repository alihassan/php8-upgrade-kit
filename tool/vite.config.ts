/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// BASE sets the public path: "/" locally, "/<repo-name>/" on GitHub Pages,
// "/php8-check/" when built into another site at that path.
export default defineConfig({
  base: process.env.BASE ?? '/',
  build: { outDir: process.env.OUT_DIR ?? 'dist', emptyOutDir: true, target: 'es2022' },
  worker: { format: 'es' },
  // php-parser reads process.arch to pick 64-bit integer limits. PHP servers are 64-bit.
  define: { 'process.arch': JSON.stringify('x64') },
  test: { include: ['test/**/*.test.ts'] },
});
