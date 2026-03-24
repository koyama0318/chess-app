import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";

export default defineConfig({
  root: "src",
  plugins: [react(), wasm()],
  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
  build: {
    target: "esnext",
    outDir: "../dist",
    emptyOutDir: true,
  },
});
