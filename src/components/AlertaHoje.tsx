"use client";
import { useEffect, useState } from "react";
import { Bell, X, CheckCircle2, CalendarDays } from "lucide-react";
import { FORMATOS_CONFIG } from "@/lib/constants";

type Conteudo = { id: string; titulo: string; formato: string; status: string };

export function AlertaHoje() {
  const [pendentes, setPendentes] = useState<Conteudo[]>([]);
  const [aberto, setAberto] = useState(false);
  const [concluindo, setConcluindo] = useState<string | null>(null);

  async function carregar() {
    try {
      const res = await fetch("/api/conteudos?pendentesHoje=true");
      if (!res.ok) return;
      const data: Conteudo[] = await res.json();
      if (data.length > 0) {
        setPendentes(data);
        setAberto(true);
      }
    } catch {}
  }

  useEffect(() => { carregar(); }, []);

  async function marcarPostado(id: string) {
    setConcluindo(id);
    try {
      await fetch(`/api/conteudos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLICADO", concluido: true }),
      });
      setPendentes((p) => p.filter((c) => c.id !== id));
    } finally {
      setConcluindo(null);
    }
  }

  useEffect(() => {
    if (pendentes.length === 0) setAberto(false);
  }, [pendentes]);

  if (!aberto || pendentes.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(9,30,20,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl" style={{ background: "#122a1d", border: "1px solid #1e4535" }}>
        {/* Header */}
        <div className="px-5 py-4 flex items-start gap-3" style={{ borderBottom: "1px solid #1e4535", background: "rgba(240,96,128,0.08)" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(240,96,128,0.15)", border: "1px solid rgba(240,96,128,0.3)" }}>
            <Bell size={18} style={{ color: "#f06080" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
              {pendentes.length === 1 ? "1 conteúdo pra publicar hoje!" : `${pendentes.length} conteúdos pra publicar hoje!`}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "#6a9a78" }}>Marque como postado para fechar este aviso.</p>
          </div>
          <button onClick={() => setAberto(false)} style={{ color: "#4a7055" }} className="hover:text-[#e4f0de] transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Lista */}
        <div className="max-h-64 overflow-y-auto" style={{ borderBottom: "1px solid #1e4535" }}>
          {pendentes.map((c) => {
            const fmt = FORMATOS_CONFIG[c.formato];
            return (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid #1a3828" }}>
                <CalendarDays size={14} style={{ color: "#f06080" }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#e4f0de" }}>{c.titulo}</div>
                  {fmt && <div className="text-[11px]" style={{ color: "#6a9a78" }}>{fmt.label}</div>}
                </div>
                <button
                  onClick={() => marcarPostado(c.id)}
                  disabled={concluindo === c.id}
                  className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg font-bold disabled:opacity-50 shrink-0 transition-all"
                  style={{ background: "#c8d92a", color: "#0d2b1e" }}
                >
                  <CheckCircle2 size={11} />
                  {concluindo === c.id ? "…" : "Postado!"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3">
          <button onClick={() => setAberto(false)} className="w-full text-xs transition-colors" style={{ color: "#4a7055" }}>
            Ver depois (aparece na próxima vez)
          </button>
        </div>
      </div>
    </div>
  );
}
