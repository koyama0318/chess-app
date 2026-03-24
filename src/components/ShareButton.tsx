import { useState } from "react";

interface ShareButtonProps {
  currentFen: string;
}

export function ShareButton({ currentFen }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const url = `${window.location.origin}${window.location.pathname}?fen=${encodeURIComponent(currentFen)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleClick} type="button">
      {copied ? "コピーしました" : "共有"}
    </button>
  );
}
