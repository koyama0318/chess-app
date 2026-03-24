export type Square = string; // "a1" .. "h8"
export type PieceCode = string; // "P","N","B","R","Q","K","p","n","b","r","q","k"

export function parseFen(fen: string): Map<Square, PieceCode> {
  const board = new Map<Square, PieceCode>();
  const piecePart = fen.split(" ")[0];
  const ranks = piecePart.split("/");

  for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
    const rank = ranks[rankIdx];
    const rankNumber = 8 - rankIdx; // rank 8 is top row
    let fileIdx = 0;

    for (const ch of rank) {
      if (ch >= "1" && ch <= "8") {
        fileIdx += parseInt(ch, 10);
      } else {
        const file = String.fromCharCode("a".charCodeAt(0) + fileIdx);
        board.set(`${file}${rankNumber}`, ch);
        fileIdx++;
      }
    }
  }

  return board;
}

export function getFenTurn(fen: string): "white" | "black" {
  const parts = fen.split(" ");
  return parts[1] === "b" ? "black" : "white";
}
