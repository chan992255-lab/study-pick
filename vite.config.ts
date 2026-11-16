import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel·로컬 미리보기 모두 도메인 루트(/)에서 서비스된다.
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { port: 5173, host: true },
  build: { outDir: 'dist', sourcemap: false },
});
