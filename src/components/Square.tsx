import React from "react";
import type { PieceCode, Square as SquareType } from "../utils/fen";
import { Piece } from "./Piece";

interface SquareProps {
  square: SquareType;
  piece: PieceCode | null;
  isSelected: boolean;
  isLegalTarget: boolean;
  onClick: (square: SquareType) => void;
  onPointerDown?: (event: React.PointerEvent<HTMLElement>, square: SquareType) => void;
}

export function Square({
  square,
  piece,
  isSelected,
  isLegalTarget,
  onClick,
  onPointerDown,
}: SquareProps) {
  const file = square.charCodeAt(0) - "a".charCodeAt(0); // 0-7
  const rank = parseInt(square[1], 10) - 1; // 0-7
  const isLight = (file + rank) % 2 === 1;

  let bg = isLight ? "#f0d9b5" : "#b58863";
  if (isSelected) bg = "#f6f669";
  else if (isLegalTarget) bg = isLight ? "#cdd26a" : "#aaa23a";

  return (
    <div
      onClick={() => onClick(square)}
      onPointerDown={onPointerDown ? (e) => onPointerDown(e as React.PointerEvent<HTMLElement>, square) : undefined}
      style={{
        width: "12.5%",
        paddingBottom: "12.5%",
        position: "relative",
        backgroundColor: bg,
        cursor: "pointer",
        boxSizing: "border-box",
      }}
      data-square={square}
      aria-label={square}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {piece && <Piece code={piece} />}
        {isLegalTarget && !piece && (
          <div
            style={{
              width: "33%",
              height: "33%",
              borderRadius: "50%",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          />
        )}
        {isLegalTarget && piece && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "4px solid rgba(0,0,0,0.3)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
