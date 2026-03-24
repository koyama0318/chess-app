// Stub for test environments — replaced by wasm-pack output at build time
export default async function init() {}
export class ChessGame {
  static new_from_fen(_fen) { return new ChessGame(); }
  render_state() { return {}; }
  apply_move(_move) {}
  undo() {}
  redo() {}
  reset() {}
}
