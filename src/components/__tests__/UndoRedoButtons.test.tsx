import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { UndoRedoButtons } from "../UndoRedoButtons";

afterEach(() => {
  cleanup();
});

describe("UndoRedoButtons", () => {
  it("renders Undo and Redo buttons", () => {
    render(
      <UndoRedoButtons
        canUndo={false}
        canRedo={false}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /undo/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /redo/i })).toBeDefined();
  });

  it("Undo button is disabled when canUndo is false", () => {
    render(
      <UndoRedoButtons
        canUndo={false}
        canRedo={true}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />
    );
    const undoBtn = screen.getByRole("button", { name: /undo/i });
    expect(undoBtn).toHaveProperty("disabled", true);
  });

  it("Redo button is disabled when canRedo is false", () => {
    render(
      <UndoRedoButtons
        canUndo={true}
        canRedo={false}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />
    );
    const redoBtn = screen.getByRole("button", { name: /redo/i });
    expect(redoBtn).toHaveProperty("disabled", true);
  });

  it("Undo button is enabled when canUndo is true", () => {
    render(
      <UndoRedoButtons
        canUndo={true}
        canRedo={false}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />
    );
    const undoBtn = screen.getByRole("button", { name: /undo/i });
    expect(undoBtn).toHaveProperty("disabled", false);
  });

  it("Redo button is enabled when canRedo is true", () => {
    render(
      <UndoRedoButtons
        canUndo={false}
        canRedo={true}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
      />
    );
    const redoBtn = screen.getByRole("button", { name: /redo/i });
    expect(redoBtn).toHaveProperty("disabled", false);
  });

  it("calls onUndo when Undo button is clicked", () => {
    const onUndo = vi.fn();
    render(
      <UndoRedoButtons
        canUndo={true}
        canRedo={false}
        onUndo={onUndo}
        onRedo={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it("calls onRedo when Redo button is clicked", () => {
    const onRedo = vi.fn();
    render(
      <UndoRedoButtons
        canUndo={false}
        canRedo={true}
        onUndo={vi.fn()}
        onRedo={onRedo}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /redo/i }));
    expect(onRedo).toHaveBeenCalledOnce();
  });

  it("does not call onUndo when Undo button is disabled and clicked", () => {
    const onUndo = vi.fn();
    render(
      <UndoRedoButtons
        canUndo={false}
        canRedo={false}
        onUndo={onUndo}
        onRedo={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(onUndo).not.toHaveBeenCalled();
  });

  it("does not call onRedo when Redo button is disabled and clicked", () => {
    const onRedo = vi.fn();
    render(
      <UndoRedoButtons
        canUndo={false}
        canRedo={false}
        onUndo={vi.fn()}
        onRedo={onRedo}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /redo/i }));
    expect(onRedo).not.toHaveBeenCalled();
  });
});
