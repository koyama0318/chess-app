type ResetButtonProps = { onClick: () => void };

export function ResetButton({ onClick }: ResetButtonProps) {
  return (
    <button onClick={onClick} type="button">
      New Game
    </button>
  );
}
