import { useState, useCallback, useRef, useMemo } from "react";
import type { RenderState } from "../types/chess";
import { parseFen, getFenTurn } from "../utils/fen";
import type { Square, PieceCode } from "../utils/fen";

export function useBoardInteraction(
  renderState: RenderState | null,
  onMove: (uciMove: string) => void
): {
  selectedSquare: Square | null;
  legalTargets: Square[];
  pieceMap: Map<Square, PieceCode>;
  handleSquareClick: (square: Square) => void;
} {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<Square[]>([]);

  // Mirror state in a ref so handleSquareClick can read latest values
  // without including them in the useCallback dependency array
  const stateRef = useRef({ selectedSquare, legalTargets });
  stateRef.current = { selectedSquare, legalTargets };

  const pieceMap = useMemo(
    () => (renderState ? parseFen(renderState.fen) : new Map<string, string>()),
    [renderState]
  );

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!renderState) return;

      const { selectedSquare: selected, legalTargets: targets } =
        stateRef.current;
      const turn = getFenTurn(renderState.fen);

      // If clicking a legal target, execute the move
      if (selected && targets.includes(square)) {
        const fromTo = `${selected}${square}`;
        const promotionMove = renderState.legalMoves.find(
          (m) => m.startsWith(fromTo) && m.length === 5 && m[4] === "q"
        );
        const exactMove = renderState.legalMoves.find((m) => m === fromTo);
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
      const newTargets = renderState.legalMoves
        .filter((m) => m.startsWith(square))
        .map((m) => m.slice(2, 4));

      setSelectedSquare(square);
      setLegalTargets(newTargets);
    },
    [renderState, onMove, pieceMap]
  );

  return { selectedSquare, legalTargets, pieceMap, handleSquareClick };
}
