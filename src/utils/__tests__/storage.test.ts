import { describe, it, expect, beforeEach } from "vitest";
import { saveMoveEvent, loadMoveEvents, clearMoveEvents } from "../storage";

const STORAGE_KEY = "chess_move_events";

beforeEach(() => {
  localStorage.clear();
});

describe("loadMoveEvents", () => {
  it("returns empty array when no data", () => {
    expect(loadMoveEvents()).toEqual([]);
  });

  it("returns empty array on invalid JSON", () => {
    localStorage.setItem(STORAGE_KEY, "not json");
    expect(loadMoveEvents()).toEqual([]);
  });

  it("returns empty array on non-array JSON", () => {
    localStorage.setItem(STORAGE_KEY, '{"a":1}');
    expect(loadMoveEvents()).toEqual([]);
  });

  it("returns saved moves", () => {
    localStorage.setItem(STORAGE_KEY, '["e2e4","e7e5"]');
    expect(loadMoveEvents()).toEqual(["e2e4", "e7e5"]);
  });
});

describe("saveMoveEvent", () => {
  it("creates new array with single move", () => {
    saveMoveEvent("e2e4");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(["e2e4"]);
  });

  it("appends to existing moves", () => {
    localStorage.setItem(STORAGE_KEY, '["e2e4"]');
    saveMoveEvent("e7e5");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(["e2e4", "e7e5"]);
  });

  it("does not overwrite on corrupt JSON", () => {
    localStorage.setItem(STORAGE_KEY, "corrupt");
    saveMoveEvent("e2e4");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("corrupt");
  });
});

describe("clearMoveEvents", () => {
  it("removes the storage key", () => {
    localStorage.setItem(STORAGE_KEY, '["e2e4"]');
    clearMoveEvents();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
