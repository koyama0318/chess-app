import type { GameMode } from "../types/game";

interface StartScreenProps {
  onSelectMode: (mode: GameMode) => void;
}

export function StartScreen({ onSelectMode }: StartScreenProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        padding: "48px 16px",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Chess</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <button
          type="button"
          onClick={() => onSelectMode("human-vs-human")}
          style={{ padding: "12px 24px", fontSize: "16px", cursor: "pointer" }}
        >
          Human vs Human
        </button>
        <button
          type="button"
          onClick={() => onSelectMode("human-vs-cpu")}
          style={{ padding: "12px 24px", fontSize: "16px", cursor: "pointer" }}
        >
          Human vs Computer
        </button>
      </div>
    </div>
  );
}
