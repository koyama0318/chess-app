import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { Board } from "../Board";
import type { RenderState } from "../../types/chess";

// Mock WASM module
vi.mock("../../../wasm-pkg/chess_wasm.js", () => ({}));

afterEach(() => {
  cleanup();
});

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function makeRenderState(overrides?: Partial<RenderState>): RenderState {
  return {
    fen: INITIAL_FEN,
    legalMoves: [],
    status: 0,
    isCheck: false,
    canUndo: false,
    canRedo: false,
    currentTurn: "white",
    board: {},
    ...overrides,
  };
}

// Coordinate label spans use aria-hidden="true" to distinguish from Piece spans
const LABEL_SELECTOR = 'span[aria-hidden="true"]';

describe("Board coordinate labels", () => {
  it("renders rank labels 8-1 on the left edge (normal orientation)", () => {
    const { container } = render(
      <Board
        renderState={makeRenderState()}
        onMove={vi.fn()}
        flipped={false}
      />,
    );

    const squares = container.querySelectorAll("[data-square]");
    const expectedRanks = ["8", "7", "6", "5", "4", "3", "2", "1"];

    expectedRanks.forEach((rankNum, rowIdx) => {
      const sq = squares[rowIdx * 8];
      const label = sq.querySelector(LABEL_SELECTOR);
      expect(label).not.toBeNull();
      expect(label!.textContent).toBe(rankNum);
    });
  });

  it("renders file labels a-h on the bottom edge (normal orientation)", () => {
    const { container } = render(
      <Board
        renderState={makeRenderState()}
        onMove={vi.fn()}
        flipped={false}
      />,
    );

    const squares = container.querySelectorAll("[data-square]");
    const expectedFiles = ["a", "b", "c", "d", "e", "f", "g", "h"];

    expectedFiles.forEach((file, colIdx) => {
      const sq = squares[56 + colIdx];
      const labels = sq.querySelectorAll(LABEL_SELECTOR);
      const fileLabel = Array.from(labels).find((s) => s.textContent === file);
      expect(fileLabel).toBeDefined();
    });
  });

  it("renders rank labels 1-8 on the left edge when flipped", () => {
    const { container } = render(
      <Board
        renderState={makeRenderState()}
        onMove={vi.fn()}
        flipped={true}
      />,
    );

    const squares = container.querySelectorAll("[data-square]");
    const expectedRanks = ["1", "2", "3", "4", "5", "6", "7", "8"];

    expectedRanks.forEach((rankNum, rowIdx) => {
      const sq = squares[rowIdx * 8];
      const label = sq.querySelector(LABEL_SELECTOR);
      expect(label).not.toBeNull();
      expect(label!.textContent).toBe(rankNum);
    });
  });

  it("renders file labels h-a on the bottom edge when flipped", () => {
    const { container } = render(
      <Board
        renderState={makeRenderState()}
        onMove={vi.fn()}
        flipped={true}
      />,
    );

    const squares = container.querySelectorAll("[data-square]");
    const expectedFiles = ["h", "g", "f", "e", "d", "c", "b", "a"];

    expectedFiles.forEach((file, colIdx) => {
      const sq = squares[56 + colIdx];
      const labels = sq.querySelectorAll(LABEL_SELECTOR);
      const fileLabel = Array.from(labels).find((s) => s.textContent === file);
      expect(fileLabel).toBeDefined();
    });
  });

  it("does not render coordinate labels on non-edge squares", () => {
    const { container } = render(
      <Board
        renderState={makeRenderState()}
        onMove={vi.fn()}
        flipped={false}
      />,
    );

    const squares = container.querySelectorAll("[data-square]");
    // Square at row 0, col 1 (b8) — not leftmost, not bottom row
    const sq = squares[1];
    const labels = sq.querySelectorAll(LABEL_SELECTOR);
    expect(labels.length).toBe(0);
  });

  it("label spans have aria-hidden attribute", () => {
    const { container } = render(
      <Board
        renderState={makeRenderState()}
        onMove={vi.fn()}
        flipped={false}
      />,
    );

    const labels = container.querySelectorAll(LABEL_SELECTOR);
    expect(labels.length).toBeGreaterThan(0);
    labels.forEach((label) => {
      expect(label.getAttribute("aria-hidden")).toBe("true");
    });
  });
});
