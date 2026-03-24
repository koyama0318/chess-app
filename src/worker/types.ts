import type { RenderState } from "../types/chess";

export type WorkerRequest =
  | { type: "INIT" }
  | { type: "INIT_FROM_EVENTS"; payload: { fenSnapshot: string | null; uciMoves: string[] } }
  | { type: "APPLY_MOVE"; payload: { uciMove: string } }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET" }
  | { type: "INIT_ENGINE" };

export type WorkerResponse =
  | { type: "STATE_UPDATE"; payload: RenderState }
  | { type: "ERROR"; payload: { message: string } }
  | { type: "ENGINE_READY" };
