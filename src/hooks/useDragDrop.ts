import { useState, useCallback, useRef } from "react";
import type { RenderState } from "../types/chess";
import { getFenTurn, parseFen } from "../utils/fen";

interface DragState {
  isDragging: boolean;
  draggedPiece: string | null;
  draggedFrom: string | null;
  dragX: number;
  dragY: number;
}

const initialDragState: DragState = {
  isDragging: false,
  draggedPiece: null,
  draggedFrom: null,
  dragX: 0,
  dragY: 0,
};

function buildUci(from: string, to: string, piece: string): string {
  const isPromotion =
    (piece === "P" && to[1] === "8") || (piece === "p" && to[1] === "1");
  return isPromotion ? `${from}${to}q` : `${from}${to}`;
}

export function useDragDrop(
  renderState: RenderState | null,
  onMove: (uciMove: string) => void
) {
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const pointerIdRef = useRef<number | null>(null);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>, square: string) => {
      if (!renderState) return;
      const turn = getFenTurn(renderState.fen);
      const pieceMap = parseFen(renderState.fen);
      const piece = pieceMap.get(square);
      if (!piece) return;

      const isWhitePiece = piece === piece.toUpperCase();
      if (
        (turn === "white" && !isWhitePiece) ||
        (turn === "black" && isWhitePiece)
      ) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      pointerIdRef.current = event.pointerId;

      setDragState({
        isDragging: true,
        draggedPiece: piece,
        draggedFrom: square,
        dragX: event.clientX,
        dragY: event.clientY,
      });
    },
    [renderState]
  );

  const handlePointerMove = useCallback((event: React.PointerEvent) => {
    if (!dragState.isDragging) return;
    setDragState((prev) => ({
      ...prev,
      dragX: event.clientX,
      dragY: event.clientY,
    }));
  }, [dragState.isDragging]);

  const handlePointerUp = useCallback(
    (event: React.PointerEvent) => {
      if (!dragState.isDragging || !dragState.draggedFrom || !dragState.draggedPiece) return;

      const target = document.elementFromPoint(event.clientX, event.clientY);
      const squareEl = target?.closest<HTMLElement>("[data-square]");
      const toSquare = squareEl?.getAttribute("data-square");

      if (toSquare && toSquare !== dragState.draggedFrom) {
        const fromTo = `${dragState.draggedFrom}${toSquare}`;
        const isLegal = renderState?.legalMoves.some((m) =>
          m.startsWith(fromTo)
        );
        if (isLegal) {
          const uci = buildUci(dragState.draggedFrom, toSquare, dragState.draggedPiece);
          onMove(uci);
        }
      }

      pointerIdRef.current = null;
      setDragState(initialDragState);
    },
    [dragState, renderState, onMove]
  );

  return {
    dragState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
