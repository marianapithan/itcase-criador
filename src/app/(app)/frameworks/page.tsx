"use client";
import { useEffect, useState } from "react";
import {
  ChevronRight, CheckCircle2, Zap, BookOpen,
} from "lucide-react";
import { FRAMEWORKS, FRAMEWORK_ORDER, type FrameworkId } from "@/lib/frameworks";

export default function FrameworksPage() {
  const [ativo, setAtivo] = useState<FrameworkId>("AIDA");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<FrameworkId | null>(null);

  useEffect(() => {
    fetch("/api/config/framework")
      .then((r) => r.json())
      .then((d) => setAtivo(d.ativo ?? "AIDA"))
      .finally(() => setCarregando(false));
  }, []);

  async function ativar(id: FrameworkId) {
    if (id === ativo || salvando) return;
    setSalvando(id);
    try {
      const res = await fetch("/api/config/framework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: id }),
      });
      if (res.ok) setAtivo(id);
    } finally {
      setSalvando(null);
    }
  }

  const fw = FRAMEWORKS[ativo];

  return (
    <div className="min-h-full" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">

        {/* Header */}
        <div className="mb-8">
          <p className="section-label mb-1">Configuracoes</p>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>
            Biblioteca de Frameworks
          </h1>
          <p className="text-sm mt-1 max-w-xl" style={{ color: "var(--muted)" }}>
            Selecione o framework de copywriting ativo. Ele sera aplicado em todas as geracoes de conteudo do sistema: roteiros, legendas, anuncios, e-mails, calendarios e qualquer outro modulo que utilize IA.
          </p>
        </div>

        {/* Framework ativo */}
        {!carregando && (
          <div className="mb-8 p-5 rounded-2xl" style={{ background: "rgba(200,217,42,0.08)", border: "1px solid rgba(200,217,42,0.25)" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="section-label mb-1">Framework ativo agora</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${fw.cor}25` }}>
                    <Zap size={14} style={{ color: fw.cor }} />
                  </div>
                  <div>
                    <span className="text-base font-bold" style={{ color: "#c8d92a", fontFamily: "var(--font-syne, inherit)" }}>{fw.nome}</span>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {fw.etapas.map((e, i) => (
                        <span key={e} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(200,217,42,0.15)", color: "#c8d92a" }}>
                          {i + 1}. {e}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-xs max-w-xs" style={{ color: "var(--muted)" }}>
                <strong style={{ color: "var(--foreground)" }}>Quando usar: </strong>{fw.quando}
              </div>
            </div>
          </div>
        )}

        {/* Grid de frameworks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FRAMEWORK_ORDER.map((id) => {
            const f = FRAMEWORKS[id];
            const isAtivo = id === ativo;
            const isSalvando = id === salvando;

            return (
              <button
                key={id}
                onClick={() => ativar(id)}
                disabled={isAtivo || !!salvando}
                className="text-left rounded-2xl p-5 transition-all"
                style={{
                  background: isAtivo ? `${f.cor}12` : "var(--card-bg)",
                  border: isAtivo ? `1.5px solid ${f.cor}60` : "1px solid var(--card-border)",
                  cursor: isAtivo ? "default" : "pointer",
                  opacity: salvando && !isSalvando ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isAtivo && !salvando) {
                    (e.currentTarget as HTMLElement).style.borderColor = `${f.cor}50`;
                    (e.currentTarget as HTMLElement).style.background = `${f.cor}08`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isAtivo) {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--card-border)";
                    (e.currentTarget as HTMLElement).style.background = "var(--card-bg)";
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${f.cor}20` }}>
                      <BookOpen size={15} style={{ color: f.cor }} />
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{f.nome}</div>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {f.etapas.map((e) => (
                          <span key={e} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${f.cor}15`, color: f.cor }}>
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {isAtivo ? (
                    <CheckCircle2 size={18} style={{ color: f.cor }} className="shrink-0 mt-0.5" />
                  ) : isSalvando ? (
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0 mt-0.5" style={{ borderColor: f.cor, borderTopColor: "transparent" }} />
                  ) : (
                    <ChevronRight size={16} className="shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
                  )}
                </div>

                <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--muted)" }}>{f.descricao}</p>

                <div className="text-[10px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Quando usar: </span>
                  {f.quando}
                </div>

                {isAtivo && (
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${f.cor}30` }}>
                    <span className="text-[10px] font-bold" style={{ color: f.cor, fontFamily: "var(--font-syne, inherit)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Framework ativo
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Nota sobre regras globais */}
        <div className="mt-8 p-4 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <p className="section-label mb-3">Regras globais permanentes</p>
          <div className="space-y-2">
            {[
              "O uso de travessao (--) e proibido em todos os textos gerados pelo sistema.",
              "Emojis somente em conteudo para publicacao em redes sociais, com moderacao e alinhamento ao tom de voz.",
              "Nenhum cliche de marketing, frase generica ou dado inventado.",
              "A IA analisa o contexto da empresa e da persona antes de qualquer geracao de conteudo.",
            ].map((r) => (
              <div key={r} className="flex items-start gap-2">
                <CheckCircle2 size={12} className="shrink-0 mt-0.5" style={{ color: "#c8d92a" }} />
                <p className="text-xs" style={{ color: "var(--muted)" }}>{r}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
