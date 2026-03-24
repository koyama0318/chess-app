import { useEffect, useRef } from "react";
import type { PromotionPiece } from "../hooks/useBoardInteraction";

interface PromotionDialogProps {
  isOpen: boolean;
  color: "white" | "black";
  onSelect: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

const WHITE_PIECES: { piece: PromotionPiece; label: string; symbol: string }[] = [
  { piece: "q", label: "Queen", symbol: "♕" },
  { piece: "r", label: "Rook", symbol: "♖" },
  { piece: "b", label: "Bishop", symbol: "♗" },
  { piece: "n", label: "Knight", symbol: "♘" },
];

const BLACK_PIECES: { piece: PromotionPiece; label: string; symbol: string }[] = [
  { piece: "q", label: "Queen", symbol: "♛" },
  { piece: "r", label: "Rook", symbol: "♜" },
  { piece: "b", label: "Bishop", symbol: "♝" },
  { piece: "n", label: "Knight", symbol: "♞" },
];

const HEADING_ID = "promotion-dialog-heading";

export function PromotionDialog({ isOpen, color, onSelect, onCancel }: PromotionDialogProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the first piece button when dialog opens
  useEffect(() => {
    if (isOpen) {
      firstButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const pieces = color === "white" ? WHITE_PIECES : BLACK_PIECES;
  const pieceColor = color === "white" ? "#000" : "#fff";
  const pieceBg = color === "white" ? "#fff" : "#333";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={HEADING_ID}
      onClick={onCancel}
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
        onClick={(e) => e.stopPropagation()}
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
        <h2
          id={HEADING_ID}
          style={{ margin: 0, fontWeight: "bold", fontSize: "16px" }}
        >
          Choose promotion piece
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          {pieces.map(({ piece, label, symbol }, index) => (
            <button
              key={piece}
              ref={index === 0 ? firstButtonRef : undefined}
              aria-label={label}
              onClick={() => onSelect(piece)}
              style={{
                width: "60px",
                height: "60px",
                fontSize: "36px",
                cursor: "pointer",
                border: "2px solid #555",
                borderRadius: "8px",
                backgroundColor: pieceBg,
                color: pieceColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                outline: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px #0066cc"; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = ""; }}
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
            border: "2px solid #555",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
            color: "#000",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
