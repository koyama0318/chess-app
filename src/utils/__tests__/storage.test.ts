import { describe, it, expect, beforeEach } from "vitest";
import {
  saveMoveEvent,
  loadMoveEvents,
  clearMoveEvents,
  popMoveEvent,
  getMoveEventCount,
  saveSnapshot,
  loadGameState,
  SNAPSHOT_INTERVAL,
} from "../storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("loadMoveEvents", () => {
    it("returns empty array when no data", () => {
      expect(loadMoveEvents()).toEqual([]);
    });

    it("returns empty array on invalid JSON", () => {
      localStorage.setItem("chess_move_events", "not-json{{{");
      expect(loadMoveEvents()).toEqual([]);
    });

    it("returns empty array on non-array JSON", () => {
      localStorage.setItem("chess_move_events", '{"foo":"bar"}');
      expect(loadMoveEvents()).toEqual([]);
    });

    it("returns stored moves", () => {
      localStorage.setItem(
        "chess_move_events",
        JSON.stringify(["e2e4", "e7e5"])
      );
      expect(loadMoveEvents()).toEqual(["e2e4", "e7e5"]);
    });
  });

  describe("saveMoveEvent", () => {
    it("appends to existing events", () => {
      saveMoveEvent("e2e4");
      saveMoveEvent("e7e5");
      expect(loadMoveEvents()).toEqual(["e2e4", "e7e5"]);
    });

    it("starts fresh when no prior data", () => {
      saveMoveEvent("d2d4");
      expect(loadMoveEvents()).toEqual(["d2d4"]);
    });
  });

  describe("clearMoveEvents", () => {
    it("removes the key", () => {
      saveMoveEvent("e2e4");
      clearMoveEvents();
      expect(loadMoveEvents()).toEqual([]);
      expect(localStorage.getItem("chess_move_events")).toBeNull();
    });

    it("also clears the FEN snapshot", () => {
      saveSnapshot("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
      clearMoveEvents();
      expect(localStorage.getItem("chess_fen_snapshot")).toBeNull();
    });
  });

  describe("saveSnapshot", () => {
    it("saves FEN to localStorage", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
      saveSnapshot(fen);
      expect(localStorage.getItem("chess_fen_snapshot")).toBe(fen);
    });

    it("clears move events when saving snapshot", () => {
      saveMoveEvent("e2e4");
      saveMoveEvent("e7e5");
      saveSnapshot("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
      expect(loadMoveEvents()).toEqual([]);
    });
  });

  describe("loadGameState", () => {
    it("returns null fenSnapshot and empty uciMoves when nothing stored", () => {
      expect(loadGameState()).toEqual({ fenSnapshot: null, uciMoves: [] });
    });

    it("returns stored fenSnapshot and uciMoves", () => {
      const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
      saveSnapshot(fen);
      saveMoveEvent("e7e5");
      expect(loadGameState()).toEqual({ fenSnapshot: fen, uciMoves: ["e7e5"] });
    });

    it("returns null fenSnapshot with moves when no snapshot", () => {
      saveMoveEvent("e2e4");
      expect(loadGameState()).toEqual({ fenSnapshot: null, uciMoves: ["e2e4"] });
    });
  });

  describe("popMoveEvent", () => {
    it("does nothing on empty storage", () => {
      expect(() => popMoveEvent()).not.toThrow();
      expect(loadMoveEvents()).toEqual([]);
    });

    it("removes the last event", () => {
      saveMoveEvent("e2e4");
      saveMoveEvent("e7e5");
      popMoveEvent();
      expect(loadMoveEvents()).toEqual(["e2e4"]);
    });

    it("removes only the last event when multiple exist", () => {
      saveMoveEvent("e2e4");
      saveMoveEvent("e7e5");
      saveMoveEvent("d2d4");
      popMoveEvent();
      expect(loadMoveEvents()).toEqual(["e2e4", "e7e5"]);
    });

    it("leaves storage empty after removing last event", () => {
      saveMoveEvent("e2e4");
      popMoveEvent();
      expect(loadMoveEvents()).toEqual([]);
    });
  });

  describe("getMoveEventCount", () => {
    it("returns 0 when empty", () => {
      expect(getMoveEventCount()).toBe(0);
    });

    it("returns correct count after saves", () => {
      saveMoveEvent("e2e4");
      saveMoveEvent("e7e5");
      expect(getMoveEventCount()).toBe(2);
    });

    it("decrements after pop", () => {
      saveMoveEvent("e2e4");
      saveMoveEvent("e7e5");
      popMoveEvent();
      expect(getMoveEventCount()).toBe(1);
    });
  });

  describe("SNAPSHOT_INTERVAL", () => {
    it("is 20", () => {
      expect(SNAPSHOT_INTERVAL).toBe(20);
    });
  });
});
