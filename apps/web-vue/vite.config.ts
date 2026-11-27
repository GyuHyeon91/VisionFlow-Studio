import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 53712,
    strictPort: true,
    host: '0.0.0.0',
    fs: { allow: ['../..', '.'] },
  },
});
