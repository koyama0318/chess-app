import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { GameOverModal } from "../GameOverModal";
import { GameStatus } from "../../types/chess";

describe("GameOverModal", () => {
  it("renders nothing when status is InProgress", () => {
    const { container } = render(
      <GameOverModal status={GameStatus.InProgress} currentTurn="white" onRematch={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows modal when Checkmate", () => {
    render(
      <GameOverModal status={GameStatus.Checkmate} currentTurn="white" onRematch={vi.fn()} />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows 'Black wins' when white is checkmated", () => {
    render(
      <GameOverModal status={GameStatus.Checkmate} currentTurn="white" onRematch={vi.fn()} />
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Black wins!")).toBeInTheDocument();
  });

  it("shows 'White wins' when black is checkmated", () => {
    render(
      <GameOverModal status={GameStatus.Checkmate} currentTurn="black" onRematch={vi.fn()} />
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("White wins!")).toBeInTheDocument();
  });

  it("shows stalemate message", () => {
    render(
      <GameOverModal status={GameStatus.Stalemate} currentTurn="white" onRematch={vi.fn()} />
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Stalemate/i)).toBeInTheDocument();
  });

  it("shows draw message", () => {
    render(
      <GameOverModal status={GameStatus.Draw} currentTurn="white" onRematch={vi.fn()} />
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Draw/i)).toBeInTheDocument();
  });

  it("calls onRematch when button clicked", () => {
    const onRematch = vi.fn();
    render(
      <GameOverModal status={GameStatus.Checkmate} currentTurn="black" onRematch={onRematch} />
    );
    fireEvent.click(screen.getByRole("button", { name: /もう一度/i }));
    expect(onRematch).toHaveBeenCalledTimes(1);
  });

  it("has rematch button", () => {
    render(
      <GameOverModal status={GameStatus.Stalemate} currentTurn="white" onRematch={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: /もう一度/i })).toBeInTheDocument();
  });
});
