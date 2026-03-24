import { GameStatus } from "../types/chess";

interface GameOverModalProps {
  status: GameStatus;
  currentTurn: "white" | "black";
  onRematch: () => void;
}

export function GameOverModal({ status, currentTurn, onRematch }: GameOverModalProps) {
  if (status === GameStatus.InProgress) return null;

  let message: string;
  if (status === GameStatus.Checkmate) {
    message = currentTurn === "white" ? "Black wins!" : "White wins!";
  } else if (status === GameStatus.Stalemate) {
    message = "Stalemate — Draw!";
  } else {
    message = "Draw!";
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 100,
        animation: "fadeIn 0.2s ease-in",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "32px 40px",
          textAlign: "center",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          minWidth: "240px",
        }}
      >
        <p
          style={{
            fontSize: "1.4rem",
            fontWeight: "bold",
            margin: "0 0 20px",
          }}
        >
          {message}
        </p>
        <button
          onClick={onRematch}
          type="button"
          style={{
            padding: "10px 24px",
            fontSize: "1rem",
            cursor: "pointer",
            backgroundColor: "#4a90e2",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
          }}
        >
          もう一度
        </button>
      </div>
    </div>
  );
}
