import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Proxy `/api` → Spring Boot (default :8090). Use 127.0.0.1 to avoid Windows IPv6 localhost issues.
 * Override: `API_PROXY_TARGET=http://127.0.0.1:8090` in `.env.development`
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.API_PROXY_TARGET || "http://127.0.0.1:8090";

  return {
    plugins: [react()],
    define: {
      global: "globalThis",
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
        "/ws": {
          target: apiTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
