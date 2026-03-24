import type { PromotionPiece } from "../hooks/useBoardInteraction";

interface PromotionDialogProps {
  isOpen: boolean;
  color: "white" | "black";
  onSelect: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

const PIECES: { piece: PromotionPiece; label: string; symbol: string }[] = [
  { piece: "q", label: "Queen", symbol: "♛" },
  { piece: "r", label: "Rook", symbol: "♜" },
  { piece: "b", label: "Bishop", symbol: "♝" },
  { piece: "n", label: "Knight", symbol: "♞" },
];

export function PromotionDialog({ isOpen, color, onSelect, onCancel }: PromotionDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose promotion piece"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 100,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold", fontSize: "16px" }}>
          Choose promotion piece
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          {PIECES.map(({ piece, label, symbol }) => (
            <button
              key={piece}
              aria-label={label}
              onClick={() => onSelect(piece)}
              style={{
                width: "60px",
                height: "60px",
                fontSize: "36px",
                cursor: "pointer",
                border: "2px solid #ccc",
                borderRadius: "8px",
                backgroundColor: color === "white" ? "#fff" : "#333",
                color: color === "white" ? "#000" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {symbol}
            </button>
          ))}
        </div>
        <button
          aria-label="Cancel"
          onClick={onCancel}
          style={{
            padding: "6px 20px",
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
