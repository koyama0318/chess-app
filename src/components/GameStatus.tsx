import { GameStatus as GameStatusEnum } from "../types/chess";

interface GameStatusProps {
  status: GameStatusEnum;
  currentTurn: "white" | "black";
}

export function GameStatus({ status, currentTurn }: GameStatusProps) {
  if (status === GameStatusEnum.InProgress) {
    return (
      <p style={{ margin: "8px 0", fontWeight: "bold" }}>
        {currentTurn === "white" ? "White" : "Black"} to move
      </p>
    );
  }

  const messages: Record<GameStatusEnum, string> = {
    [GameStatusEnum.InProgress]: "",
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
