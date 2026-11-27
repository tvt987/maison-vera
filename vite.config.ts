import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/three/') || id.includes('\\three\\')) {
              return 'three';
            }
            if (
              id.includes('/react/') ||
              id.includes('\\react\\') ||
              id.includes('/react-dom/') ||
              id.includes('\\react-dom\\') ||
              id.includes('/scheduler/') ||
              id.includes('\\scheduler\\')
            ) {
              return 'react';
            }
            if (
              id.includes('/gsap/') ||
              id.includes('\\gsap\\') ||
              id.includes('/lenis/') ||
              id.includes('\\lenis\\')
            ) {
              return 'motion';
            }
            if (id.includes('/zod/') || id.includes('\\zod\\')) {
              return 'engines';
            }
            if (id.includes('/lucide-react/') || id.includes('\\lucide-react\\')) {
              return 'icons';
            }
          }
          if (id.includes('/src/engines/') || id.includes('\\src\\engines\\')) {
            return 'engines';
          }
          return undefined;
        },
      },
    },
  },
});
