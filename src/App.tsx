import { useEffect, useState } from "react";
import init, { greet } from "../wasm-pkg/chess_wasm";

export function App() {
  const [message, setMessage] = useState("loading wasm...");

  useEffect(() => {
    init().then(() => {
      setMessage(greet());
    });
  }, []);

  return <h1>{message}</h1>;
}
