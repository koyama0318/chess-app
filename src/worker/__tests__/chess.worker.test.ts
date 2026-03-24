import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WorkerRequest, WorkerResponse } from "../types";
import { GameStatus } from "../../types/chess";

// Mock self.postMessage
const mockPostMessage = vi.fn();
vi.stubGlobal("postMessage", mockPostMessage);

// --- Mock state ---

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E2E4_FEN =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

const STARTING_LEGAL_MOVES = [
  "a2a3", "a2a4", "b1a3", "b1c3", "b2b3", "b2b4",
  "c2c3", "c2c4", "d2d3", "d2d4", "e2e3", "e2e4",
  "f2f3", "f2f4", "g1f3", "g1h3", "g2g3", "g2g4",
  "h2h3", "h2h4",
];

const AFTER_E2E4_LEGAL_MOVES = ["a7a6", "a7a5", "b8a6", "b8c6"];

// Mutable state for the mock game
const mockState = {
  currentFen: STARTING_FEN,
  gameStatus: GameStatus.InProgress as number,
  canUndo: false,
  canRedo: false,
  legalMoves: STARTING_LEGAL_MOVES as string[],
  applyMoveThrows: false,
  applyMoveError: "",
  initShouldFail: false,
};

// Track calls for assertions
const calls = {
  init: false,
  applyMove: [] as string[],
  undo: false,
  redo: false,
};

// Mock the loadWasm module
vi.mock("../loadWasm", () => ({
  loadWasm: async () => {
    if (mockState.initShouldFail) {
      throw new Error("WASM load failed");
    }
    calls.init = true;
    return {
      ChessGame: class MockChessGame {
        current_fen(): string {
          return mockState.currentFen;
        }
        game_status(): number {
          return mockState.gameStatus;
        }
        can_undo(): boolean {
          return mockState.canUndo;
        }
        can_redo(): boolean {
          return mockState.canRedo;
        }
        apply_move(uciMove: string): void {
          if (mockState.applyMoveThrows) {
            throw new Error(mockState.applyMoveError);
          }
          calls.applyMove.push(uciMove);
          mockState.currentFen = AFTER_E2E4_FEN;
          mockState.canUndo = true;
          mockState.legalMoves = AFTER_E2E4_LEGAL_MOVES;
        }
        undo(): boolean {
          calls.undo = true;
          mockState.currentFen = STARTING_FEN;
          mockState.canUndo = false;
          mockState.canRedo = true;
          mockState.legalMoves = STARTING_LEGAL_MOVES;
          return true;
        }
        redo(): boolean {
          calls.redo = true;
          mockState.currentFen = AFTER_E2E4_FEN;
          mockState.canUndo = true;
          mockState.canRedo = false;
          mockState.legalMoves = AFTER_E2E4_LEGAL_MOVES;
          return true;
        }
      },
      get_legal_moves: () => mockState.legalMoves,
    };
  },
}));

// Import after mock is set up (vi.mock is hoisted)
import { handleMessage, _resetForTesting } from "../chess.worker";

beforeEach(() => {
  mockPostMessage.mockClear();

  // Reset mock state
  mockState.currentFen = STARTING_FEN;
  mockState.gameStatus = GameStatus.InProgress;
  mockState.canUndo = false;
  mockState.canRedo = false;
  mockState.legalMoves = STARTING_LEGAL_MOVES;
  mockState.applyMoveThrows = false;
  mockState.applyMoveError = "";
  mockState.initShouldFail = false;

  // Reset call tracker
  calls.init = false;
  calls.applyMove = [];
  calls.undo = false;
  calls.redo = false;

  // Reset worker module-level state
  _resetForTesting();
});

describe("chess.worker WASM integration", () => {
  it("INIT loads WASM, creates game, sends READY then STATE_UPDATE with initial position", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );

    expect(calls.init).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledTimes(2);

    // First call: READY
    expect(mockPostMessage).toHaveBeenNthCalledWith(1, {
      type: "READY",
    } satisfies WorkerResponse);

    // Second call: STATE_UPDATE with initial RenderState
    const stateUpdate = mockPostMessage.mock.calls[1][0] as WorkerResponse;
    expect(stateUpdate.type).toBe("STATE_UPDATE");
    if (stateUpdate.type === "STATE_UPDATE") {
      expect(stateUpdate.payload.fen).toBe(STARTING_FEN);
      expect(stateUpdate.payload.status).toBe(GameStatus.InProgress);
      expect(stateUpdate.payload.canUndo).toBe(false);
      expect(stateUpdate.payload.canRedo).toBe(false);
      expect(stateUpdate.payload.legalMoves).toHaveLength(20);
    }
  });

  it("APPLY_MOVE with valid move sends STATE_UPDATE with updated FEN", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();

    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );

    expect(calls.applyMove).toContain("e2e4");
    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    expect(response.type).toBe("STATE_UPDATE");
    if (response.type === "STATE_UPDATE") {
      expect(response.payload.fen).toBe(AFTER_E2E4_FEN);
      expect(response.payload.canUndo).toBe(true);
    }
  });

  it("APPLY_MOVE with invalid move sends ERROR without crashing", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();

    mockState.applyMoveThrows = true;
    mockState.applyMoveError = "Illegal move: e2e5";

    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e5" } },
      })
    );

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    expect(response.type).toBe("ERROR");
    if (response.type === "ERROR") {
      expect(response.payload.message).toContain("Illegal move");
    }

    // Worker should still be functional after error
    mockState.applyMoveThrows = false;
    mockPostMessage.mockClear();

    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    expect(
      (mockPostMessage.mock.calls[0][0] as WorkerResponse).type
    ).toBe("STATE_UPDATE");
  });

  it("UNDO sends STATE_UPDATE", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );
    mockPostMessage.mockClear();

    await handleMessage(
      new MessageEvent("message", { data: { type: "UNDO" } })
    );

    expect(calls.undo).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    expect(response.type).toBe("STATE_UPDATE");
    if (response.type === "STATE_UPDATE") {
      expect(response.payload.fen).toBe(STARTING_FEN);
      expect(response.payload.canRedo).toBe(true);
    }
  });

  it("REDO sends STATE_UPDATE", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );
    await handleMessage(
      new MessageEvent("message", { data: { type: "UNDO" } })
    );
    mockPostMessage.mockClear();

    await handleMessage(
      new MessageEvent("message", { data: { type: "REDO" } })
    );

    expect(calls.redo).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    expect(response.type).toBe("STATE_UPDATE");
    if (response.type === "STATE_UPDATE") {
      expect(response.payload.fen).toBe(AFTER_E2E4_FEN);
      expect(response.payload.canUndo).toBe(true);
      expect(response.payload.canRedo).toBe(false);
    }
  });

  it("INIT failure (WASM load error) sends ERROR", async () => {
    mockState.initShouldFail = true;

    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    expect(response.type).toBe("ERROR");
    if (response.type === "ERROR") {
      expect(response.payload.message).toContain("WASM load failed");
    }
  });

  it("APPLY_MOVE before INIT sends ERROR", async () => {
    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    expect(response.type).toBe("ERROR");
    if (response.type === "ERROR") {
      expect(response.payload.message).toContain("not initialized");
    }
  });
});
