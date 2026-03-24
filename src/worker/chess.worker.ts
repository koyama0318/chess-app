import type { RenderState } from "../types/chess";
import type { WorkerRequest, WorkerResponse } from "./types";

type WasmModule = typeof import("../../wasm-pkg/chess_wasm");
type ChessGameInstance = InstanceType<WasmModule["ChessGame"]>;

let game: ChessGameInstance | null = null;

function postResponse(response: WorkerResponse): void {
  postMessage(response);
}

function getRenderState(): RenderState {
  if (!game) throw new Error("Game not initialized");
  return game.render_state() as unknown as RenderState;
}

async function initWasm(fenSnapshot?: string | null): Promise<void> {
  const mod = await import("../../wasm-pkg/chess_wasm");
  await mod.default();
  if (fenSnapshot) {
    game = mod.ChessGame.new_from_fen(fenSnapshot) as ChessGameInstance;
  } else {
    game = new mod.ChessGame();
  }
}

export async function handleMessage(
  event: MessageEvent<WorkerRequest>
): Promise<void> {
  const { data } = event;

  switch (data.type) {
    case "INIT": {
      try {
        await initWasm();
        postResponse({ type: "STATE_UPDATE", payload: getRenderState() });
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
        await initWasm(data.payload.fenSnapshot);
        for (const move of data.payload.uciMoves) {
          game!.apply_move(move);
        }
        postResponse({ type: "STATE_UPDATE", payload: getRenderState() });
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
        if (!game) throw new Error("Game not initialized");
        game.apply_move(data.payload.uciMove);
        postResponse({ type: "STATE_UPDATE", payload: getRenderState() });
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
        if (!game) throw new Error("Game not initialized");
        game.undo();
        postResponse({ type: "STATE_UPDATE", payload: getRenderState() });
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
        if (!game) throw new Error("Game not initialized");
        game.redo();
        postResponse({ type: "STATE_UPDATE", payload: getRenderState() });
      } catch (e) {
        postResponse({
          type: "ERROR",
          payload: { message: String(e) },
        });
      }
      break;
    }
    case "RESET": {
      try {
        if (!game) throw new Error("Game not initialized");
        game.reset();
        localStorage.removeItem("chess_events");
        localStorage.removeItem("chess_snapshot");
        postResponse({ type: "STATE_UPDATE", payload: getRenderState() });
      } catch (e) {
        postResponse({
          type: "ERROR",
          payload: { message: String(e) },
        });
      }
      break;
    }
    case "INIT_FROM_FEN": {
      try {
        const mod = await import("../../wasm-pkg/chess_wasm");
        await mod.default();
        game = mod.ChessGame.from_fen(data.payload.fen) as ChessGameInstance;
        postResponse({ type: "STATE_UPDATE", payload: getRenderState() });
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
