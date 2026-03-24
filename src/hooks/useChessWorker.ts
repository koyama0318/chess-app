import { useCallback, useEffect, useReducer, useRef } from "react";
import type { RenderState } from "../types/chess";
import type { WorkerResponse } from "../worker/types";
import ChessWorker from "../worker/chess.worker?worker";
import {
  saveMoveEvent,
  saveSnapshot,
  loadGameState,
  clearMoveEvents,
  SNAPSHOT_INTERVAL,
} from "../utils/storage";

export type InitState = "uninit" | "initializing" | "ready" | "error";

interface State {
  initState: InitState;
  renderState: RenderState | null;
  lastError: string | null;
  engineReady: boolean;
}

type Action =
  | { type: "START_INIT" }
  | { type: "RESET" }
  | { type: "ERROR"; message: string }
  | { type: "STATE_UPDATE"; payload: RenderState }
  | { type: "ENGINE_READY" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_INIT":
      if (state.initState !== "uninit") return state;
      return { ...state, initState: "initializing" };
    case "RESET":
      return { ...initialState, initState: "initializing" };
    case "ERROR":
      if (state.initState === "initializing") {
        return { ...state, initState: "error", lastError: action.message };
      }
      // Post-init errors (APPLY_MOVE, UNDO, REDO): store message without state change
      return { ...state, lastError: action.message };
    case "STATE_UPDATE":
      if (state.initState === "initializing") {
        return { ...state, initState: "ready", renderState: action.payload };
      }
      return { ...state, renderState: action.payload };
    case "ENGINE_READY":
      return { ...state, engineReady: true };
    default:
      return state;
  }
}

const initialState: State = {
  initState: "uninit",
  renderState: null,
  lastError: null,
  engineReady: false,
};

export interface UseChessWorkerReturn {
  initState: InitState;
  renderState: RenderState | null;
  lastError: string | null;
  engineReady: boolean;
  sendMove: (uciMove: string) => void;
  sendUndo: () => void;
  sendRedo: () => void;
  sendInitEngine: () => void;
  resetGame: () => void;
}

export function useChessWorker(): UseChessWorkerReturn {
  const [state, dispatch] = useReducer(reducer, initialState);
  const workerRef = useRef<InstanceType<typeof ChessWorker> | null>(null);
  const moveCountRef = useRef(0);
  const pendingSnapshotRef = useRef(false);

  useEffect(() => {
    const worker = new ChessWorker();
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      switch (msg.type) {
        case "STATE_UPDATE":
          dispatch({ type: "STATE_UPDATE", payload: msg.payload });
          if (pendingSnapshotRef.current) {
            saveSnapshot(msg.payload.fen);
            pendingSnapshotRef.current = false;
          }
          break;
        case "ERROR":
          dispatch({ type: "ERROR", message: msg.payload.message });
          break;
        case "ENGINE_READY":
          dispatch({ type: "ENGINE_READY" });
          break;
      }
    };

    dispatch({ type: "START_INIT" });

    const { fenSnapshot, uciMoves } = loadGameState();
    if (fenSnapshot !== null || uciMoves.length > 0) {
      moveCountRef.current = uciMoves.length;
      worker.postMessage({
        type: "INIT_FROM_EVENTS",
        payload: { fenSnapshot, uciMoves },
      });
    } else {
      worker.postMessage({ type: "INIT" });
    }

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const sendMove = useCallback((uciMove: string) => {
    saveMoveEvent(uciMove);
    moveCountRef.current += 1;
    if (moveCountRef.current % SNAPSHOT_INTERVAL === 0) {
      pendingSnapshotRef.current = true;
    }
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

  const resetGame = useCallback(() => {
    clearMoveEvents();
    moveCountRef.current = 0;
    pendingSnapshotRef.current = false;
    dispatch({ type: "RESET" });
    workerRef.current?.postMessage({ type: "INIT" });
  }, []);

  const sendInitEngine = useCallback(() => {
    workerRef.current?.postMessage({ type: "INIT_ENGINE" });
  }, []);

  return {
    initState: state.initState,
    renderState: state.renderState,
    lastError: state.lastError,
    engineReady: state.engineReady,
    sendMove,
    sendUndo,
    sendRedo,
    sendInitEngine,
    resetGame,
  };
}
