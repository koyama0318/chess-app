import { useChessWorker } from "./hooks/useChessWorker";
import { WasmErrorBoundary } from "./components/WasmErrorBoundary";

function LoadingIndicator() {
  return (
    <p role="status" aria-live="polite" aria-label="Loading chess engine">
      Loading chess engine
      <span aria-hidden="true"> ...</span>
    </p>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div role="alert">
      <p>{message}</p>
      <button onClick={() => window.location.reload()} type="button">
        Retry
      </button>
    </div>
  );
}

function ChessApp() {
  const { initState, renderState } = useChessWorker();

  switch (initState) {
    case "uninit":
      return null;
    case "initializing":
      return <LoadingIndicator />;
    case "error":
      return (
        <ErrorMessage message="Failed to initialize chess engine." />
      );
    case "ready":
      return (
        <p>
          {renderState
            ? `FEN: ${renderState.fen}`
            : "Chess engine ready"}
        </p>
      );
  }
}

export function App() {
  return (
    <WasmErrorBoundary
      fallback={
        <ErrorMessage message="Something went wrong initializing the chess engine." />
      }
    >
      <ChessApp />
    </WasmErrorBoundary>
  );
}
