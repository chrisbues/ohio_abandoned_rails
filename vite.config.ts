import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When deployed to GitHub Pages the app is served from
// https://<user>.github.io/ohio_abandoned_rails/ so assets need that base path.
// Locally (dev / preview) we serve from root.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/ohio_abandoned_rails/' : '/',
}));
