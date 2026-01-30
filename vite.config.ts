import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: 'src/main/index.ts',
        onstart(options) {
          options.startup();
        },
        vite: {
          build: {
            outDir: 'dist/main',
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
});
