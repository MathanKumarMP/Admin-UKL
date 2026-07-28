import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.JPG', '**/*.jpg', '**/*.png', '**/*.PNG', '**/*.jpeg', '**/*.JPEG'],
  server: {
    port: 3000,
    host: true
  }
});
