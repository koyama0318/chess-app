import type { KeyboardEvent } from "react";
import type { PieceCode, Square as SquareType } from "../utils/fen";
import { Piece } from "./Piece";

const PIECE_NAMES: Record<string, string> = {
  K: "White King",
  Q: "White Queen",
  R: "White Rook",
  B: "White Bishop",
  N: "White Knight",
  P: "White Pawn",
  k: "Black King",
  q: "Black Queen",
  r: "Black Rook",
  b: "Black Bishop",
  n: "Black Knight",
  p: "Black Pawn",
};

interface SquareProps {
  square: SquareType;
  piece: PieceCode | null;
  isSelected: boolean;
  isLegalTarget: boolean;
  onClick: (square: SquareType) => void;
}

export function Square({
  square,
  piece,
  isSelected,
  isLegalTarget,
  onClick,
}: SquareProps) {
  const file = square.charCodeAt(0) - "a".charCodeAt(0); // 0-7
  const rank = parseInt(square[1], 10) - 1; // 0-7
  const isLight = (file + rank) % 2 === 1;

  let bg = isLight ? "#f0d9b5" : "#b58863";
  if (isSelected) bg = "#f6f669";
  else if (isLegalTarget) bg = isLight ? "#cdd26a" : "#aaa23a";

  const pieceName = piece ? PIECE_NAMES[piece] ?? piece : null;
  const label = [
    square,
    pieceName,
    isSelected ? "selected" : null,
    isLegalTarget ? "legal move" : null,
  ]
    .filter(Boolean)
    .join(", ");

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(square);
    }
  };

  return (
    <div
      role="gridcell"
      tabIndex={0}
      onClick={() => onClick(square)}
      onKeyDown={handleKeyDown}
      style={{
        flex: 1,
        position: "relative",
        backgroundColor: bg,
        cursor: "pointer",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        outline: "none",
      }}
      data-square={square}
      aria-label={label}
      aria-selected={isSelected}
    >
      {piece && <Piece code={piece} />}
      {isLegalTarget && !piece && (
        <div
          aria-hidden="true"
          style={{
            width: "33%",
            height: "33%",
            borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
        />
      )}
      {isLegalTarget && piece && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            border: "4px solid rgba(0,0,0,0.4)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
