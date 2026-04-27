import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // MUST match repo name EXACTLY (case‑sensitive)
  base: '/Petrol-bunk-summary/',
  plugins: [react()],
});
