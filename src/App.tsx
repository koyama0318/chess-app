import { useEffect, useState } from "react";
import init, { fen_from_starting_position } from "../wasm-pkg/chess_wasm";

export function App() {
  const [message, setMessage] = useState("loading wasm...");

  useEffect(() => {
    init().then(() => {
      setMessage(fen_from_starting_position());
    });
  }, []);

  return <h1>{message}</h1>;
}
