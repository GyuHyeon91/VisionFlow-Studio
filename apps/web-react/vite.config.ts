import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // 다른 프로젝트와 겹치지 않는 이 프로젝트 전용 포트
    port: 53710,
    strictPort: true,
    host: '0.0.0.0',
    // 루트 configs/app.config.json 을 직접 import 하기 위해 워크스페이스 루트 허용
    fs: {
      allow: ['../..', '.'],
    },
  },
  preview: {
    port: 53710,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
