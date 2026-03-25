import { useState, useEffect } from "react";
import { useChessWorker } from "./hooks/useChessWorker";
import { WasmErrorBoundary } from "./components/WasmErrorBoundary";
import { StartScreen } from "./components/StartScreen";
import { Board } from "./components/Board";
import { GameStatus } from "./components/GameStatus";
import { FlipButton } from "./components/FlipButton";
import { GameOverModal } from "./components/GameOverModal";
import { ResetButton } from "./components/ResetButton";
import { ShareButton } from "./components/ShareButton";
import { GameStatus as GameStatusEnum } from "./types/chess";
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

function ChessApp({
  gameMode: _gameMode,
  initialFen,
}: {
  gameMode: GameMode | null;
  initialFen?: string;
}) {
  const {
    initState,
    renderState,
    lastError,
    sendMove,
    sendUndo,
    sendRedo,
    resetGame,
  } = useChessWorker(initialFen);
  const [flipped, setFlipped] = useState(false);
  const [dismissedError, setDismissedError] = useState<string | null>(null);

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
          {lastError &&
            lastError !== dismissedError &&
            renderState.status === GameStatusEnum.InProgress && (
              <div
                role="alert"
                aria-label="Game error"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "8px 16px",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  backgroundColor: "#fee",
                  border: "1px solid #fcc",
                  borderRadius: "4px",
                  color: "#b91c1c",
                  fontSize: "14px",
                }}
              >
                <span>{lastError}</span>
                <button
                  type="button"
                  aria-label="Dismiss error"
                  onClick={() => setDismissedError(lastError)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#b91c1c",
                    fontSize: "16px",
                    padding: "0 4px",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            )}
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
            <ShareButton currentFen={renderState.fen} />
          </div>
        </div>
      );
  }
}

export function App() {
  const urlFen =
    new URLSearchParams(window.location.search).get("fen") ?? undefined;
  const [phase, setPhase] = useState<AppPhase>("mode-select");
  const [gameMode, setGameMode] = useState<GameMode | null>(null);

  // Skip mode-select if URL has ?fen= or localStorage has saved moves
  useEffect(() => {
    if (urlFen) {
      setGameMode("human-vs-human");
      setPhase("playing");
      return;
    }
    const savedMoves = loadMoveEvents();
    if (savedMoves.length > 0) {
      setGameMode("human-vs-human");
      setPhase("playing");
    }
  }, [urlFen]);

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
      <ChessApp gameMode={gameMode} initialFen={urlFen} />
    </WasmErrorBoundary>
  );
}
