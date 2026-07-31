"use client";
import { useState } from "react";
import { CheckCircle2, ArrowRight, Pencil, Check, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  metaMes: number;
  publicadosMes: number;
  nomeMes: string;
  fraseMot: string;
  sparkPoints: string;
  svgW: number;
  svgH: number;
  acumulado: number[];
}

export function MetaEditor({ metaMes: metaMesInicial, publicadosMes, nomeMes, fraseMot, sparkPoints, svgW, svgH, acumulado }: Props) {
  const [metaMes, setMetaMes] = useState(metaMesInicial);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(metaMesInicial || ""));
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  const progMes = metaMes > 0 ? Math.min(100, (publicadosMes / metaMes) * 100) : 0;
  const corProg = progMes >= 100 ? "#c8d92a" : progMes >= 60 ? "#9b8fd4" : "#fbbf24";

  async function salvar() {
    const nova = parseInt(valor, 10);
    if (isNaN(nova) || nova < 1) return;
    setSalvando(true);
    await fetch("/api/config/geral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metaPublicados: nova }),
    });
    setMetaMes(nova);
    setEditando(false);
    setSalvando(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--card-border)" }}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={13} style={{ color: "var(--muted)" }} />
          <span className="section-label">Publicados em {nomeMes}</span>
        </div>
        <Link href="/biblioteca" className="text-[11px] flex items-center gap-1" style={{ color: "var(--muted)" }}>
          Ver biblioteca <ArrowRight size={10} />
        </Link>
      </div>

      <div className="p-5">
        <div className="flex items-end gap-2 mb-3">
          <span className="text-4xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>
            {publicadosMes}
          </span>
          {metaMes > 0 && !editando && (
            <>
              <span className="text-sm mb-1" style={{ color: "var(--muted)" }}>/ {metaMes} meta</span>
              <span className="text-sm font-bold mb-1" style={{ color: corProg }}>{Math.round(progMes)}%</span>
            </>
          )}
          <button
            onClick={() => { setValor(String(metaMes || "")); setEditando(true); }}
            className="ml-auto flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all"
            style={{ color: "var(--muted)", background: "var(--accent)", border: "1px solid var(--card-border)" }}
          >
            <Pencil size={10} /> {metaMes > 0 ? "Editar meta" : "Definir meta"}
          </button>
        </div>

        {/* Editor inline */}
        {editando && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 relative">
              <input
                type="number" min={1} max={999} autoFocus
                value={valor}
                onChange={e => setValor(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") salvar(); if (e.key === "Escape") setEditando(false); }}
                placeholder="Ex: 12"
                className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none"
                style={{ background: "var(--accent)", color: "var(--foreground)", border: "1px solid #c8d92a" }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--muted)" }}>posts/mês</span>
            </div>
            <button onClick={salvar} disabled={salvando}
              className="p-2 rounded-xl disabled:opacity-40"
              style={{ background: "#c8d92a", color: "#0d2b1e" }}>
              {salvando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button onClick={() => setEditando(false)}
              className="p-2 rounded-xl"
              style={{ background: "var(--accent)", color: "var(--muted)", border: "1px solid var(--card-border)" }}>
              <X size={14} />
            </button>
          </div>
        )}

        {metaMes > 0 && !editando && (
          <>
            {acumulado.some(v => v > 0) && (
              <div className="mb-3">
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-10" preserveAspectRatio="none">
                  <polyline points={sparkPoints} fill="none" stroke={corProg} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <div className="w-full rounded-full h-2 mb-3" style={{ background: "var(--accent)" }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${progMes}%`, background: corProg }} />
            </div>
            <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
              {progMes >= 100
                ? "Meta do mês atingida! Hora de comemorar!"
                : `${metaMes - publicadosMes} publicaç${metaMes - publicadosMes !== 1 ? "ões" : "ão"} para a meta`}
            </p>
            <p className="text-[11px] italic" style={{ color: "var(--muted)" }}>{fraseMot}</p>
          </>
        )}

        {metaMes === 0 && !editando && (
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            Clique em "Definir meta" para acompanhar seu progresso mensal.
          </p>
        )}
      </div>
    </div>
  );
}
