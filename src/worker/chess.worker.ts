import type { RenderState } from "../types/chess";
import type { WorkerRequest, WorkerResponse } from "./types";

type WasmModule = typeof import("../../wasm-pkg/chess_wasm");
type ChessGameInstance = InstanceType<WasmModule["ChessGame"]>;

let wasm: WasmModule | null = null;
let game: ChessGameInstance | null = null;

function postResponse(response: WorkerResponse): void {
  postMessage(response);
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
        postResponse({
          type: "ERROR",
          payload: { message: String(e) },
        });
      }
      break;
    }
    case "INIT_FROM_EVENTS": {
      try {
        const mod = await import("../../wasm-pkg/chess_wasm");
        await mod.default();
        wasm = mod;
        game = new mod.ChessGame();
        for (const move of data.payload.uciMoves) {
          game.apply_move(move);
        }
        postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      } catch (e) {
        postResponse({
          type: "ERROR",
          payload: { message: String(e) },
        });
      }
      break;
    }
    case "APPLY_MOVE": {
      try {
        if (!game) throw new Error("Not initialized");
        game.apply_move(data.payload.uciMove);
        postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      } catch (e) {
        postResponse({
          type: "ERROR",
          payload: { message: String(e) },
        });
      }
      break;
    }
    case "UNDO": {
      try {
        if (!game) throw new Error("Not initialized");
        game.undo();
        postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      } catch (e) {
        postResponse({
          type: "ERROR",
          payload: { message: String(e) },
        });
      }
      break;
    }
    case "REDO": {
      try {
        if (!game) throw new Error("Not initialized");
        game.redo();
        postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      } catch (e) {
        postResponse({
          type: "ERROR",
          payload: { message: String(e) },
        });
      }
      break;
    }
  }
}

// Attach to self.onmessage when running as a Web Worker
onmessage = handleMessage;
