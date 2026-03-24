import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PromotionDialog } from "../PromotionDialog";

describe("PromotionDialog", () => {
  afterEach(() => cleanup());

  it("renders nothing when closed", () => {
    const { container } = render(
      <PromotionDialog
        isOpen={false}
        color="white"
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders 4 piece buttons when open", () => {
    render(
      <PromotionDialog
        isOpen={true}
        color="white"
        onSelect={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /queen/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /rook/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bishop/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /knight/i })).toBeInTheDocument();
  });

  it("calls onSelect with 'q' when Queen is clicked", () => {
    const onSelect = vi.fn();
    render(
      <PromotionDialog isOpen={true} color="white" onSelect={onSelect} onCancel={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: /queen/i }));
    expect(onSelect).toHaveBeenCalledWith("q");
  });

  it("calls onSelect with 'r' when Rook is clicked", () => {
    const onSelect = vi.fn();
    render(
      <PromotionDialog isOpen={true} color="white" onSelect={onSelect} onCancel={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: /rook/i }));
    expect(onSelect).toHaveBeenCalledWith("r");
  });

  it("calls onSelect with 'b' when Bishop is clicked", () => {
    const onSelect = vi.fn();
    render(
      <PromotionDialog isOpen={true} color="white" onSelect={onSelect} onCancel={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: /bishop/i }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });

  it("calls onSelect with 'n' when Knight is clicked", () => {
    const onSelect = vi.fn();
    render(
      <PromotionDialog isOpen={true} color="white" onSelect={onSelect} onCancel={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: /knight/i }));
    expect(onSelect).toHaveBeenCalledWith("n");
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(
      <PromotionDialog isOpen={true} color="white" onSelect={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when backdrop is clicked", () => {
    const onCancel = vi.fn();
    render(
      <PromotionDialog isOpen={true} color="white" onSelect={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByRole("dialog"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onCancel when Escape key is pressed", () => {
    const onCancel = vi.fn();
    render(
      <PromotionDialog isOpen={true} color="white" onSelect={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("has accessible dialog heading", () => {
    render(
      <PromotionDialog isOpen={true} color="white" onSelect={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByRole("heading", { name: /choose promotion piece/i })).toBeInTheDocument();
  });
});
