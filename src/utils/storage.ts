const STORAGE_KEY = "chess_move_events";

export function saveMoveEvent(uciMove: string): void {
  const events = loadMoveEvents();
  events.push(uciMove);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
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
