import type { WorkerRequest, WorkerResponse } from "./types";

function postResponse(response: WorkerResponse): void {
  postMessage(response);
}

export function handleMessage(event: MessageEvent<WorkerRequest>): void {
  const { data } = event;

  switch (data.type) {
    case "INIT":
      postResponse({ type: "READY" });
      break;
    case "APPLY_MOVE":
      postResponse({
        type: "ERROR",
        payload: { message: "not implemented" },
      });
      break;
    case "UNDO":
      postResponse({
        type: "ERROR",
        payload: { message: "not implemented" },
      });
      break;
    case "REDO":
      postResponse({
        type: "ERROR",
        payload: { message: "not implemented" },
      });
      break;
  }
}

// Attach to self.onmessage when running as a Web Worker
declare const self: DedicatedWorkerGlobalScope;
self.onmessage = handleMessage;
