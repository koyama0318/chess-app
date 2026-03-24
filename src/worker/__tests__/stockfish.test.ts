import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WorkerRequest, WorkerResponse } from "../types";

// --- Mock WASM module ---
const mockInitFn = vi.fn().mockResolvedValue(undefined);
vi.mock("../../../wasm-pkg/chess_wasm", () => ({
  default: mockInitFn,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ChessGame: function MockChessGame(this: any) {
    return {
      render_state: vi.fn().mockReturnValue({
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        board: {},
        legalMoves: [],
        status: 0,
        isCheck: false,
        canUndo: false,
        canRedo: false,
        currentTurn: "white",
      }),
    };
  },
}));

// --- Mock self.postMessage ---
const mockPostMessage = vi.fn();
vi.stubGlobal("postMessage", mockPostMessage);

// --- Mock Worker constructor for Stockfish ---
function makeMockStockfishWorker() {
  const worker = {
    postMessage: vi.fn().mockImplementation((msg: string) => {
      // Simulate UCI handshake
      if (msg === "uci") {
        setTimeout(() => worker.onmessage?.({ data: "uciok" } as MessageEvent), 0);
      } else if (msg === "isready") {
        setTimeout(() => worker.onmessage?.({ data: "readyok" } as MessageEvent), 0);
      }
    }),
    onmessage: null as ((e: MessageEvent) => void) | null,
    onerror: null as ((e: ErrorEvent) => void) | null,
    terminate: vi.fn(),
  };
  return worker;
}

let mockStockfishWorker: ReturnType<typeof makeMockStockfishWorker>;

vi.stubGlobal(
  "Worker",
  function MockWorker(this: unknown) {
    return mockStockfishWorker;
  }
);

// --- Import handler ---
let handleMessage: (event: MessageEvent<WorkerRequest>) => Promise<void>;

beforeEach(async () => {
  vi.resetModules();
  mockPostMessage.mockClear();
  mockStockfishWorker = makeMockStockfishWorker();
  const mod = await import("../chess.worker");
  handleMessage = mod.handleMessage;
});

describe("INIT_ENGINE message", () => {
  it("responds ENGINE_READY after UCI handshake completes", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT_ENGINE" } })
    );
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ENGINE_READY" }) satisfies WorkerResponse
    );
  });

  it("sends 'uci' to Stockfish worker on INIT_ENGINE", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT_ENGINE" } })
    );
    expect(mockStockfishWorker.postMessage).toHaveBeenCalledWith("uci");
  });

  it("sends 'isready' after receiving uciok", async () => {
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT_ENGINE" } })
    );
    expect(mockStockfishWorker.postMessage).toHaveBeenCalledWith("isready");
  });

  it("responds ERROR if Worker throws", async () => {
    mockStockfishWorker.postMessage.mockImplementationOnce(() => {
      throw new Error("Worker failed to start");
    });
    await handleMessage(
      new MessageEvent("message", { data: { type: "INIT_ENGINE" } })
    );
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ERROR" }) satisfies WorkerResponse
    );
  });
});
