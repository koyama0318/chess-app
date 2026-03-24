const STORAGE_KEY = "chess_move_events";

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
}
