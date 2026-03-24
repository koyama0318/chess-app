export type UndoRedoButtonsProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: UndoRedoButtonsProps) {
  return (
    <div>
      <button type="button" disabled={!canUndo} onClick={onUndo}>
        Undo
      </button>
      <button type="button" disabled={!canRedo} onClick={onRedo}>
        Redo
      </button>
    </div>
  );
}
