import { describe, it, expect, vi, beforeEach } from "vitest";
import type { WorkerRequest, WorkerResponse } from "../types";

// We test the worker's onmessage handler in isolation by importing the module
// and simulating the worker environment.

// Mock self.postMessage
const mockPostMessage = vi.fn();

// We'll set up a fake worker global scope
vi.stubGlobal("postMessage", mockPostMessage);

// Dynamically import the worker module after mocking
let handleMessage: (event: MessageEvent<WorkerRequest>) => void;

beforeEach(async () => {
  mockPostMessage.mockClear();
  // Import the handler function exported for testing
  const mod = await import("../chess.worker");
  handleMessage = mod.handleMessage;
});

describe("chess.worker message routing", () => {
  it("responds READY to INIT", () => {
    handleMessage(new MessageEvent("message", { data: { type: "INIT" } }));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "READY",
    } satisfies WorkerResponse);
  });

  it("responds ERROR to APPLY_MOVE (not implemented)", () => {
    handleMessage(
      new MessageEvent("message", {
        data: { type: "APPLY_MOVE", payload: { uciMove: "e2e4" } },
      })
    );
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ERROR",
      payload: { message: "not implemented" },
    } satisfies WorkerResponse);
  });

  it("responds ERROR to UNDO (not implemented)", () => {
    handleMessage(new MessageEvent("message", { data: { type: "UNDO" } }));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ERROR",
      payload: { message: "not implemented" },
    } satisfies WorkerResponse);
  });

  it("responds ERROR to REDO (not implemented)", () => {
    handleMessage(new MessageEvent("message", { data: { type: "REDO" } }));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "ERROR",
      payload: { message: "not implemented" },
    } satisfies WorkerResponse);
  });
});
