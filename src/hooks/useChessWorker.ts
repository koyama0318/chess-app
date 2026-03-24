import { useCallback, useEffect, useReducer, useRef } from "react";
import type { RenderState } from "../types/chess";
import type { WorkerResponse } from "../worker/types";
import ChessWorker from "../worker/chess.worker?worker";

export type InitState = "uninit" | "initializing" | "ready" | "error";

interface State {
  initState: InitState;
  renderState: RenderState | null;
}

type Action =
  | { type: "START_INIT" }
  | { type: "READY" }
  | { type: "ERROR" }
  | { type: "STATE_UPDATE"; payload: RenderState };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_INIT":
      if (state.initState !== "uninit") return state;
      return { ...state, initState: "initializing" };
    case "READY":
      if (state.initState !== "initializing") return state;
      return { ...state, initState: "ready" };
    case "ERROR":
      if (state.initState !== "initializing") return state;
      return { ...state, initState: "error" };
    case "STATE_UPDATE":
      return { ...state, renderState: action.payload };
    default:
      return state;
  }
}

const initialState: State = {
  initState: "uninit",
  renderState: null,
};

export interface UseChessWorkerReturn {
  initState: InitState;
  renderState: RenderState | null;
  sendMove: (uciMove: string) => void;
  sendUndo: () => void;
  sendRedo: () => void;
}

export function useChessWorker(): UseChessWorkerReturn {
  const [state, dispatch] = useReducer(reducer, initialState);
  const workerRef = useRef<InstanceType<typeof ChessWorker> | null>(null);

  useEffect(() => {
    const worker = new ChessWorker();
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      switch (msg.type) {
        case "READY":
          dispatch({ type: "READY" });
          break;
        case "STATE_UPDATE":
          dispatch({ type: "STATE_UPDATE", payload: msg.payload });
          break;
        case "ERROR":
          dispatch({ type: "ERROR" });
          break;
      }
    };

    dispatch({ type: "START_INIT" });
    worker.postMessage({ type: "INIT" });

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const sendMove = useCallback((uciMove: string) => {
    workerRef.current?.postMessage({
      type: "APPLY_MOVE",
      payload: { uciMove },
    });
  }, []);

  const sendUndo = useCallback(() => {
    workerRef.current?.postMessage({ type: "UNDO" });
  }, []);

  const sendRedo = useCallback(() => {
    workerRef.current?.postMessage({ type: "REDO" });
  }, []);

  return {
    initState: state.initState,
    renderState: state.renderState,
    sendMove,
    sendUndo,
    sendRedo,
  };
}
