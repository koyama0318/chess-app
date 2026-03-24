import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ShareButton } from "../ShareButton";

const SAMPLE_FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

describe("ShareButton", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
  });

  it("renders a share button", () => {
    render(<ShareButton currentFen={SAMPLE_FEN} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("copies URL with encoded FEN to clipboard on click", async () => {
    render(<ShareButton currentFen={SAMPLE_FEN} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    const expectedUrl = `${window.location.origin}${window.location.pathname}?fen=${encodeURIComponent(SAMPLE_FEN)}`;
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedUrl);
  });

  it("shows 'コピーしました' feedback after clicking", async () => {
    render(<ShareButton currentFen={SAMPLE_FEN} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(screen.getByText(/コピーしました/)).toBeInTheDocument();
  });

  it("hides 'コピーしました' feedback after 2 seconds", async () => {
    render(<ShareButton currentFen={SAMPLE_FEN} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText(/コピーしました/)).toBeNull();
  });
});
