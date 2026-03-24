import type { GameMode } from "../types/game";

interface StartScreenProps {
  onSelectMode: (mode: GameMode) => void;
}

const buttonStyle: React.CSSProperties = {
  padding: "12px 24px",
  fontSize: "16px",
  cursor: "pointer",
  background: "#fff",
  color: "#1a1a1a",
  border: "2px solid #333",
  borderRadius: "4px",
};

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
      <fieldset
        style={{
          border: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <legend style={{ fontSize: "18px", marginBottom: "8px", textAlign: "center" }}>
          Choose a game mode
        </legend>
        <button
          type="button"
          onClick={() => onSelectMode("human-vs-human")}
          style={buttonStyle}
        >
          Human vs Human
        </button>
        <button
          type="button"
          onClick={() => onSelectMode("human-vs-cpu")}
          style={buttonStyle}
        >
          Human vs Computer
        </button>
      </fieldset>
    </div>
  );
}
