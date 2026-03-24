// Type stubs for chess_wasm — replaced by wasm-pack output at build time
export default function init(): Promise<void>;
export class ChessGame {
  static new_from_fen(fen: string): ChessGame;
  render_state(): unknown;
  apply_move(move: string): void;
  undo(): void;
  redo(): void;
  reset(): void;
}
