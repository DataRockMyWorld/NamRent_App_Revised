import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-router")) return "vendor-react";
          if (id.includes("node_modules/@tanstack") || id.includes("node_modules/zustand")) return "vendor-query";
          if (id.includes("node_modules/react-hook-form") || id.includes("node_modules/@hookform") || id.includes("node_modules/zod")) return "vendor-forms";
          if (id.includes("node_modules/recharts")) return "vendor-charts";
          if (id.includes("node_modules/lucide-react") || id.includes("node_modules/date-fns") || id.includes("node_modules/axios")) return "vendor-ui";
        },
      },
    },
  },
});
