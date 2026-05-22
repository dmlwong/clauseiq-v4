import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    fs: {
      allow: [
        path.resolve(__dirname, "."),
        "/Users/derekwong/efficio-orbit",
      ],
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime.js"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react/jsx-dev-runtime.js"),
      "@orbit": "/Users/derekwong/efficio-orbit/packages/orbit/dist/index.js",
      "@orbit-styles": "/Users/derekwong/efficio-orbit/packages/orbit/styles.css",
      "@orbit-tokens": "/Users/derekwong/efficio-orbit/packages/orbit/tokens.css",
      "@orbit-fonts": "/Users/derekwong/efficio-orbit/packages/orbit/fonts.css",
    },
  },
}));
