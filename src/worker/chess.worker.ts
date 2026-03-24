import type { WorkerRequest, WorkerResponse } from "./types";
import type { RenderState } from "../types/chess";
import init, { ChessGame, get_legal_moves } from "../../wasm-pkg/chess_wasm";

let game: ChessGame | null = null;

function postResponse(response: WorkerResponse): void {
  postMessage(response);
}

function buildRenderState(): RenderState {
  if (!game) throw new Error("Game not initialized");
  const fen = game.current_fen();
  return {
    fen,
    legalMoves: get_legal_moves(fen),
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
      await init();
      game = new ChessGame();
      postResponse({ type: "READY" });
      break;
    }
    case "APPLY_MOVE": {
      if (!game) {
        postResponse({
          type: "ERROR",
          payload: { message: "Game not initialized" },
        });
        return;
      }
      try {
        game.apply_move(data.payload.uciMove);
        postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        postResponse({ type: "ERROR", payload: { message } });
      }
      break;
    }
    case "UNDO": {
      if (!game) {
        postResponse({
          type: "ERROR",
          payload: { message: "Game not initialized" },
        });
        return;
      }
      game.undo();
      postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      break;
    }
    case "REDO": {
      if (!game) {
        postResponse({
          type: "ERROR",
          payload: { message: "Game not initialized" },
        });
        return;
      }
      game.redo();
      postResponse({ type: "STATE_UPDATE", payload: buildRenderState() });
      break;
    }
  }
}

// Attach to self.onmessage when running as a Web Worker
onmessage = (event: MessageEvent<WorkerRequest>) => {
  void handleMessage(event);
};
