import type { RenderState } from "../types/chess";
import { parseFen } from "../utils/fen";
import { useBoardInteraction } from "../hooks/useBoardInteraction";
import { Square } from "./Square";

interface BoardProps {
  renderState: RenderState;
  onMove: (uciMove: string) => void;
  flipped: boolean;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

export function Board({ renderState, onMove, flipped }: BoardProps) {
  const { selectedSquare, legalTargets, handleSquareClick } =
    useBoardInteraction(renderState, onMove);

  const pieceMap = parseFen(renderState.fen);

  const ranks = flipped ? [...RANKS].reverse() : RANKS;
  const files = flipped ? [...FILES].reverse() : FILES;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "min(80vw, 560px)",
        aspectRatio: "1",
        border: "2px solid #333",
        boxSizing: "border-box",
      }}
      aria-label="Chess board"
    >
      {ranks.map((rank) => (
        <div
          key={rank}
          style={{ display: "flex", flex: 1 }}
        >
          {files.map((file) => {
            const sq = `${file}${rank}`;
            return (
              <Square
                key={sq}
                square={sq}
                piece={pieceMap.get(sq) ?? null}
                isSelected={selectedSquare === sq}
                isLegalTarget={legalTargets.includes(sq)}
                onClick={handleSquareClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
