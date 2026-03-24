interface FlipButtonProps {
  onClick: () => void;
}

export function FlipButton({ onClick }: FlipButtonProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      style={{
        padding: "6px 14px",
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      Flip Board
    </button>
  );
}
