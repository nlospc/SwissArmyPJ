import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import path from 'path';

export default defineConfig({
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@radix-ui/react-slot',
      '@radix-ui/react-label',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-tabs',
      '@radix-ui/react-select',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-progress',
      '@radix-ui/react-separator',
      '@radix-ui/react-accordion',
      '@radix-ui/react-avatar',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-toast',
      'lucide-react',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'zustand',
    ],
  },
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
            rollupOptions: {
              external: ['better-sqlite3'],
            },
          },
        },
      },
      {
        entry: 'src/preload/index.ts',
        onstart(options) {
          options.reload();
        },
        vite: {
          build: {
            outDir: 'dist/preload',
          },
        },
      },
    ]),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/lib': path.resolve(__dirname, './src/renderer/lib'),
      '@/components': path.resolve(__dirname, './src/renderer/components'),
      '@/stores': path.resolve(__dirname, './src/renderer/stores'),
      '@/pages': path.resolve(__dirname, './src/renderer/pages'),
    },
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
});
