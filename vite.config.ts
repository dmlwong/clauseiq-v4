import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.GITHUB_PAGES ? "/clauseiq-v4/" : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    fs: {
      allow: [
        path.resolve(__dirname, "."),
        path.resolve(__dirname, "../../../efficio-orbit/packages/orbit"),
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
      "@orbit": path.resolve(__dirname, "src/vendor/orbit/dist/index.js"),
      "@orbit-styles": path.resolve(__dirname, "src/vendor/orbit/styles.css"),
      "@orbit-tokens": path.resolve(__dirname, "src/vendor/orbit/tokens.css"),
      "@orbit-fonts": path.resolve(__dirname, "src/vendor/orbit/fonts.css"),
    },
  },
}));
