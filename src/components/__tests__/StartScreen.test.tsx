import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartScreen } from "../StartScreen";

describe("StartScreen", () => {
  it("renders title and two mode buttons", () => {
    render(<StartScreen onSelectMode={vi.fn()} />);

    expect(screen.getByText("Chess")).toBeDefined();
    expect(screen.getByText("Human vs Human")).toBeDefined();
    expect(screen.getByText("Human vs Computer")).toBeDefined();
  });

  it('calls onSelectMode with "human-vs-human" when clicking Human vs Human', async () => {
    const onSelectMode = vi.fn();
    render(<StartScreen onSelectMode={onSelectMode} />);

    await userEvent.click(screen.getByText("Human vs Human"));

    expect(onSelectMode).toHaveBeenCalledWith("human-vs-human");
  });

  it('calls onSelectMode with "human-vs-cpu" when clicking Human vs Computer', async () => {
    const onSelectMode = vi.fn();
    render(<StartScreen onSelectMode={onSelectMode} />);

    await userEvent.click(screen.getByText("Human vs Computer"));

    expect(onSelectMode).toHaveBeenCalledWith("human-vs-cpu");
  });
});
