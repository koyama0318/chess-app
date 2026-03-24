import { describe, it, expect, beforeEach } from "vitest";
import { saveMoveEvent, loadMoveEvents, clearMoveEvents } from "../storage";

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
  });
});
