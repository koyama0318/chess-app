import { describe, it, expect } from "vitest";
import { GameStatus } from "../chess";
import type { RenderState } from "../chess";

describe("GameStatus const enum", () => {
  it("has InProgress = 0", () => {
    expect(GameStatus.InProgress).toBe(0);
  });

  it("has Check = 1", () => {
    expect(GameStatus.Check).toBe(1);
  });

  it("has Checkmate = 2", () => {
    expect(GameStatus.Checkmate).toBe(2);
  });

  it("has Stalemate = 3", () => {
    expect(GameStatus.Stalemate).toBe(3);
  });

  it("has Draw = 4", () => {
    expect(GameStatus.Draw).toBe(4);
  });
});

describe("RenderState", () => {
  it("satisfies the interface shape", () => {
    const state: RenderState = {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      legalMoves: ["e2e4", "d2d4"],
      status: GameStatus.InProgress,
      canUndo: false,
      canRedo: false,
    };
    expect(state.fen).toBe(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );
    expect(state.legalMoves).toEqual(["e2e4", "d2d4"]);
    expect(state.status).toBe(GameStatus.InProgress);
    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(false);
  });
});
