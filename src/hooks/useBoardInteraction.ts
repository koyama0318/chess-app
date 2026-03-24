import { useState, useCallback } from "react";
import type { RenderState } from "../types/chess";
import { parseFen, getFenTurn } from "../utils/fen";
import type { Square } from "../utils/fen";

export function useBoardInteraction(
  renderState: RenderState | null,
  onMove: (uciMove: string) => void
): {
  selectedSquare: Square | null;
  legalTargets: Square[];
  handleSquareClick: (square: Square) => void;
} {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!renderState) return;

      const turn = getFenTurn(renderState.fen);
      const pieceMap = parseFen(renderState.fen);

      // If clicking a legal target, execute the move
      if (selectedSquare && legalTargets.includes(square)) {
        // Find the best move: prefer promotion with queen
        const fromTo = `${selectedSquare}${square}`;
        const promotionMove = renderState.legalMoves.find(
          (m) => m.startsWith(fromTo) && m.length === 5 && m[4] === "q"
        );
        const exactMove = renderState.legalMoves.find(
          (m) => m === fromTo
        );
        const move = promotionMove ?? exactMove ?? fromTo;
        onMove(move);
        setSelectedSquare(null);
        setLegalTargets([]);
        return;
      }

      // Try to select the clicked square
      const piece = pieceMap.get(square);
      if (!piece) {
        setSelectedSquare(null);
        setLegalTargets([]);
        return;
      }

      // Check ownership: uppercase = white, lowercase = black
      const isWhitePiece = piece === piece.toUpperCase();
      if (
        (turn === "white" && !isWhitePiece) ||
        (turn === "black" && isWhitePiece)
      ) {
        setSelectedSquare(null);
        setLegalTargets([]);
        return;
      }

      // Filter legal moves from this square
      const targets = renderState.legalMoves
        .filter((m) => m.startsWith(square))
        .map((m) => m.slice(2, 4));

      setSelectedSquare(square);
      setLegalTargets(targets);
    },
    [renderState, selectedSquare, legalTargets, onMove]
  );

  return { selectedSquare, legalTargets, handleSquareClick };
}
