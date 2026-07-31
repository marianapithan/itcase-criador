"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700 transition-colors shrink-0">
      {ok ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
      {ok ? "Copiado!" : "Copiar"}
    </button>
  );
}
