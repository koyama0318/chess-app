import type { RenderState } from "../types/chess";

export type WorkerRequest =
  | { type: "INIT" }
  | { type: "INIT_FROM_EVENTS"; payload: { uciMoves: string[] } }
  | { type: "APPLY_MOVE"; payload: { uciMove: string } }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET" };

export type WorkerResponse =
  | { type: "STATE_UPDATE"; payload: RenderState }
  | { type: "ERROR"; payload: { message: string } };
