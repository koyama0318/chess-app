import type { PieceCode } from "../utils/fen";

const PIECE_UNICODE: Record<string, string> = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

interface PieceProps {
  code: PieceCode;
}

export function Piece({ code }: PieceProps) {
  return (
    <span
      style={{
        fontSize: "clamp(24px, 4vw, 52px)",
        lineHeight: 1,
        userSelect: "none",
        cursor: "pointer",
      }}
      aria-hidden="true"
    >
      {PIECE_UNICODE[code] ?? code}
    </span>
  );
}
