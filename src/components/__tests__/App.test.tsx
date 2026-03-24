import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../../App";

// Mock the Worker
vi.mock("../../worker/chess.worker?worker", () => {
  const MockWorker = vi.fn(function (this: {
    postMessage: ReturnType<typeof vi.fn>;
    terminate: ReturnType<typeof vi.fn>;
    onmessage: null;
  }) {
    this.postMessage = vi.fn();
    this.terminate = vi.fn();
    this.onmessage = null;
  });
  return { default: MockWorker };
});

// Mock storage module
vi.mock("../../utils/storage", () => ({
  loadGameState: vi.fn(() => ({ fenSnapshot: null, uciMoves: [] })),
  saveMoveEvent: vi.fn(),
  clearMoveEvents: vi.fn(),
}));

import { loadGameState } from "../../utils/storage";

beforeEach(() => {
  vi.mocked(loadGameState).mockReturnValue({ fenSnapshot: null, uciMoves: [] });
});

describe("App", () => {
  it("renders StartScreen when no saved moves", () => {
    render(<App />);

    expect(screen.getByText("Chess")).toBeDefined();
    expect(screen.getByText("Human vs Human")).toBeDefined();
    expect(screen.getByText("Human vs Computer")).toBeDefined();
  });

  it("transitions to playing phase when a mode button is clicked", async () => {
    render(<App />);

    await userEvent.click(screen.getByText("Human vs Human"));

    // StartScreen should be gone, loading indicator should appear
    expect(screen.queryByText("Chess")).toBeNull();
    expect(
      screen.getByRole("status", { name: "Loading chess engine" })
    ).toBeDefined();
  });

  it("skips start screen when localStorage has saved moves", () => {
    vi.mocked(loadGameState).mockReturnValue({ fenSnapshot: null, uciMoves: ["e2e4", "e7e5"] });

    render(<App />);

    // Should not show StartScreen
    expect(screen.queryByText("Human vs Human")).toBeNull();
    // Should show loading indicator (ChessApp initializing)
    expect(
      screen.getByRole("status", { name: "Loading chess engine" })
    ).toBeDefined();
  });
});
