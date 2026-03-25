import type { RenderState } from "../types/chess";
import { parseFen } from "../utils/fen";
import { useBoardInteraction } from "../hooks/useBoardInteraction";
import { useDragDrop } from "../hooks/useDragDrop";
import { Square } from "./Square";
import { PromotionDialog } from "./PromotionDialog";
import { Piece } from "./Piece";

interface BoardProps {
  renderState: RenderState;
  onMove: (uciMove: string) => void;
  flipped: boolean;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export function Board({ renderState, onMove, flipped }: BoardProps) {
  const {
    selectedSquare,
    legalTargets,
    handleSquareClick,
    pendingPromotion,
    handlePromotionSelect,
    handlePromotionCancel,
  } = useBoardInteraction(renderState, onMove);

  const { dragState, handlePointerDown, handlePointerMove, handlePointerUp } =
    useDragDrop(renderState, onMove);

  const pieceMap = parseFen(renderState.fen);

  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const files = flipped ? [...FILES].reverse() : FILES;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "min(80vw, 560px)",
          aspectRatio: "1",
          border: "2px solid #333",
          boxSizing: "border-box",
          position: "relative",
          touchAction: "none",
        }}
        aria-label="Chess board"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {ranks.map((rank, rankIdx) => (
          <div
            key={rank}
            style={{ display: "flex", flex: 1 }}
          >
            {files.map((file, fileIdx) => {
              const sq = `${file}${rank}`;
              const isDragging = dragState.isDragging && dragState.draggedFrom === sq;
              return (
                <Square
                  key={sq}
                  square={sq}
                  piece={isDragging ? null : (pieceMap.get(sq) ?? null)}
                  isSelected={selectedSquare === sq}
                  isLegalTarget={legalTargets.includes(sq)}
                  onClick={handleSquareClick}
                  onPointerDown={handlePointerDown}
                  rankLabel={fileIdx === 0 ? String(rank) : undefined}
                  fileLabel={rankIdx === ranks.length - 1 ? file : undefined}
                />
              );
            })}
          </div>
        ))}
        {dragState.isDragging && dragState.draggedPiece && (
          <div
            style={{
              position: "fixed",
              left: dragState.dragX,
              top: dragState.dragY,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 1000,
            }}
          >
            <Piece code={dragState.draggedPiece} />
          </div>
        )}
      </div>
      <PromotionDialog
        isOpen={pendingPromotion !== null}
        color={renderState.currentTurn}
        onSelect={handlePromotionSelect}
        onCancel={handlePromotionCancel}
      />
    </>
  );
}
