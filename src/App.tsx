import { useChessWorker } from "./hooks/useChessWorker";
import { WasmErrorBoundary } from "./components/WasmErrorBoundary";

function ChessApp() {
  const { initState, renderState } = useChessWorker();

  switch (initState) {
    case "uninit":
    case "initializing":
      return <h1>Loading WASM...</h1>;
    case "error":
      return <h1>Failed to initialize WASM engine.</h1>;
    case "ready":
      return (
        <h1>
          {renderState
            ? `FEN: ${renderState.fen}`
            : "Chess engine ready"}
        </h1>
      );
  }
}

export function App() {
  return (
    <WasmErrorBoundary fallback={<h1>Something went wrong.</h1>}>
      <ChessApp />
    </WasmErrorBoundary>
  );
}
