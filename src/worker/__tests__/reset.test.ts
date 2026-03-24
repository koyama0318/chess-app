import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WorkerRequest } from "../types";
import { GameStatus } from "../../types/chess";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const AFTER_E2E4_FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

class MockChessGame {
  private fen = STARTING_FEN;

  current_fen() { return this.fen; }
  game_status() { return GameStatus.InProgress; }
  can_undo() { return this.fen !== STARTING_FEN; }
  can_redo() { return false; }

  apply_move(uciMove: string) {
    if (uciMove === "e2e4") this.fen = AFTER_E2E4_FEN;
    else throw new Error(`Illegal move: ${uciMove}`);
  }
  undo() { this.fen = STARTING_FEN; }
  redo() {}
  reset() { this.fen = STARTING_FEN; }
  render_state() {
    return {
      fen: this.fen,
      board: {},
      legalMoves: [],
      status: GameStatus.InProgress,
      isCheck: false,
      canUndo: this.can_undo(),
      canRedo: this.can_redo(),
      currentTurn: "white" as const,
    };
  }
}

const mockInitFn = vi.fn().mockResolvedValue(undefined);
let mockGameInstance: MockChessGame;

vi.mock("../../../wasm-pkg/chess_wasm", () => ({
  default: mockInitFn,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ChessGame: function (this: any) { return mockGameInstance; },
}));

const mockPostMessage = vi.fn();
vi.stubGlobal("postMessage", mockPostMessage);

let handleMessage: (event: MessageEvent<WorkerRequest>) => Promise<void>;

beforeEach(async () => {
  vi.resetModules();
  mockPostMessage.mockClear();
  mockInitFn.mockClear().mockResolvedValue(undefined);
  mockGameInstance = new MockChessGame();
  const mod = await import("../chess.worker");
  handleMessage = mod.handleMessage;
});

describe("RESET message", () => {
  it("responds STATE_UPDATE with initial position after RESET", async () => {
    await handleMessage(new MessageEvent("message", { data: { type: "INIT" } }));
    await handleMessage(new MessageEvent("message", {
      data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
    }));
    mockPostMessage.mockClear();

    await handleMessage(new MessageEvent("message", { data: { type: "RESET" } }));

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "STATE_UPDATE",
        payload: expect.objectContaining({ fen: STARTING_FEN }),
      })
    );
  });

  it("returns ERROR if RESET called before INIT", async () => {
    await handleMessage(new MessageEvent("message", { data: { type: "RESET" } }));

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ERROR" })
    );
  });
});
