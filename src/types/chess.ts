export enum GameStatus {
  InProgress = 0,
  Checkmate = 1,
  Stalemate = 2,
  Draw = 3,
}

export interface RenderState {
  fen: string;
  board: Record<string, string>;
  legalMoves: string[];
  status: GameStatus;
  isCheck: boolean;
  canUndo: boolean;
  canRedo: boolean;
  currentTurn: "white" | "black";
}
