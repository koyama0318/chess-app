import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        // Stub the WASM module so Vite can resolve it during tests.
        // vi.mock in chess.worker.test.ts overrides this at runtime.
        find: /.*\/wasm-pkg\/chess_wasm$/,
        replacement: fileURLToPath(new URL("src/__mocks__/chess_wasm.ts", import.meta.url)),
      },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.claude/**"],
  },
});
