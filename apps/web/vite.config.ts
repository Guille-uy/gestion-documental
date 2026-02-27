import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Surge SPA routing: copy index.html → 200.html so direct URLs work on mobile/refresh
function surge200Plugin() {
  return {
    name: "surge-200",
    closeBundle() {
      try {
        fs.copyFileSync("dist/index.html", "dist/200.html");
        console.log("[surge] dist/200.html created for SPA routing");
      } catch (_) {
        // ignore during dev mode
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), surge200Plugin()],
  resolve: {
    alias: {
      "@dms/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
