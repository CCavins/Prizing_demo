import { defineConfig } from 'vite';

// GitHub Pages serves from /Prizing_demo/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Prizing_demo/' : '/',
}));
