import type { WorkerRequest, WorkerResponse } from "./types";
import type { RenderState } from "../types/chess";
import type { WasmModule } from "./loadWasm";
import { loadWasm } from "./loadWasm";
import type {
  ChessGame as ChessGameType,
  get_legal_moves as GetLegalMovesType,
} from "../../wasm-pkg/chess_wasm.js";

// Module-level state
let game: ChessGameType | null = null;
let getLegalMovesFn: typeof GetLegalMovesType | null = null;

function postResponse(response: WorkerResponse): void {
  postMessage(response);
}

function buildRenderState(g: ChessGameType): RenderState {
  const fen = g.current_fen();
  return {
    fen,
    legalMoves: getLegalMovesFn!(fen),
    status: g.game_status(),
    canUndo: g.can_undo(),
    canRedo: g.can_redo(),
  };
}

export async function handleMessage(
  event: MessageEvent<WorkerRequest>
): Promise<void> {
  const { data } = event;

  switch (data.type) {
    case "INIT": {
      try {
        const wasm: WasmModule = await loadWasm();
        getLegalMovesFn = wasm.get_legal_moves;
        game = new wasm.ChessGame();
        postResponse({ type: "READY" });
        postResponse({
          type: "STATE_UPDATE",
          payload: buildRenderState(game),
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        postResponse({ type: "ERROR", payload: { message } });
      }
      break;
    }
    case "APPLY_MOVE": {
      if (!game || !getLegalMovesFn) {
        postResponse({
          type: "ERROR",
          payload: { message: "Engine not initialized" },
        });
        return;
      }
      try {
        game.apply_move(data.payload.uciMove);
        postResponse({
          type: "STATE_UPDATE",
          payload: buildRenderState(game),
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        postResponse({ type: "ERROR", payload: { message } });
      }
      break;
    }
    case "UNDO": {
      if (!game || !getLegalMovesFn) {
        postResponse({
          type: "ERROR",
          payload: { message: "Engine not initialized" },
        });
        return;
      }
      game.undo();
      postResponse({
        type: "STATE_UPDATE",
        payload: buildRenderState(game),
      });
      break;
    }
    case "REDO": {
      if (!game || !getLegalMovesFn) {
        postResponse({
          type: "ERROR",
          payload: { message: "Engine not initialized" },
        });
        return;
      }
      game.redo();
      postResponse({
        type: "STATE_UPDATE",
        payload: buildRenderState(game),
      });
      break;
    }
  }
}

// Exported for testing: reset module-level state
export function _resetForTesting(): void {
  game = null;
  getLegalMovesFn = null;
}

// Attach to self.onmessage when running as a Web Worker
onmessage = (event: MessageEvent<WorkerRequest>) => {
  void handleMessage(event);
};
