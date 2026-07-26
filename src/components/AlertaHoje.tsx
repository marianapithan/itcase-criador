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
    <div className="fixed inset-0 bg-black/50 z-[500] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-5 py-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Bell size={18} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm">
              {pendentes.length === 1 ? "1 conteúdo pra publicar hoje!" : `${pendentes.length} conteúdos pra publicar hoje!`}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Marque como postado para fechar este aviso.</p>
          </div>
          <button onClick={() => setAberto(false)} className="text-gray-400 hover:text-gray-600 shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Lista */}
        <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
          {pendentes.map((c) => {
            const fmt = FORMATOS_CONFIG[c.formato];
            return (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                <CalendarDays size={14} className="text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{c.titulo}</div>
                  {fmt && <div className="text-[11px] text-gray-400">{fmt.label}</div>}
                </div>
                <button
                  onClick={() => marcarPostado(c.id)}
                  disabled={concluindo === c.id}
                  className="flex items-center gap-1 text-[11px] bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shrink-0">
                  <CheckCircle2 size={11} />
                  {concluindo === c.id ? "…" : "Postado!"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button onClick={() => setAberto(false)} className="w-full text-xs text-gray-400 hover:text-gray-600">
            Ver depois (vai aparecer na próxima vez)
          </button>
        </div>
      </div>
    </div>
  );
}
