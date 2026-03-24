import type { RenderState } from "../types/chess";
import type { WorkerRequest, WorkerResponse } from "./types";

type WasmModule = typeof import("../../wasm-pkg/chess_wasm");
type ChessGameInstance = InstanceType<WasmModule["ChessGame"]>;

let game: ChessGameInstance | null = null;
let stockfish: Worker | null = null;

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

async function initStockfish(): Promise<void> {
  // Terminate any previous Stockfish instance to avoid leaks
  if (stockfish) {
    stockfish.terminate();
    stockfish = null;
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker("/stockfish-18-lite-single.js");
    stockfish = worker;

    worker.onerror = (e) => reject(e);
    worker.onmessage = (e: MessageEvent<string>) => {
      if (e.data === "uciok") {
        worker.postMessage("isready");
      } else if (e.data === "readyok") {
        resolve();
      }
    };

    worker.postMessage("uci");
  });
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
    case "INIT_ENGINE": {
      try {
        await initStockfish();
        postResponse({ type: "ENGINE_READY" });
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
