import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { WasmErrorBoundary } from "../WasmErrorBoundary";

// Suppress console.error for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalError;
});

function ThrowingComponent(): never {
  throw new Error("WASM init failed");
}

function GoodComponent() {
  return <div>all good</div>;
}

describe("WasmErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <WasmErrorBoundary fallback={<div>error fallback</div>}>
        <GoodComponent />
      </WasmErrorBoundary>
    );
    expect(screen.getByText("all good")).toBeDefined();
  });

  it("renders fallback when child throws", () => {
    render(
      <WasmErrorBoundary fallback={<div>error fallback</div>}>
        <ThrowingComponent />
      </WasmErrorBoundary>
    );
    expect(screen.getByText("error fallback")).toBeDefined();
  });
});
