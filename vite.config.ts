import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Petrol-bunk-summary_1/", // ✅ EXACT repo name
});
