import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WorkerRequest, WorkerResponse } from "../types";
import { GameStatus } from "../../types/chess";

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E2E4_FEN =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

// --- Mock WASM module ---

class MockChessGame {
  private fen: string;
  private undoStack: string[] = [];
  private redoStack: string[] = [];

  constructor(initialFen = STARTING_FEN) {
    this.fen = initialFen;
  }

  current_fen() {
    return this.fen;
  }
  apply_move(uciMove: string) {
    if (uciMove === "e2e4") {
      this.undoStack.push(this.fen);
      this.redoStack = [];
      this.fen = AFTER_E2E4_FEN;
    } else {
      throw new Error(`Illegal move: ${uciMove}`);
    }
  }
  game_status() {
    return GameStatus.InProgress;
  }
  can_undo() {
    return this.undoStack.length > 0;
  }
  can_redo() {
    return this.redoStack.length > 0;
  }
  undo() {
    if (this.undoStack.length > 0) {
      this.redoStack.push(this.fen);
      this.fen = this.undoStack.pop()!;
    }
  }
  redo() {
    if (this.redoStack.length > 0) {
      this.undoStack.push(this.fen);
      this.fen = this.redoStack.pop()!;
    }
  }
  render_state() {
    return {
      fen: this.fen,
      board: {},
      legalMoves: ["e2e4"],
      status: GameStatus.InProgress,
      isCheck: false,
      canUndo: this.can_undo(),
      canRedo: this.can_redo(),
      currentTurn: "white" as const,
    };
  }
}

const mockInitFn = vi.fn().mockResolvedValue(undefined);
const mockGetLegalMoves = vi.fn().mockReturnValue(Array(20).fill("e2e4"));
let mockGameInstance: MockChessGame;

const mockNewFromFen = vi.fn((fen: string) => new MockChessGame(fen));
const mockFromFen = vi.fn((fen: string) => {
  if (fen === "invalid_fen") throw new Error("invalid FEN");
  return new MockChessGame(fen);
});

vi.mock("../../../wasm-pkg/chess_wasm", () => ({
  default: mockInitFn,
  ChessGame: Object.assign(
    function MockChessGameConstructor(this: unknown) {
      return mockGameInstance;
    },
    {
      new_from_fen: (fen: string) => mockNewFromFen(fen),
      from_fen: (fen: string) => mockFromFen(fen),
    }
  ),
  get_legal_moves: mockGetLegalMoves,
}));

// --- Mock self.postMessage ---

const mockPostMessage = vi.fn();
vi.stubGlobal("postMessage", mockPostMessage);

// --- Import handler ---

let handleMessage: (event: MessageEvent<WorkerRequest>) => Promise<void>;

beforeEach(async () => {
  vi.resetModules();
  mockPostMessage.mockClear();
  mockInitFn.mockClear().mockResolvedValue(undefined);
  mockGetLegalMoves.mockReturnValue(Array(20).fill("e2e4"));
  mockNewFromFen.mockClear();
  mockFromFen.mockClear();
  mockGameInstance = new MockChessGame();
  const mod = await import("../chess.worker");
  handleMessage = mod.handleMessage;
});

describe("chess.worker message routing", () => {
  it("responds STATE_UPDATE to INIT with starting position", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "STATE_UPDATE",
        payload: expect.objectContaining({
          fen: STARTING_FEN,
          status: GameStatus.InProgress,
          canUndo: false,
          canRedo: false,
        }),
      }) satisfies WorkerResponse
    );
  });

  it("responds STATE_UPDATE to APPLY_MOVE with updated FEN", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();
    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "STATE_UPDATE",
        payload: expect.objectContaining({
          fen: AFTER_E2E4_FEN,
          canUndo: true,
        }),
      })
    );
  });

  it("responds ERROR to APPLY_MOVE with illegal move", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();
    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e9" } },
      })
    );
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ERROR" })
    );
  });

  it("responds STATE_UPDATE to UNDO", async () => {
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
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "STATE_UPDATE",
        payload: expect.objectContaining({ fen: STARTING_FEN, canRedo: true }),
      })
    );
  });

  it("responds STATE_UPDATE to REDO", async () => {
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
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "STATE_UPDATE",
        payload: expect.objectContaining({ fen: AFTER_E2E4_FEN }),
      })
    );
  });

  it("responds STATE_UPDATE to INIT_FROM_EVENTS with correct FEN", async () => {
    await handleMessage(
      new MessageEvent("message", {
        data: {
          type: "INIT_FROM_EVENTS",
          payload: { fenSnapshot: null, uciMoves: ["e2e4"] },
        },
      })
    );
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "STATE_UPDATE",
        payload: expect.objectContaining({
          fen: AFTER_E2E4_FEN,
          canUndo: true,
        }),
      })
    );
  });

  it("responds ERROR to INIT_FROM_EVENTS with invalid move", async () => {
    await handleMessage(
      new MessageEvent("message", {
        data: {
          type: "INIT_FROM_EVENTS",
          payload: { fenSnapshot: null, uciMoves: ["e2e9"] },
        },
      })
    );
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ERROR" })
    );
  });

  it("uses new_from_fen when INIT_FROM_EVENTS has fenSnapshot", async () => {
    await handleMessage(
      new MessageEvent("message", {
        data: {
          type: "INIT_FROM_EVENTS",
          payload: { fenSnapshot: AFTER_E2E4_FEN, uciMoves: [] },
        },
      })
    );
    expect(mockNewFromFen).toHaveBeenCalledWith(AFTER_E2E4_FEN);
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "STATE_UPDATE" })
    );
  });

  it("does not call new_from_fen when fenSnapshot is null", async () => {
    await handleMessage(
      new MessageEvent("message", {
        data: {
          type: "INIT_FROM_EVENTS",
          payload: { fenSnapshot: null, uciMoves: [] },
        },
      })
    );
    expect(mockNewFromFen).not.toHaveBeenCalled();
  });

  it("responds STATE_UPDATE to INIT_FROM_FEN with valid FEN", async () => {
    await handleMessage(
      new MessageEvent("message", {
        data: { type: "INIT_FROM_FEN", payload: { fen: AFTER_E2E4_FEN } },
      })
    );
    expect(mockFromFen).toHaveBeenCalledWith(AFTER_E2E4_FEN);
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "STATE_UPDATE" })
    );
  });

  it("responds ERROR to INIT_FROM_FEN with invalid FEN", async () => {
    await handleMessage(
      new MessageEvent("message", {
        data: { type: "INIT_FROM_FEN", payload: { fen: "invalid_fen" } },
      })
    );
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ERROR" })
    );
  });

  it("does not write to localStorage on INIT_FROM_FEN", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    await handleMessage(
      new MessageEvent("message", {
        data: { type: "INIT_FROM_FEN", payload: { fen: AFTER_E2E4_FEN } },
      })
    );
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });
});
