import { useState, useCallback } from "react";
import type { RenderState } from "../types/chess";
import { parseFen, getFenTurn } from "../utils/fen";
import type { Square } from "../utils/fen";

export type PromotionPiece = "q" | "r" | "b" | "n";

export interface PendingPromotion {
  from: Square;
  to: Square;
}

export function useBoardInteraction(
  renderState: RenderState | null,
  onMove: (uciMove: string) => void
): {
  selectedSquare: Square | null;
  legalTargets: Square[];
  handleSquareClick: (square: Square) => void;
  pendingPromotion: PendingPromotion | null;
  handlePromotionSelect: (piece: PromotionPiece) => void;
  handlePromotionCancel: () => void;
} {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!renderState) return;

      const turn = getFenTurn(renderState.fen);
      const pieceMap = parseFen(renderState.fen);

      // If clicking a legal target, execute the move
      if (selectedSquare && legalTargets.includes(square)) {
        const fromTo = `${selectedSquare}${square}`;
        // Check if this is a promotion move
        const isPromotion = renderState.legalMoves.some(
          (m) => m.startsWith(fromTo) && m.length === 5
        );
        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }
        onMove(fromTo);
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

  const handlePromotionSelect = useCallback(
    (piece: PromotionPiece) => {
      if (!pendingPromotion) return;
      onMove(`${pendingPromotion.from}${pendingPromotion.to}${piece}`);
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalTargets([]);
    },
    [pendingPromotion, onMove]
  );

  const handlePromotionCancel = useCallback(() => {
    setPendingPromotion(null);
  }, []);

  return {
    selectedSquare,
    legalTargets,
    handleSquareClick,
    pendingPromotion,
    handlePromotionSelect,
    handlePromotionCancel,
  };
}
