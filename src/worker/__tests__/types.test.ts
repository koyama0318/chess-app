import { describe, it, expect } from "vitest";
import type { WorkerRequest, WorkerResponse } from "../types";
import { GameStatus } from "../../types/chess";

describe("WorkerRequest discriminated union", () => {
  it("allows INIT request", () => {
    const req: WorkerRequest = { type: "INIT" };
    expect(req.type).toBe("INIT");
  });

  it("allows APPLY_MOVE request with uciMove payload", () => {
    const req: WorkerRequest = {
      type: "APPLY_MOVE",
      payload: { uciMove: "e2e4" },
    };
    expect(req.type).toBe("APPLY_MOVE");
    if (req.type === "APPLY_MOVE") {
      expect(req.payload.uciMove).toBe("e2e4");
    }
  });

  it("allows UNDO request", () => {
    const req: WorkerRequest = { type: "UNDO" };
    expect(req.type).toBe("UNDO");
  });

  it("allows REDO request", () => {
    const req: WorkerRequest = { type: "REDO" };
    expect(req.type).toBe("REDO");
  });
});

describe("WorkerResponse discriminated union", () => {
  it("allows STATE_UPDATE response with RenderState payload", () => {
    const resp: WorkerResponse = {
      type: "STATE_UPDATE",
      payload: {
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
        board: {},
        legalMoves: ["e7e5"],
        status: GameStatus.InProgress,
        isCheck: false,
        canUndo: true,
        canRedo: false,
        currentTurn: "black" as const,
      },
    };
    expect(resp.type).toBe("STATE_UPDATE");
    if (resp.type === "STATE_UPDATE") {
      expect(resp.payload.fen).toContain("4P3");
    }
  });

  it("allows ERROR response with message payload", () => {
    const resp: WorkerResponse = {
      type: "ERROR",
      payload: { message: "something went wrong" },
    };
    expect(resp.type).toBe("ERROR");
    if (resp.type === "ERROR") {
      expect(resp.payload.message).toBe("something went wrong");
    }
  });
});
