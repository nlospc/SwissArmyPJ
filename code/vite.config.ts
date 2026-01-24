import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry point
        entry: 'src/main/index.ts',
        vite: {
          resolve: {
            alias: {
              '@shared': path.resolve(__dirname, './src/shared'),
            },
          },
          build: {
            outDir: 'dist/main',
            emptyOutDir: true,
            target: 'node14',
            rollupOptions: {
              external: ['electron', 'better-sqlite3', 'electron-store']
            }
          }
        }
      },
      {
        // Preload script
        entry: 'src/preload/index.ts',
        vite: {
          resolve: {
            alias: {
              '@shared': path.resolve(__dirname, './src/shared'),
            },
          },
          build: {
            outDir: 'dist/preload'
          }
        }
      }
    ])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  },
  base: './',
  server: {
    port: 5173
  }
});
