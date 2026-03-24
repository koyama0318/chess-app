import type { RenderState } from "../types/chess";
import type { WorkerRequest, WorkerResponse } from "./types";

type WasmModule = typeof import("../../wasm-pkg/chess_wasm");
type ChessGameInstance = InstanceType<WasmModule["ChessGame"]>;

let wasm: WasmModule | null = null;
let game: ChessGameInstance | null = null;

function postResponse(response: WorkerResponse): void {
  postMessage(response);
}

function postError(e: unknown): void {
  postResponse({ type: "ERROR", payload: { message: String(e) } });
}

function buildRenderState(): RenderState {
  if (!wasm || !game) throw new Error("WASM not initialized");
  const fen = game.current_fen();
  return {
    fen,
    legalMoves: Array.from(wasm.get_legal_moves(fen)),
    status: game.game_status(),
    canUndo: game.can_undo(),
    canRedo: game.can_redo(),
  };
}

export async function handleMessage(
  event: MessageEvent<WorkerRequest>
): Promise<void> {
  const { data } = event;

  switch (data.type) {
    case "INIT": {
      try {
        const mod = await import("../../wasm-pkg/chess_wasm");
        await mod.default();
        wasm = mod;
        game = new mod.ChessGame();
        postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      } catch (e) {
        postError(e);
      }
      break;
    }
    case "APPLY_MOVE": {
      try {
        if (!wasm || !game) throw new Error("Not initialized");
        game.apply_move(data.payload.uciMove);
        postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      } catch (e) {
        postError(e);
      }
      break;
    }
    case "UNDO":
      postError("not implemented");
      break;
    case "REDO":
      postError("not implemented");
      break;
  }
}

// Attach to self.onmessage when running as a Web Worker
onmessage = handleMessage;
