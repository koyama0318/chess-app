import { describe, it, expect } from "vitest";
import { parseFen } from "../fen";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("parseFen", () => {
  it("returns a map with 32 pieces for starting position", () => {
    const board = parseFen(START_FEN);
    expect(board.size).toBe(32);
  });

  it("places white king on e1", () => {
    const board = parseFen(START_FEN);
    expect(board.get("e1")).toBe("K");
  });

  it("places black king on e8", () => {
    const board = parseFen(START_FEN);
    expect(board.get("e8")).toBe("k");
  });

  it("places white pawns on rank 2", () => {
    const board = parseFen(START_FEN);
    for (const file of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      expect(board.get(`${file}2`)).toBe("P");
    }
  });

  it("places black pawns on rank 7", () => {
    const board = parseFen(START_FEN);
    for (const file of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
      expect(board.get(`${file}7`)).toBe("p");
    }
  });

  it("returns empty map for empty board FEN", () => {
    const board = parseFen("8/8/8/8/8/8/8/8 w - - 0 1");
    expect(board.size).toBe(0);
  });

  it("handles empty squares (numbers in FEN)", () => {
    const board = parseFen(START_FEN);
    expect(board.get("e4")).toBeUndefined();
    expect(board.get("d5")).toBeUndefined();
  });

  it("places white queen on d1", () => {
    const board = parseFen(START_FEN);
    expect(board.get("d1")).toBe("Q");
  });
});
