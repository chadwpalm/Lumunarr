import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Backend (Express) the dev server forwards API calls to.
const backend = process.env.BACKEND_URL || "http://localhost:3939";

export default defineConfig({
  plugins: [react()],
  build: {
    // app.js and the Dockerfile serve the build from frontend/production
    outDir: "production",
    emptyOutDir: true,
    sourcemap: false,
    // Single-page app served locally; one ~650 kB bundle is fine
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    proxy: {
      "/backend": backend,
      "/webhook": backend,
    },
  },
});
