import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface WasmErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface WasmErrorBoundaryState {
  hasError: boolean;
}

export class WasmErrorBoundary extends Component<
  WasmErrorBoundaryProps,
  WasmErrorBoundaryState
> {
  constructor(props: WasmErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): WasmErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("WasmErrorBoundary caught:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
