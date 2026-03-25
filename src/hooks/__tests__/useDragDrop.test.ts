import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDragDrop } from "../useDragDrop";
import type { RenderState } from "../../types/chess";
import { GameStatus } from "../../types/chess";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function makeRenderState(partial: Partial<RenderState> = {}): RenderState {
  return {
    fen: STARTING_FEN,
    board: {},
    legalMoves: ["e2e4", "e2e3", "d2d4"],
    status: GameStatus.InProgress,
    isCheck: false,
    canUndo: false,
    canRedo: false,
    currentTurn: "white",
    lastMove: null,
    ...partial,
  };
}

function makePointerEvent(
  type: string,
  props: Partial<React.PointerEvent<HTMLElement>>
): React.PointerEvent<HTMLElement> {
  const el = document.createElement("div");
  el.setPointerCapture = vi.fn();
  return {
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    currentTarget: el,
    target: el,
    type,
    ...props,
  } as unknown as React.PointerEvent<HTMLElement>;
}

describe("useDragDrop", () => {
  let onMove: ReturnType<typeof vi.fn<(uciMove: string) => void>>;

  beforeEach(() => {
    onMove = vi.fn<(uciMove: string) => void>();
  });

  it("starts with isDragging false", () => {
    const { result } = renderHook(() =>
      useDragDrop(makeRenderState(), onMove)
    );
    expect(result.current.dragState.isDragging).toBe(false);
  });

  it("sets isDragging true on pointerDown on own piece", () => {
    const { result } = renderHook(() =>
      useDragDrop(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handlePointerDown(makePointerEvent("pointerdown", {}), "e2");
    });
    expect(result.current.dragState.isDragging).toBe(true);
    expect(result.current.dragState.draggedFrom).toBe("e2");
  });

  it("does not start drag on opponent piece", () => {
    const { result } = renderHook(() =>
      useDragDrop(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handlePointerDown(makePointerEvent("pointerdown", {}), "e7");
    });
    expect(result.current.dragState.isDragging).toBe(false);
  });

  it("does not start drag on empty square", () => {
    const { result } = renderHook(() =>
      useDragDrop(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handlePointerDown(makePointerEvent("pointerdown", {}), "e4");
    });
    expect(result.current.dragState.isDragging).toBe(false);
  });

  it("updates dragX/dragY on pointerMove", () => {
    const { result } = renderHook(() =>
      useDragDrop(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handlePointerDown(makePointerEvent("pointerdown", {}), "e2");
    });
    act(() => {
      result.current.handlePointerMove(
        makePointerEvent("pointermove", { clientX: 100, clientY: 200 })
      );
    });
    expect(result.current.dragState.dragX).toBe(100);
    expect(result.current.dragState.dragY).toBe(200);
  });

  it("calls onMove with legal UCI on pointerUp over valid target", () => {
    const squareEl = document.createElement("div");
    squareEl.setAttribute("data-square", "e4");
    Object.defineProperty(document, "elementFromPoint", { configurable: true, writable: true, value: vi.fn().mockReturnValue(squareEl) });

    const { result } = renderHook(() =>
      useDragDrop(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handlePointerDown(makePointerEvent("pointerdown", {}), "e2");
    });
    act(() => {
      result.current.handlePointerUp(makePointerEvent("pointerup", {}));
    });
    expect(onMove).toHaveBeenCalledWith("e2e4");
    expect(result.current.dragState.isDragging).toBe(false);
  });

  it("does not call onMove on illegal target square", () => {
    const squareEl = document.createElement("div");
    squareEl.setAttribute("data-square", "e5");
    Object.defineProperty(document, "elementFromPoint", { configurable: true, writable: true, value: vi.fn().mockReturnValue(squareEl) });

    const { result } = renderHook(() =>
      useDragDrop(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handlePointerDown(makePointerEvent("pointerdown", {}), "e2");
    });
    act(() => {
      result.current.handlePointerUp(makePointerEvent("pointerup", {}));
    });
    expect(onMove).not.toHaveBeenCalled();
    expect(result.current.dragState.isDragging).toBe(false);
  });

  it("auto-promotes pawn to queen when reaching rank 8", () => {
    // White pawn on e7, legal move e7e8
    const squareEl = document.createElement("div");
    squareEl.setAttribute("data-square", "e8");
    Object.defineProperty(document, "elementFromPoint", { configurable: true, writable: true, value: vi.fn().mockReturnValue(squareEl) });

    const renderState = makeRenderState({
      fen: "8/4P3/8/8/8/8/8/8 w - - 0 1",
      legalMoves: ["e7e8q", "e7e8r", "e7e8b", "e7e8n"],
    });

    const { result } = renderHook(() => useDragDrop(renderState, onMove));
    act(() => {
      result.current.handlePointerDown(makePointerEvent("pointerdown", {}), "e7");
    });
    act(() => {
      result.current.handlePointerUp(makePointerEvent("pointerup", {}));
    });
    expect(onMove).toHaveBeenCalledWith("e7e8q");
  });

  it("resets drag state on pointerUp regardless of move validity", () => {
    Object.defineProperty(document, "elementFromPoint", { configurable: true, writable: true, value: vi.fn().mockReturnValue(null) });

    const { result } = renderHook(() =>
      useDragDrop(makeRenderState(), onMove)
    );
    act(() => {
      result.current.handlePointerDown(makePointerEvent("pointerdown", {}), "e2");
    });
    act(() => {
      result.current.handlePointerUp(makePointerEvent("pointerup", {}));
    });
    expect(result.current.dragState.isDragging).toBe(false);
    expect(result.current.dragState.draggedFrom).toBeNull();
  });
});
