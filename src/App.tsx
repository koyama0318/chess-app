import { useState, useReducer, useEffect } from "react";
import { useChessWorker } from "./hooks/useChessWorker";
import { WasmErrorBoundary } from "./components/WasmErrorBoundary";
import { StartScreen } from "./components/StartScreen";
import { Board } from "./components/Board";
import { GameStatus } from "./components/GameStatus";
import { FlipButton } from "./components/FlipButton";
import { GameOverModal } from "./components/GameOverModal";
import { ResetButton } from "./components/ResetButton";
import { getFenTurn } from "./utils/fen";
import { loadMoveEvents } from "./utils/storage";
import type { GameMode, AppPhase } from "./types/game";

function LoadingIndicator() {
  return (
    <p role="status" aria-live="polite" aria-label="Loading chess engine">
      Loading chess engine
      <span aria-hidden="true"> ...</span>
    </p>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div role="alert">
      <p>{message}</p>
      <button onClick={() => window.location.reload()} type="button">
        Retry
      </button>
    </div>
  );
}

function ChessApp() {
  const { initState, renderState, sendMove, sendUndo, sendRedo, resetGame } =
    useChessWorker();
  const [flipped, setFlipped] = useState(false);

  switch (initState) {
    case "uninit":
      return null;
    case "initializing":
      return <LoadingIndicator />;
    case "error":
      return <ErrorMessage message="Failed to initialize chess engine." />;
    case "ready":
      if (!renderState) return <LoadingIndicator />;
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            padding: "16px",
            fontFamily: "sans-serif",
          }}
        >
          <GameStatus
            status={renderState.status}
            currentTurn={getFenTurn(renderState.fen)}
          />
          <GameOverModal
            status={renderState.status}
            currentTurn={renderState.currentTurn}
            onRematch={resetGame}
          />
          <Board
            renderState={renderState}
            onMove={sendMove}
            flipped={flipped}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={sendUndo}
              disabled={!renderState.canUndo}
              type="button"
            >
              Undo
            </button>
            <FlipButton onClick={() => setFlipped((f: boolean) => !f)} />
            <button
              onClick={sendRedo}
              disabled={!renderState.canRedo}
              type="button"
            >
              Redo
            </button>
            <ResetButton onClick={resetGame} />
          </div>
        </div>
      );
  }
}

interface AppState {
  phase: AppPhase;
  gameMode: GameMode;
}

type AppAction =
  | { type: "SELECT_MODE"; mode: GameMode }
  | { type: "RESUME" };

const initialAppState: AppState = {
  phase: "mode-select",
  gameMode: "human-vs-human",
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SELECT_MODE":
      return { phase: "playing", gameMode: action.mode };
    case "RESUME":
      // Resume always uses human-vs-human since mode is not persisted yet
      return { phase: "playing", gameMode: "human-vs-human" };
    default:
      return state;
  }
}

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  useEffect(() => {
    const savedMoves = loadMoveEvents();
    if (savedMoves.length > 0) {
      dispatch({ type: "RESUME" });
    }
  }, []);

  if (state.phase === "mode-select") {
    return (
      <StartScreen
        onSelectMode={(mode) => dispatch({ type: "SELECT_MODE", mode })}
      />
    );
  }

  return (
    <WasmErrorBoundary
      fallback={
        <ErrorMessage message="Something went wrong initializing the chess engine." />
      }
    >
      <ChessApp />
    </WasmErrorBoundary>
  );
}
