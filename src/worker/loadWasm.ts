export type WasmModule = typeof import("../../wasm-pkg/chess_wasm.js");

export async function loadWasm(): Promise<WasmModule> {
  const wasm = await import("../../wasm-pkg/chess_wasm.js");
  await wasm.default();
  return wasm;
}
