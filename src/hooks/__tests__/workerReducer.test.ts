import { describe, it, expect } from "vitest";
import { reducer, initialState } from "../useChessWorker";
import type { State } from "../useChessWorker";
import type { RenderState } from "../../types/chess";
import { GameStatus } from "../../types/chess";

const mockRenderState: RenderState = {
  fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  board: {},
  legalMoves: ["e2e4"],
  status: GameStatus.InProgress,
  isCheck: false,
  canUndo: false,
  canRedo: false,
  currentTurn: "white",
  lastMove: null,
};

describe("useChessWorker reducer", () => {
  describe("START_INIT", () => {
    it("transitions uninit → initializing", () => {
      const result = reducer(initialState, { type: "START_INIT" });
      expect(result.initState).toBe("initializing");
    });

    it("is a no-op when not in uninit state", () => {
      const state: State = { ...initialState, initState: "initializing" };
      const result = reducer(state, { type: "START_INIT" });
      expect(result).toBe(state);
    });
  });

  describe("STATE_UPDATE", () => {
    it("transitions initializing → ready with renderState", () => {
      const state: State = { ...initialState, initState: "initializing" };
      const result = reducer(state, {
        type: "STATE_UPDATE",
        payload: mockRenderState,
      });
      expect(result.initState).toBe("ready");
      expect(result.renderState).toEqual(mockRenderState);
      expect(result.lastError).toBeNull();
    });

    it("updates renderState when already ready", () => {
      const state: State = {
        initState: "ready",
        renderState: mockRenderState,
        lastError: null,
      };
      const updated: RenderState = {
        ...mockRenderState,
        fen: "new-fen",
        canUndo: true,
      };
      const result = reducer(state, {
        type: "STATE_UPDATE",
        payload: updated,
      });
      expect(result.initState).toBe("ready");
      expect(result.renderState).toEqual(updated);
    });

    it("clears lastError on STATE_UPDATE", () => {
      const state: State = {
        initState: "ready",
        renderState: mockRenderState,
        lastError: "some error",
      };
      const result = reducer(state, {
        type: "STATE_UPDATE",
        payload: mockRenderState,
      });
      expect(result.lastError).toBeNull();
    });
  });

  describe("ERROR", () => {
    it("transitions initializing → error with message", () => {
      const state: State = { ...initialState, initState: "initializing" };
      const result = reducer(state, {
        type: "ERROR",
        message: "WASM load failed",
      });
      expect(result.initState).toBe("error");
      expect(result.lastError).toBe("WASM load failed");
    });

    it("stores lastError without changing initState when ready", () => {
      const state: State = {
        initState: "ready",
        renderState: mockRenderState,
        lastError: null,
      };
      const result = reducer(state, {
        type: "ERROR",
        message: "illegal move",
      });
      expect(result.initState).toBe("ready");
      expect(result.lastError).toBe("illegal move");
      expect(result.renderState).toEqual(mockRenderState);
    });
  });

  describe("RETRY", () => {
    it("transitions error → initializing and clears state", () => {
      const state: State = {
        initState: "error",
        renderState: null,
        lastError: "init failed",
      };
      const result = reducer(state, { type: "RETRY" });
      expect(result.initState).toBe("initializing");
      expect(result.lastError).toBeNull();
      expect(result.renderState).toBeNull();
    });

    it("is a no-op when not in error state", () => {
      const state: State = { ...initialState, initState: "ready", renderState: mockRenderState, lastError: null };
      const result = reducer(state, { type: "RETRY" });
      expect(result).toBe(state);
    });
  });

  describe("RESET", () => {
    it("resets to initializing from any state", () => {
      const state: State = {
        initState: "ready",
        renderState: mockRenderState,
        lastError: null,
      };
      const result = reducer(state, { type: "RESET" });
      expect(result.initState).toBe("initializing");
      expect(result.renderState).toBeNull();
      expect(result.lastError).toBeNull();
    });
  });
});
