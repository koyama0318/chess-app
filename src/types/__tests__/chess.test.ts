import { describe, it, expect } from "vitest";
import { GameStatus } from "../chess";
import type { RenderState } from "../chess";

describe("GameStatus const enum", () => {
  it("has InProgress = 0", () => {
    expect(GameStatus.InProgress).toBe(0);
  });

  it("has Checkmate = 1", () => {
    expect(GameStatus.Checkmate).toBe(1);
  });

  it("has Stalemate = 2", () => {
    expect(GameStatus.Stalemate).toBe(2);
  });

  it("has Draw = 3", () => {
    expect(GameStatus.Draw).toBe(3);
  });

  it("does not have Check", () => {
    expect((GameStatus as Record<string, unknown>)["Check"]).toBeUndefined();
  });
});

describe("RenderState", () => {
  it("satisfies the interface shape with all required fields", () => {
    const state: RenderState = {
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      board: { e1: "K", d1: "Q" },
      legalMoves: ["e2e4", "d2d4"],
      status: GameStatus.InProgress,
      isCheck: false,
      canUndo: false,
      canRedo: false,
      currentTurn: "white",
    };
    expect(state.fen).toBeTruthy();
    expect(state.board).toEqual({ e1: "K", d1: "Q" });
    expect(state.isCheck).toBe(false);
    expect(state.currentTurn).toBe("white");
    expect(state.status).toBe(GameStatus.InProgress);
  });
});
