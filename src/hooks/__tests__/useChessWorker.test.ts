import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChessWorker } from "../useChessWorker";
import type { WorkerResponse } from "../../worker/types";
import * as storage from "../../utils/storage";

// Mock the Worker class
let workerInstance: {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
};

vi.mock("../../worker/chess.worker?worker", () => {
  return {
    default: class MockWorker {
      postMessage = vi.fn();
      terminate = vi.fn();
      onmessage: ((event: MessageEvent<WorkerResponse>) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;

      constructor() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        workerInstance = this;
      }
    },
  };
});

describe("useChessWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in uninit state", () => {
    const { result } = renderHook(() => useChessWorker());
    // After mount, it should have transitioned to initializing
    // and sent INIT
    expect(result.current.initState).toBe("initializing");
    expect(result.current.renderState).toBeNull();
    expect(result.current.lastError).toBeNull();
  });

  it("sends INIT message on mount", () => {
    renderHook(() => useChessWorker());
    expect(workerInstance.postMessage).toHaveBeenCalledWith({ type: "INIT" });
  });

  it("transitions to ready on READY message", () => {
    const { result } = renderHook(() => useChessWorker());

    act(() => {
      workerInstance.onmessage?.(
        new MessageEvent("message", { data: { type: "READY" } })
      );
    });

    expect(result.current.initState).toBe("ready");
  });

  it("transitions to error on ERROR message during initializing", () => {
    const { result } = renderHook(() => useChessWorker());

    act(() => {
      workerInstance.onmessage?.(
        new MessageEvent("message", {
          data: { type: "ERROR", payload: { message: "init failed" } },
        })
      );
    });

    expect(result.current.initState).toBe("error");
    expect(result.current.lastError).toBe("init failed");
  });

  it("stores lastError on post-init ERROR without changing initState", () => {
    const { result } = renderHook(() => useChessWorker());

    act(() => {
      workerInstance.onmessage?.(
        new MessageEvent("message", { data: { type: "READY" } })
      );
    });

    act(() => {
      workerInstance.onmessage?.(
        new MessageEvent("message", {
          data: { type: "ERROR", payload: { message: "not implemented" } },
        })
      );
    });

    expect(result.current.initState).toBe("ready");
    expect(result.current.lastError).toBe("not implemented");
  });

  it("updates renderState on STATE_UPDATE message", () => {
    const { result } = renderHook(() => useChessWorker());

    // First become ready
    act(() => {
      workerInstance.onmessage?.(
        new MessageEvent("message", { data: { type: "READY" } })
      );
    });

    act(() => {
      workerInstance.onmessage?.(
        new MessageEvent("message", {
          data: {
            type: "STATE_UPDATE",
            payload: {
              fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
              board: { e1: "K" },
              legalMoves: ["e2e4"],
              status: 0,
              isCheck: false,
              canUndo: false,
              canRedo: false,
              currentTurn: "white" as const,
            },
          },
        })
      );
    });

    expect(result.current.renderState).toEqual({
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      board: { e1: "K" },
      legalMoves: ["e2e4"],
      status: 0,
      isCheck: false,
      canUndo: false,
      canRedo: false,
      currentTurn: "white",
    });
  });

  it("sendMove posts APPLY_MOVE to worker", () => {
    const { result } = renderHook(() => useChessWorker());

    act(() => {
      workerInstance.onmessage?.(
        new MessageEvent("message", { data: { type: "READY" } })
      );
    });

    act(() => {
      result.current.sendMove("e2e4");
    });

    expect(workerInstance.postMessage).toHaveBeenCalledWith({
      type: "APPLY_MOVE",
      payload: { uciMove: "e2e4" },
    });
  });

  it("sendUndo posts UNDO to worker", () => {
    const { result } = renderHook(() => useChessWorker());

    act(() => {
      workerInstance.onmessage?.(
        new MessageEvent("message", { data: { type: "READY" } })
      );
    });

    act(() => {
      result.current.sendUndo();
    });

    expect(workerInstance.postMessage).toHaveBeenCalledWith({ type: "UNDO" });
  });

  it("sendRedo posts REDO to worker", () => {
    const { result } = renderHook(() => useChessWorker());

    act(() => {
      workerInstance.onmessage?.(
        new MessageEvent("message", { data: { type: "READY" } })
      );
    });

    act(() => {
      result.current.sendRedo();
    });

    expect(workerInstance.postMessage).toHaveBeenCalledWith({ type: "REDO" });
  });

  it("terminates worker on unmount", () => {
    const { unmount } = renderHook(() => useChessWorker());
    unmount();
    expect(workerInstance.terminate).toHaveBeenCalled();
  });

  describe("localStorage event sourcing", () => {
    it("sends INIT_FROM_EVENTS when localStorage has saved moves", () => {
      vi.spyOn(storage, "loadMoveEvents").mockReturnValue(["e2e4", "e7e5"]);
      renderHook(() => useChessWorker());
      expect(workerInstance.postMessage).toHaveBeenCalledWith({
        type: "INIT_FROM_EVENTS",
        payload: { uciMoves: ["e2e4", "e7e5"] },
      });
    });

    it("sends INIT when localStorage is empty", () => {
      vi.spyOn(storage, "loadMoveEvents").mockReturnValue([]);
      renderHook(() => useChessWorker());
      expect(workerInstance.postMessage).toHaveBeenCalledWith({ type: "INIT" });
    });

    it("sendMove calls saveMoveEvent", () => {
      const spy = vi.spyOn(storage, "saveMoveEvent").mockImplementation(() => {});
      const { result } = renderHook(() => useChessWorker());

      act(() => {
        workerInstance.onmessage?.(
          new MessageEvent("message", { data: { type: "READY" } })
        );
      });

      act(() => {
        result.current.sendMove("e2e4");
      });

      expect(spy).toHaveBeenCalledWith("e2e4");
    });

    it("resetGame clears localStorage and sends INIT", () => {
      const clearSpy = vi.spyOn(storage, "clearMoveEvents").mockImplementation(() => {});
      const { result } = renderHook(() => useChessWorker());

      act(() => {
        workerInstance.onmessage?.(
          new MessageEvent("message", { data: { type: "READY" } })
        );
      });

      workerInstance.postMessage.mockClear();

      act(() => {
        result.current.resetGame();
      });

      expect(clearSpy).toHaveBeenCalled();
      expect(workerInstance.postMessage).toHaveBeenCalledWith({ type: "INIT" });
    });
  });
});
