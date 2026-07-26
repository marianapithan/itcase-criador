"use client";
import { useEffect, useState } from "react";
import { Plus, Sparkles, ChevronRight, CheckCircle, Circle, ArrowRight } from "lucide-react";

type Microtema = { id: string; titulo: string; descricao?: string; status: string };
type Tema = { id: string; titulo: string; descricao?: string; status: string; microtemas: Microtema[]; criadoEm: string };

const STATUS_TEMA = [
  { value: "IDEIA", label: "Ideia", cor: "bg-gray-100 text-gray-600" },
  { value: "EM_ANALISE", label: "Em análise", cor: "bg-yellow-100 text-yellow-700" },
  { value: "APROVADO", label: "Aprovado", cor: "bg-green-100 text-green-700" },
  { value: "ARQUIVADO", label: "Arquivado", cor: "bg-gray-100 text-gray-400" },
];

function Badge({ status }: { status: string }) {
  const s = STATUS_TEMA.find((x) => x.value === status);
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s?.cor ?? "bg-gray-100 text-gray-600"}`}>{s?.label ?? status}</span>;
}

export default function TemasPage() {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [aberto, setAberto] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [novoMicro, setNovoMicro] = useState<Record<string, string>>({});

  async function carregar() {
    const res = await fetch("/api/temas");
    const data = await res.json();
    setTemas(data);
    setLoading(false);
  }

  useEffect(() => { carregar(); }, []);

  async function gerarTemas() {
    if (!prompt.trim()) return;
    setGerando(true);
    try {
      const res = await fetch("/api/temas/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.erro) { alert(data.erro); return; }
      setPrompt("");
      await carregar();
    } finally {
      setGerando(false);
    }
  }

  async function atualizarStatus(id: string, status: string) {
    await fetch(`/api/temas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await carregar();
  }

  async function gerarMicrotemas(temaId: string) {
    setGerando(true);
    try {
      const res = await fetch(`/api/temas/${temaId}/microtemas/gerar`, { method: "POST" });
      const data = await res.json();
      if (data.erro) { alert(data.erro); return; }
      await carregar();
    } finally {
      setGerando(false);
    }
  }

  async function adicionarMicro(temaId: string) {
    const titulo = novoMicro[temaId]?.trim();
    if (!titulo) return;
    await fetch(`/api/temas/${temaId}/microtemas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo }),
    });
    setNovoMicro((p) => ({ ...p, [temaId]: "" }));
    await carregar();
  }

  async function enviarParaCalendario(tema: Tema) {
    await fetch("/api/conteudos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: tema.titulo,
        descricao: tema.descricao,
        temaId: tema.id,
        status: "AGENDADO",
      }),
    });
    window.location.href = "/calendario";
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Temas & Microtemas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Crie e organize os assuntos do seu conteúdo</p>
        </div>
      </div>

      {/* Gerador */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={15} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-800">Gerar temas com IA</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && gerarTemas()}
            placeholder="Ex: conteúdo para a semana do consumidor, dicas de iPhone..."
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
          />
          <button
            onClick={gerarTemas}
            disabled={gerando || !prompt.trim()}
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {gerando ? "Gerando…" : "Gerar temas"}
          </button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando…</div>
      ) : temas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum tema ainda. Use a IA acima ou adicione manualmente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {temas.map((tema) => (
            <div key={tema.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setAberto(aberto === tema.id ? null : tema.id)}
              >
                <ChevronRight
                  size={16}
                  className={`text-gray-400 transition-transform shrink-0 ${aberto === tema.id ? "rotate-90" : ""}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">{tema.titulo}</div>
                  {tema.descricao && <div className="text-xs text-gray-400 mt-0.5 truncate">{tema.descricao}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-400">{tema.microtemas.length} microtemas</span>
                  <Badge status={tema.status} />
                </div>
              </div>

              {aberto === tema.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  {/* Ações de status */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {STATUS_TEMA.filter((s) => s.value !== tema.status).map((s) => (
                      <button
                        key={s.value}
                        onClick={() => atualizarStatus(tema.id, s.value)}
                        className="text-xs border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                      >
                        Mover para {s.label}
                      </button>
                    ))}
                    {tema.status === "APROVADO" && (
                      <button
                        onClick={() => enviarParaCalendario(tema)}
                        className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                      >
                        <ArrowRight size={12} />
                        Enviar pro calendário
                      </button>
                    )}
                  </div>

                  {/* Microtemas */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Microtemas</span>
                      <button
                        onClick={() => gerarMicrotemas(tema.id)}
                        disabled={gerando}
                        className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40"
                      >
                        {gerando ? "Gerando…" : "+ Gerar com IA"}
                      </button>
                    </div>

                    {tema.microtemas.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {tema.microtemas.map((m) => (
                          <div key={m.id} className="flex items-center gap-2 text-sm py-1">
                            {m.status === "APROVADO" ? (
                              <CheckCircle size={14} className="text-green-500 shrink-0" />
                            ) : (
                              <Circle size={14} className="text-gray-300 shrink-0" />
                            )}
                            <span className="text-gray-700">{m.titulo}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        value={novoMicro[tema.id] ?? ""}
                        onChange={(e) => setNovoMicro((p) => ({ ...p, [tema.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && adicionarMicro(tema.id)}
                        placeholder="Adicionar microtema..."
                        className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400 bg-white"
                      />
                      <button
                        onClick={() => adicionarMicro(tema.id)}
                        className="text-xs border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
