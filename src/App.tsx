import { useState, useEffect } from "react";
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

function ChessApp({ gameMode: _gameMode }: { gameMode: GameMode | null }) {
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
            isCheck={renderState.isCheck}
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
            <FlipButton onClick={() => setFlipped((f) => !f)} />
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

export function App() {
  const [phase, setPhase] = useState<AppPhase>("mode-select");
  const [gameMode, setGameMode] = useState<GameMode | null>(null);

  // Skip mode-select if localStorage has saved moves
  useEffect(() => {
    const savedMoves = loadMoveEvents();
    if (savedMoves.length > 0) {
      setGameMode("human-vs-human");
      setPhase("playing");
    }
  }, []);

  const handleSelectMode = (mode: GameMode) => {
    setGameMode(mode);
    setPhase("playing");
  };

  if (phase === "mode-select") {
    return <StartScreen onSelectMode={handleSelectMode} />;
  }

  // phase === "playing"
  return (
    <WasmErrorBoundary
      fallback={
        <ErrorMessage message="Something went wrong initializing the chess engine." />
      }
    >
      <ChessApp gameMode={gameMode} />
    </WasmErrorBoundary>
  );
}
