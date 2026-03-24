import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBoardInteraction } from "../useBoardInteraction";
import type { RenderState } from "../../types/chess";
import { GameStatus } from "../../types/chess";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function makeRenderState(overrides?: Partial<RenderState>): RenderState {
  return {
    fen: START_FEN,
    board: {},
    legalMoves: ["e2e4", "e2e3", "d2d4", "d2d3", "a2a3", "a2a4"],
    status: GameStatus.InProgress,
    isCheck: false,
    canUndo: false,
    canRedo: false,
    currentTurn: "white",
    ...overrides,
  };
}

describe("useBoardInteraction", () => {
  it("starts with no selection", () => {
    const onMove = vi.fn();
    const { result } = renderHook(() =>
      useBoardInteraction(makeRenderState(), onMove)
    );
    expect(result.current.selectedSquare).toBeNull();
    expect(result.current.legalTargets).toEqual([]);
    expect(result.current.pendingPromotion).toBeNull();
  });

  it("selects a white piece on white's turn", () => {
    const onMove = vi.fn();
    const { result } = renderHook(() =>
      useBoardInteraction(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handleSquareClick("e2");
    });
    expect(result.current.selectedSquare).toBe("e2");
  });

  it("shows legal targets for selected piece", () => {
    const onMove = vi.fn();
    const { result } = renderHook(() =>
      useBoardInteraction(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handleSquareClick("e2");
    });
    expect(result.current.legalTargets).toContain("e4");
    expect(result.current.legalTargets).toContain("e3");
  });

  it("calls onMove when clicking a legal target", () => {
    const onMove = vi.fn();
    const { result } = renderHook(() =>
      useBoardInteraction(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handleSquareClick("e2");
    });
    act(() => {
      result.current.handleSquareClick("e4");
    });
    expect(onMove).toHaveBeenCalledWith("e2e4");
    expect(result.current.selectedSquare).toBeNull();
  });

  it("deselects when clicking non-legal square", () => {
    const onMove = vi.fn();
    const { result } = renderHook(() =>
      useBoardInteraction(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handleSquareClick("e2");
    });
    act(() => {
      result.current.handleSquareClick("e5");
    });
    expect(result.current.selectedSquare).toBeNull();
    expect(onMove).not.toHaveBeenCalled();
  });

  it("cannot select black piece on white's turn", () => {
    const onMove = vi.fn();
    const { result } = renderHook(() =>
      useBoardInteraction(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handleSquareClick("e7");
    });
    expect(result.current.selectedSquare).toBeNull();
  });

  it("does nothing with null renderState", () => {
    const onMove = vi.fn();
    const { result } = renderHook(() =>
      useBoardInteraction(null, onMove)
    );
    act(() => {
      result.current.handleSquareClick("e2");
    });
    expect(result.current.selectedSquare).toBeNull();
  });

  describe("pawn promotion", () => {
    const promotionFen = "8/4P3/8/8/8/8/8/8 w - - 0 1";
    const promotionMoves = ["e7e8q", "e7e8r", "e7e8b", "e7e8n"];

    it("sets pendingPromotion instead of calling onMove directly", () => {
      const onMove = vi.fn();
      const { result } = renderHook(() =>
        useBoardInteraction(
          makeRenderState({ fen: promotionFen, legalMoves: promotionMoves }),
          onMove
        )
      );
      act(() => {
        result.current.handleSquareClick("e7");
      });
      act(() => {
        result.current.handleSquareClick("e8");
      });
      expect(onMove).not.toHaveBeenCalled();
      expect(result.current.pendingPromotion).toEqual({ from: "e7", to: "e8" });
    });

    it("calls onMove with correct UCI when handlePromotionSelect is called", () => {
      const onMove = vi.fn();
      const { result } = renderHook(() =>
        useBoardInteraction(
          makeRenderState({ fen: promotionFen, legalMoves: promotionMoves }),
          onMove
        )
      );
      act(() => {
        result.current.handleSquareClick("e7");
      });
      act(() => {
        result.current.handleSquareClick("e8");
      });
      act(() => {
        result.current.handlePromotionSelect("r");
      });
      expect(onMove).toHaveBeenCalledWith("e7e8r");
      expect(result.current.pendingPromotion).toBeNull();
      expect(result.current.selectedSquare).toBeNull();
    });

    it("clears pendingPromotion and keeps selection on cancel", () => {
      const onMove = vi.fn();
      const { result } = renderHook(() =>
        useBoardInteraction(
          makeRenderState({ fen: promotionFen, legalMoves: promotionMoves }),
          onMove
        )
      );
      act(() => {
        result.current.handleSquareClick("e7");
      });
      act(() => {
        result.current.handleSquareClick("e8");
      });
      act(() => {
        result.current.handlePromotionCancel();
      });
      expect(onMove).not.toHaveBeenCalled();
      expect(result.current.pendingPromotion).toBeNull();
      expect(result.current.selectedSquare).toBe("e7");
    });
  });
});
