import type { RenderState } from "../types/chess";

export type WorkerRequest =
  | { type: "INIT" }
  | { type: "APPLY_MOVE"; payload: { uciMove: string } }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET" };

export type WorkerResponse =
  | { type: "READY" }
  | { type: "STATE_UPDATE"; payload: RenderState }
  | { type: "ERROR"; payload: { message: string } };
