import { GameStatus as GameStatusEnum } from "../types/chess";

interface GameStatusProps {
  status: GameStatusEnum;
  currentTurn: "white" | "black";
  isCheck: boolean;
}

export function GameStatus({ status, currentTurn, isCheck }: GameStatusProps) {
  if (status === GameStatusEnum.InProgress) {
    const label = currentTurn === "white" ? "White" : "Black";
    return (
      <p style={{ margin: "8px 0", fontWeight: "bold" }}>
        {isCheck ? `${label} is in check` : `${label} to move`}
      </p>
    );
  }

  const messages: Partial<Record<GameStatusEnum, string>> = {
    [GameStatusEnum.Checkmate]: `Checkmate — ${currentTurn === "white" ? "Black" : "White"} wins!`,
    [GameStatusEnum.Stalemate]: "Stalemate — Draw!",
    [GameStatusEnum.Draw]: "Draw!",
  };

  return (
    <p
      role="alert"
      style={{ margin: "8px 0", fontWeight: "bold", color: "#c0392b" }}
    >
      {messages[status]}
    </p>
  );
}
