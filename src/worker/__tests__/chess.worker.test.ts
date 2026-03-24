import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WorkerRequest, WorkerResponse } from "../types";
import { GameStatus } from "../../types/chess";

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E2E4_FEN =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

// --- Mock WASM module ---

class MockChessGame {
  private fen = STARTING_FEN;
  private undoStack: string[] = [];

  current_fen() {
    return this.fen;
  }
  apply_move(uciMove: string) {
    if (uciMove === "e2e4") {
      this.undoStack.push(this.fen);
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
    return false;
  }
}

const mockInitFn = vi.fn().mockResolvedValue(undefined);
const mockGetLegalMoves = vi.fn().mockReturnValue(Array(20).fill("e2e4"));
let mockGameInstance: MockChessGame;

vi.mock("../../../wasm-pkg/chess_wasm", () => ({
  default: mockInitFn,
  // eslint-disable-next-line func-style
  ChessGame: vi.fn().mockImplementation(function () {
    return mockGameInstance;
  }),
  get_legal_moves: mockGetLegalMoves,
}));

// --- Mock self.postMessage ---

const mockPostMessage = vi.fn();
vi.stubGlobal("postMessage", mockPostMessage);

// --- Import handler ---

let handleMessage: (event: MessageEvent<WorkerRequest>) => Promise<void>;

beforeEach(async () => {
  mockPostMessage.mockClear();
  mockInitFn.mockResolvedValue(undefined);
  mockGameInstance = new MockChessGame();
  vi.resetModules();
  const mod = await import("../chess.worker");
  handleMessage = mod.handleMessage;
});

describe("INIT", () => {
  it("responds STATE_UPDATE on successful init", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    expect(mockPostMessage).toHaveBeenCalledOnce();
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    expect(response.type).toBe("STATE_UPDATE");
  });

  it("STATE_UPDATE contains starting FEN", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    if (response.type !== "STATE_UPDATE") throw new Error("wrong type");
    expect(response.payload.fen).toBe(STARTING_FEN);
  });

  it("STATE_UPDATE has 20 legal moves", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    if (response.type !== "STATE_UPDATE") throw new Error("wrong type");
    expect(response.payload.legalMoves).toHaveLength(20);
  });

  it("STATE_UPDATE has status InProgress", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    if (response.type !== "STATE_UPDATE") throw new Error("wrong type");
    expect(response.payload.status).toBe(GameStatus.InProgress);
  });

  it("STATE_UPDATE has canUndo=false, canRedo=false", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    if (response.type !== "STATE_UPDATE") throw new Error("wrong type");
    expect(response.payload.canUndo).toBe(false);
    expect(response.payload.canRedo).toBe(false);
  });

  it("responds ERROR when WASM init fails", async () => {
    mockInitFn.mockRejectedValueOnce(new Error("wasm load failed"));

    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    expect(response.type).toBe("ERROR");
  });
});

describe("APPLY_MOVE", () => {
  it("responds STATE_UPDATE with updated FEN on legal move", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();

    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    expect(response.type).toBe("STATE_UPDATE");
    if (response.type !== "STATE_UPDATE") throw new Error("wrong type");
    expect(response.payload.fen).toBe(AFTER_E2E4_FEN);
  });

  it("responds ERROR on illegal move without crashing", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();

    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e9" } },
      })
    );
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    expect(response.type).toBe("ERROR");
  });

  it("subsequent call still works after ERROR (worker does not crash)", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );

    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "invalid" } },
      })
    );

    mockPostMessage.mockClear();

    await handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );
    const response = mockPostMessage.mock.calls[0][0] as WorkerResponse;
    expect(response.type).toBe("STATE_UPDATE");
  });
});

describe("UNDO / REDO (not yet implemented in bolt-05)", () => {
  it("responds ERROR to UNDO", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();

    await handleMessage(
      new MessageEvent("message", { data: { type: "UNDO" } })
    );
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ERROR",
      payload: { message: "not implemented" },
    } satisfies WorkerResponse);
  });

  it("responds ERROR to REDO", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT" } })
    );
    mockPostMessage.mockClear();

    await handleMessage(
      new MessageEvent("message", { data: { type: "REDO" } })
    );
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ERROR",
      payload: { message: "not implemented" },
    } satisfies WorkerResponse);
  });
});
