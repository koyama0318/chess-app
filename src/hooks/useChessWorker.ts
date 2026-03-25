import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { RenderState } from "../types/chess";
import type { WorkerResponse } from "../worker/types";
import ChessWorker from "../worker/chess.worker?worker";
import {
  saveMoveEvent,
  saveSnapshot,
  loadGameState,
  clearMoveEvents,
  popMoveEvent,
  SNAPSHOT_INTERVAL,
} from "../utils/storage";

export type InitState = "uninit" | "initializing" | "ready" | "error";

export interface State {
  initState: InitState;
  renderState: RenderState | null;
  lastError: string | null;
}

export type Action =
  | { type: "START_INIT" }
  | { type: "RESET" }
  | { type: "RETRY" }
  | { type: "ERROR"; message: string }
  | { type: "STATE_UPDATE"; payload: RenderState };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_INIT":
      if (state.initState !== "uninit") return state;
      return { ...state, initState: "initializing" };
    case "RESET":
      return { ...initialState, initState: "initializing" };
    case "RETRY":
      if (state.initState !== "error") return state;
      return { ...initialState, initState: "initializing" };
    case "ERROR":
      if (state.initState === "initializing") {
        return { ...state, initState: "error", lastError: action.message };
      }
      // Post-init errors (APPLY_MOVE, UNDO, REDO): store message without state change
      return { ...state, lastError: action.message };
    case "STATE_UPDATE":
      if (state.initState === "initializing") {
        return { ...state, initState: "ready", renderState: action.payload, lastError: null };
      }
      return { ...state, renderState: action.payload, lastError: null };
    default:
      return state;
  }
}

export const initialState: State = {
  initState: "uninit",
  renderState: null,
  lastError: null,
};

export interface UseChessWorkerReturn {
  initState: InitState;
  renderState: RenderState | null;
  lastError: string | null;
  lastMove: { from: string; to: string } | null;
  sendMove: (uciMove: string) => void;
  sendUndo: () => void;
  sendRedo: () => void;
  resetGame: () => void;
  retry: () => void;
}

export function useChessWorker(initialFen?: string): UseChessWorkerReturn {
  const [state, dispatch] = useReducer(reducer, initialState);
  const workerRef = useRef<InstanceType<typeof ChessWorker> | null>(null);
  const moveCountRef = useRef(0);
  const pendingSnapshotRef = useRef(false);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

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
      }
    };

    dispatch({ type: "START_INIT" });

    if (initialFen) {
      worker.postMessage({ type: "INIT_FROM_FEN", payload: { fen: initialFen } });
    } else {
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
    setLastMove({ from: uciMove.slice(0, 2), to: uciMove.slice(2, 4) });
    workerRef.current?.postMessage({
      type: "APPLY_MOVE",
      payload: { uciMove },
    });
  }, []);

  const sendUndo = useCallback(() => {
    popMoveEvent();
    setLastMove(null);
    workerRef.current?.postMessage({ type: "UNDO" });
  }, []);

  const sendRedo = useCallback(() => {
    setLastMove(null);
    workerRef.current?.postMessage({ type: "REDO" });
  }, []);

  const retry = useCallback(() => {
    // Guard needed here to prevent sending INIT to the worker when not in error state.
    // The reducer also guards RETRY, but cannot prevent the postMessage side effect.
    if (state.initState !== "error") return;
    dispatch({ type: "RETRY" });
    workerRef.current?.postMessage({ type: "INIT" });
  }, [state.initState]);

  const resetGame = useCallback(() => {
    clearMoveEvents();
    moveCountRef.current = 0;
    pendingSnapshotRef.current = false;
    setLastMove(null);
    dispatch({ type: "RESET" });
    workerRef.current?.postMessage({ type: "INIT" });
  }, []);

  return {
    initState: state.initState,
    renderState: state.renderState,
    lastError: state.lastError,
    lastMove,
    sendMove,
    sendUndo,
    sendRedo,
    resetGame,
    retry,
  };
}
