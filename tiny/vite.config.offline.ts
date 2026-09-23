import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";

// Build pro offline použití: jeden klasický skript místo ES modulu, aby se
// aplikace dala otevřít dvojklikem na index.html (file:// blokuje moduly).
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "tiny-offline-html",
      closeBundle() {
        const out = path.resolve(__dirname, "offline/index.html");
        let html = fs.readFileSync(out, "utf8");
        html = html
          .replace(/\s*type="module"/g, " defer")
          .replace(/\s*crossorigin/g, "")
          .replace(/<link[^>]+rel="modulepreload"[^>]*>\s*/g, "");
        fs.writeFileSync(out, html);
      },
    },
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    outDir: "offline",
    emptyOutDir: true,
    modulePreload: false,
    rollupOptions: {
      output: {
        format: "iife",
        inlineDynamicImports: true,
        entryFileNames: "tiny.js",
        assetFileNames: "[name][extname]",
      },
    },
  },
});
