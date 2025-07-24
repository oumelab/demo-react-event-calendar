import {defineConfig} from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import {resolve} from "path";
import {visualizer} from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // ANALYZE=true bun run build で分析実行
    ...(process.env.ANALYZE === "true"
      ? [
          visualizer({
            filename: `bundle-analysis/stats-${new Date()
              .toLocaleString("sv-SE", {timeZone: "Asia/Tokyo"})
              .replace(/:/g, "_")
              .replace(/\s/, "+")}.html`,
            open: true,
            gzipSize: true,
            brotliSize: true,
            template: "treemap",
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@shared": resolve(__dirname, "./shared"),
    },
  },
  server: {
    // Postman からのアクセスを許可
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['localhost', '127.0.0.1', 'all'],
    proxy: {
      // 開発環境のみで有効
      "/api": {
        target: "http://localhost:8788",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "router-vendor": ["react-router"],
          "form-vendor": ["react-hook-form", "zod"],
        },
      },
    },
  },
});
