import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WorkerRequest, WorkerResponse } from "../types";
import type { RenderState } from "../../types/chess";
import { GameStatus } from "../../types/chess";

// We test the worker's onmessage handler in isolation by importing the module
// and simulating the worker environment.

// Mock self.postMessage
const mockPostMessage = vi.fn();

// We'll set up a fake worker global scope
vi.stubGlobal("postMessage", mockPostMessage);

// Mock ChessGame from WASM
const mockChessGame = {
  current_fen: vi.fn(
    () => "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  ),
  game_status: vi.fn(() => GameStatus.InProgress),
  can_undo: vi.fn(() => false),
  can_redo: vi.fn(() => false),
  apply_move: vi.fn(),
  undo: vi.fn(() => true),
  redo: vi.fn(() => true),
};

const mockGetLegalMoves = vi.fn((_fen: string) => ["e2e3", "e2e4", "d2d3", "d2d4"]);

vi.mock("../../../wasm-pkg/chess_wasm", () => {
  return {
    default: vi.fn(() => Promise.resolve()),
    ChessGame: class {
      current_fen = mockChessGame.current_fen;
      game_status = mockChessGame.game_status;
      can_undo = mockChessGame.can_undo;
      can_redo = mockChessGame.can_redo;
      apply_move = mockChessGame.apply_move;
      undo = mockChessGame.undo;
      redo = mockChessGame.redo;
    },
    get_legal_moves: (fen: string) => mockGetLegalMoves(fen),
  };
});

// Dynamically import the worker module after mocking
let handleMessage: (event: MessageEvent<WorkerRequest>) => Promise<void>;

beforeEach(async () => {
  mockPostMessage.mockClear();
  vi.clearAllMocks();

  // Reset default mock return values
  mockChessGame.current_fen.mockReturnValue(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
  );
  mockGetLegalMoves.mockReturnValue(["e2e3", "e2e4", "d2d3", "d2d4"]);
  mockChessGame.game_status.mockReturnValue(GameStatus.InProgress);
  mockChessGame.can_undo.mockReturnValue(false);
  mockChessGame.can_redo.mockReturnValue(false);
  mockChessGame.apply_move.mockReturnValue(undefined);
  mockChessGame.undo.mockReturnValue(true);
  mockChessGame.redo.mockReturnValue(true);

  // Reset modules to get a fresh game=null state for each test
  vi.resetModules();
  // Import the handler function exported for testing
  const mod = await import("../chess.worker");
  handleMessage = mod.handleMessage;
});

function expectRenderState(expected: Partial<RenderState>): void {
  expect(mockPostMessage).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "STATE_UPDATE",
      payload: expect.objectContaining(expected),
    })
  );
}

describe("chess.worker message routing", () => {
  it("responds READY to INIT and initializes ChessGame", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "READY",
    } satisfies WorkerResponse);
  });

  it("responds STATE_UPDATE to APPLY_MOVE with valid move", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();

    mockChessGame.can_undo.mockReturnValue(true);

    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );

    expect(mockChessGame.apply_move).toHaveBeenCalledWith("e2e4");
    expectRenderState({ canUndo: true });
  });

  it("responds ERROR to APPLY_MOVE with invalid move", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();

    mockChessGame.apply_move.mockImplementation(() => {
      throw new Error("Illegal move");
    });

    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e5" } },
      })
    );

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ERROR",
      payload: { message: "Illegal move" },
    } satisfies WorkerResponse);
  });

  it("responds STATE_UPDATE to UNDO", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();

    mockChessGame.can_redo.mockReturnValue(true);

    await handleMessage(
      new MessageEvent("message", { data: { type: "UNDO" } })
    );

    expect(mockChessGame.undo).toHaveBeenCalled();
    expectRenderState({ canRedo: true });
  });

  it("responds STATE_UPDATE to REDO", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();

    mockChessGame.can_undo.mockReturnValue(true);

    await handleMessage(
      new MessageEvent("message", { data: { type: "REDO" } })
    );

    expect(mockChessGame.redo).toHaveBeenCalled();
    expectRenderState({ canUndo: true });
  });

  it("responds ERROR when UNDO/REDO called before INIT", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "UNDO" } })
    );
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ERROR",
      payload: { message: "Game not initialized" },
    } satisfies WorkerResponse);
  });

  it("responds ERROR when APPLY_MOVE called before INIT", async () => {
    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ERROR",
      payload: { message: "Game not initialized" },
    } satisfies WorkerResponse);
  });

  it("canUndo and canRedo are correctly reported in render state", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();

    // After a move: canUndo=true, canRedo=false
    mockChessGame.can_undo.mockReturnValue(true);
    mockChessGame.can_redo.mockReturnValue(false);

    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );

    expectRenderState({ canUndo: true, canRedo: false });
  });
});
