import type { WorkerRequest, WorkerResponse } from "./types";
import { type RenderState, type GameStatus } from "../types/chess";
import type { WasmModule } from "./loadWasm";
import { loadWasm } from "./loadWasm";

// Module-level state: both set together during INIT
let engine: { game: WasmModule["ChessGame"]["prototype"]; getLegalMoves: WasmModule["get_legal_moves"] } | null = null;

function postResponse(response: WorkerResponse): void {
  postMessage(response);
}

function buildRenderState(): RenderState {
  const g = engine!.game;
  const fen = g.current_fen();
  return {
    fen,
    legalMoves: engine!.getLegalMoves(fen),
    status: g.game_status() as GameStatus,
    canUndo: g.can_undo(),
    canRedo: g.can_redo(),
  };
}

function requireEngine(): boolean {
  if (!engine) {
    postResponse({ type: "ERROR", payload: { message: "Engine not initialized" } });
    return false;
  }
  return true;
}

export async function handleMessage(
  event: MessageEvent<WorkerRequest>
): Promise<void> {
  const { data } = event;

  switch (data.type) {
    case "INIT": {
      try {
        const wasm = await loadWasm();
        const game = new wasm.ChessGame();
        engine = { game, getLegalMoves: wasm.get_legal_moves };
        postResponse({ type: "READY" });
        postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        postResponse({ type: "ERROR", payload: { message } });
      }
      break;
    }
    case "APPLY_MOVE": {
      if (!requireEngine()) return;
      try {
        engine!.game.apply_move(data.payload.uciMove);
        postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        postResponse({ type: "ERROR", payload: { message } });
      }
      break;
    }
    case "UNDO": {
      if (!requireEngine()) return;
      try {
        engine!.game.undo();
        postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        postResponse({ type: "ERROR", payload: { message } });
      }
      break;
    }
    case "REDO": {
      if (!requireEngine()) return;
      try {
        engine!.game.redo();
        postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        postResponse({ type: "ERROR", payload: { message } });
      }
      break;
    }
  }
}

// Exported for testing: reset module-level state
export function _resetForTesting(): void {
  engine = null;
}

// Attach to self.onmessage when running as a Web Worker
onmessage = (event: MessageEvent<WorkerRequest>) => {
  void handleMessage(event);
};
