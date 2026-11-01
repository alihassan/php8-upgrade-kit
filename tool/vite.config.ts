/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

// BASE sets the public path: "/" locally, "/<repo-name>/" on GitHub Pages,
// "/php8-check/" when built into another site at that path.
export default defineConfig({
  base: process.env.BASE ?? '/',
  build: { outDir: process.env.OUT_DIR ?? 'dist', emptyOutDir: true, target: 'es2022' },
  worker: { format: 'es' },
  test: { include: ['test/**/*.test.ts'] },
});
