import type { RenderState } from "../types/chess";
import type { WorkerRequest, WorkerResponse } from "./types";
import { clearMoveEvents } from "../utils/storage";

type WasmModule = typeof import("../../wasm-pkg/chess_wasm");
type ChessGameInstance = InstanceType<WasmModule["ChessGame"]>;

let game: ChessGameInstance | null = null;
let lastMove: { from: string; to: string } | null = null;

function postResponse(response: WorkerResponse): void {
  postMessage(response);
}

function getRenderState(): RenderState {
  if (!game) throw new Error("Game not initialized");
  const state = game.render_state() as unknown as RenderState;
  state.lastMove = lastMove;
  return state;
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
        lastMove = null;
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
        const moves = data.payload.uciMoves;
        for (const move of moves) {
          game!.apply_move(move);
        }
        if (moves.length > 0) {
          const last = moves[moves.length - 1];
          lastMove = { from: last.slice(0, 2), to: last.slice(2, 4) };
        } else {
          lastMove = null;
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
        const uci = data.payload.uciMove;
        game.apply_move(uci);
        lastMove = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
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
        lastMove = null;
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
        lastMove = null;
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
        clearMoveEvents();
        lastMove = null;
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
        lastMove = null;
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
