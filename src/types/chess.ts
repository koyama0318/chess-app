export const enum GameStatus {
  InProgress = 0,
  Check = 1,
  Checkmate = 2,
  Stalemate = 3,
  Draw = 4,
}

export interface RenderState {
  fen: string;
  legalMoves: string[];
  status: GameStatus;
  canUndo: boolean;
  canRedo: boolean;
}
