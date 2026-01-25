
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Ensures the API_KEY environment variable from Netlify is injected into the build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild', // Using built-in esbuild instead of optional terser
  }
});
