const STORAGE_KEY = "chess_move_events";
const SNAPSHOT_KEY = "chess_fen_snapshot";
export const SNAPSHOT_INTERVAL = 20;

export function saveSnapshot(fen: string): void {
  localStorage.setItem(SNAPSHOT_KEY, fen);
  localStorage.removeItem(STORAGE_KEY);
}

export function loadGameState(): { fenSnapshot: string | null; uciMoves: string[] } {
  return {
    fenSnapshot: localStorage.getItem(SNAPSHOT_KEY),
    uciMoves: loadMoveEvents(),
  };
}

export function saveMoveEvent(uciMove: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const events = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(events)) return;
    events.push(uciMove);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Corrupt storage — don't overwrite, just skip
  }
}

export function loadMoveEvents(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function clearMoveEvents(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SNAPSHOT_KEY);
}

export function popMoveEvent(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const events = JSON.parse(raw);
    if (!Array.isArray(events) || events.length === 0) return;
    events.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Corrupt storage — ignore
  }
}

export function getMoveEventCount(): number {
  return loadMoveEvents().length;
}
