export function ResetButton({ onClick }: { onClick: () => void }) {
  const handleClick = () => {
    if (window.confirm("Start a new game? Current game will be lost.")) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      aria-label="Start a new game (current game will be lost)"
      style={{ marginLeft: "8px" }}
    >
      New Game
    </button>
  );
}
