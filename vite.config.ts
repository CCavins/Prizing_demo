import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves from /Prizing_cards_demo/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/Prizing_cards_demo/' : '/',
}));
