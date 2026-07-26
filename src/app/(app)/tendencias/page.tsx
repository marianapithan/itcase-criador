"use client";
import { useEffect, useState } from "react";
import {
  Radar, RefreshCw, Bookmark, CalendarPlus, Sparkles, X, TrendingUp,
  Search, Newspaper, Globe, Clock,
  ArrowRight, Trash2, BookOpen, Play, Music2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FORMATOS_CONFIG } from "@/lib/constants";

type Tendencia = {
  id: string; titulo: string; descricao: string; plataforma: string;
  categoria: string; grau: string; motivo?: string; publico?: string;
  potAlcance?: string; potVendas?: string; status: string; formato?: string;
  criadoEm: string;
};

const PLATAFORMAS = [
  { value: "INSTAGRAM",  label: "Instagram",   icon: Music2,    cor: "#E1306C", bg: "#FDF0F5" },
  { value: "TIKTOK",     label: "TikTok",      icon: Play,      cor: "#000000", bg: "#F3F4F6" },
  { value: "GOOGLE",     label: "Google",      icon: Search,    cor: "#4285F4", bg: "#EFF6FF" },
  { value: "YOUTUBE",    label: "YouTube",     icon: Play,      cor: "#FF0000", bg: "#FFF1F1" },
  { value: "NOTICIAS",   label: "Notícias",    icon: Newspaper, cor: "#6B7280", bg: "#F9FAFB" },
  { value: "GERAL",      label: "Geral",       icon: Globe,     cor: "#8B5CF6", bg: "#F5F3FF" },
];

const CATEGORIAS = [
  { value: "EDUCATIVO",      label: "Educativo",       cor: "#3B82F6", bg: "#EFF6FF" },
  { value: "COMERCIAL",      label: "Comercial",       cor: "#10B981", bg: "#ECFDF5" },
  { value: "INSTITUCIONAL",  label: "Institucional",   cor: "#6B7280", bg: "#F9FAFB" },
  { value: "TRAFEGO_PAGO",   label: "Tráfego Pago",    cor: "#EA580C", bg: "#FFF7ED" },
  { value: "PRODUTO",        label: "Produto",         cor: "#7C3AED", bg: "#F5F3FF" },
  { value: "DICA",           label: "Dica",            cor: "#0891B2", bg: "#ECFEFF" },
  { value: "NOVIDADE",       label: "Novidade",        cor: "#D97706", bg: "#FFFBEB" },
];

const GRAU_CONFIG = {
  ALTA:  { label: "Alta",  cor: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" },
  MEDIA: { label: "Média", cor: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  BAIXA: { label: "Baixa", cor: "#059669", bg: "#ECFDF5", dot: "#10B981" },
};

const POT_CONFIG = {
  ALTO:  { label: "Alto",  cor: "#059669" },
  MEDIO: { label: "Médio", cor: "#D97706" },
  BAIXO: { label: "Baixo", cor: "#6B7280" },
};

function getPlatCfg(v: string) { return PLATAFORMAS.find((p) => p.value === v) ?? PLATAFORMAS[5]; }
function getCatCfg(v: string) { return CATEGORIAS.find((c) => c.value === v) ?? CATEGORIAS[0]; }
function getGrauCfg(v: string) { return GRAU_CONFIG[v as keyof typeof GRAU_CONFIG] ?? GRAU_CONFIG.MEDIA; }

export default function TendenciasPage() {
  const [tendencias, setTendencias] = useState<Tendencia[]>([]);
  const [pesquisando, setPesquisando] = useState(false);
  const [convertendo, setConvertendo] = useState<string | null>(null);
  const [filtroPlat, setFiltroPlat] = useState("");
  const [filtroCat, setFiltroCat] = useState("");
  const [filtroGrau, setFiltroGrau] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("NOVA");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [selecionada, setSelecionada] = useState<Tendencia | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function carregar() {
    try {
      const params = new URLSearchParams();
      if (filtroPlat) params.set("plataforma", filtroPlat);
      if (filtroCat) params.set("categoria", filtroCat);
      if (filtroStatus) params.set("status", filtroStatus);
      const res = await fetch(`/api/tendencias?${params}`);
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      if (Array.isArray(data)) setTendencias(data);
    } catch {
      // silently ignore — table is empty or server restarting
    }
  }

  useEffect(() => { carregar(); }, [filtroPlat, filtroCat, filtroStatus]);

  async function pesquisar() {
    setPesquisando(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/tendencias/pesquisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.erro) { setFeedback(`Erro: ${data.erro}`); return; }
      setFeedback(`${data.criadas} novas tendências identificadas!`);
      setUltimaAtualizacao(new Date());
      setFiltroStatus("NOVA");
      await carregar();
    } finally {
      setPesquisando(false);
    }
  }

  async function atualizarStatus(id: string, status: string) {
    await fetch(`/api/tendencias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setTendencias((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    if (selecionada?.id === id) setSelecionada((p) => p ? { ...p, status } : p);
  }

  async function excluir(id: string) {
    await fetch(`/api/tendencias/${id}`, { method: "DELETE" });
    setTendencias((prev) => prev.filter((t) => t.id !== id));
    if (selecionada?.id === id) setSelecionada(null);
  }

  async function converterParaBancoIdeias(t: Tendencia) {
    setConvertendo(t.id);
    try {
      await fetch(`/api/tendencias/${t.id}/converter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IDEIA" }),
      });
      setFeedback(`"${t.titulo}" adicionado ao banco de ideias!`);
      setTendencias((prev) => prev.map((x) => x.id === t.id ? { ...x, status: "CONVERTIDA" } : x));
      if (selecionada?.id === t.id) setSelecionada((p) => p ? { ...p, status: "CONVERTIDA" } : p);
    } finally {
      setConvertendo(null);
    }
  }

  async function enviarParaCalendario(t: Tendencia) {
    setConvertendo(t.id);
    try {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      amanha.setHours(12, 0, 0, 0);
      await fetch(`/api/tendencias/${t.id}/converter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "AGENDADO", dataplanejada: amanha.toISOString() }),
      });
      setFeedback(`"${t.titulo}" enviado ao Calendário Editorial!`);
      setTendencias((prev) => prev.map((x) => x.id === t.id ? { ...x, status: "CONVERTIDA" } : x));
      if (selecionada?.id === t.id) setSelecionada((p) => p ? { ...p, status: "CONVERTIDA" } : p);
    } finally {
      setConvertendo(null);
    }
  }

  async function gerarRoteiro(t: Tendencia) {
    setConvertendo(t.id);
    try {
      const res = await fetch(`/api/tendencias/${t.id}/converter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IDEIA" }),
      });
      const data = await res.json();
      if (data.conteudo) {
        setFeedback(`Conteúdo criado! Indo para Roteiros...`);
        setTendencias((prev) => prev.map((x) => x.id === t.id ? { ...x, status: "CONVERTIDA" } : x));
        setTimeout(() => { window.location.href = "/roteiros"; }, 1500);
      }
    } finally {
      setConvertendo(null);
    }
  }

  const filtradas = tendencias.filter((t) => {
    if (filtroGrau && t.grau !== filtroGrau) return false;
    return true;
  });

  const contagem = {
    novas: tendencias.filter((t) => t.status === "NOVA").length,
    salvas: tendencias.filter((t) => t.status === "SALVA").length,
    total: tendencias.length,
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Radar size={16} className="text-purple-600" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-sm">Radar de Tendências</h1>
              <p className="text-[11px] text-gray-400">
                {ultimaAtualizacao
                  ? `Atualizado ${format(ultimaAtualizacao, "HH:mm 'de' dd/MM", { locale: ptBR })}`
                  : "IA pesquisa oportunidades de conteúdo para o seu nicho"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {feedback && (
              <div className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <TrendingUp size={12} /> {feedback}
              </div>
            )}
            <button onClick={pesquisar} disabled={pesquisando}
              className="flex items-center gap-2 text-xs bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors font-medium">
              <RefreshCw size={13} className={pesquisando ? "animate-spin" : ""} />
              {pesquisando ? "Pesquisando…" : "Pesquisar agora"}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-b border-gray-100 bg-gray-50 shrink-0 text-xs">
          <button onClick={() => setFiltroStatus("NOVA")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${filtroStatus === "NOVA" ? "bg-purple-600 text-white" : "text-gray-500 hover:bg-gray-200"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />Novas
            <span className={`font-bold ${filtroStatus === "NOVA" ? "text-purple-200" : "text-gray-400"}`}>{contagem.novas}</span>
          </button>
          <button onClick={() => setFiltroStatus("SALVA")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${filtroStatus === "SALVA" ? "bg-amber-500 text-white" : "text-gray-500 hover:bg-gray-200"}`}>
            <Bookmark size={11} /> Salvas
            <span className={`font-bold ${filtroStatus === "SALVA" ? "text-amber-200" : "text-gray-400"}`}>{contagem.salvas}</span>
          </button>
          <button onClick={() => setFiltroStatus("")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${filtroStatus === "" ? "bg-gray-700 text-white" : "text-gray-500 hover:bg-gray-200"}`}>
            Todas
            <span className={`font-bold ${filtroStatus === "" ? "text-gray-300" : "text-gray-400"}`}>{contagem.total}</span>
          </button>

          <div className="w-px h-4 bg-gray-200" />

          {/* Filtros plataforma */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {PLATAFORMAS.map((p) => {
              const Icon = p.icon;
              const ativo = filtroPlat === p.value;
              return (
                <button key={p.value} onClick={() => setFiltroPlat(ativo ? "" : p.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-all text-[11px] ${ativo ? "text-white" : "text-gray-500 hover:bg-gray-200"}`}
                  style={ativo ? { backgroundColor: p.cor } : {}}>
                  <Icon size={10} /> {p.label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 bg-gray-200" />

          {/* Filtros categoria */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIAS.map((c) => {
              const ativo = filtroCat === c.value;
              return (
                <button key={c.value} onClick={() => setFiltroCat(ativo ? "" : c.value)}
                  className={`px-2.5 py-1 rounded-full transition-all text-[11px] font-medium ${ativo ? "text-white" : "text-gray-500 hover:bg-gray-200"}`}
                  style={ativo ? { backgroundColor: c.cor } : {}}>
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="w-px h-4 bg-gray-200" />

          {/* Filtro grau */}
          {(["", "ALTA", "MEDIA", "BAIXA"] as const).map((g) => {
            const cfg = g ? getGrauCfg(g) : null;
            return (
              <button key={g} onClick={() => setFiltroGrau(g === filtroGrau ? "" : g)}
                className={`px-2.5 py-1 rounded-full transition-all text-[11px] ${filtroGrau === g && g ? "text-white font-medium" : "text-gray-500 hover:bg-gray-200"}`}
                style={filtroGrau === g && g && cfg ? { backgroundColor: cfg.cor } : {}}>
                {g ? `🔥 ${cfg!.label}` : "Todos graus"}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {pesquisando && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
              <p className="text-sm text-gray-500">IA analisando tendências do seu nicho…</p>
              <p className="text-xs text-gray-400">Instagram · TikTok · Google · YouTube · Notícias</p>
            </div>
          )}

          {!pesquisando && filtradas.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center">
                <Radar size={28} className="text-purple-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Nenhuma tendência ainda</p>
                <p className="text-xs text-gray-400 mt-1">Clique em "Pesquisar agora" para a IA analisar oportunidades para o seu negócio</p>
              </div>
              <button onClick={pesquisar}
                className="flex items-center gap-2 text-sm bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 font-medium">
                <Radar size={14} /> Iniciar análise
              </button>
            </div>
          )}

          {!pesquisando && filtradas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtradas.map((t) => {
                const platCfg = getPlatCfg(t.plataforma);
                const catCfg = getCatCfg(t.categoria);
                const grauCfg = getGrauCfg(t.grau);
                const fmtCfg = t.formato ? FORMATOS_CONFIG[t.formato] : null;
                const Icon = platCfg.icon;
                const isConvertida = t.status === "CONVERTIDA";

                return (
                  <div key={t.id}
                    className={`bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md cursor-pointer ${selecionada?.id === t.id ? "border-purple-300 ring-2 ring-purple-100" : "border-gray-100"} ${isConvertida ? "opacity-50" : ""}`}
                    onClick={() => setSelecionada(selecionada?.id === t.id ? null : t)}>

                    {/* Top bar */}
                    <div className="h-1" style={{ backgroundColor: grauCfg.dot }} />

                    <div className="p-4">
                      {/* Meta row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: platCfg.bg }}>
                            <Icon size={12} style={{ color: platCfg.cor }} />
                          </div>
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{platCfg.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: grauCfg.bg, color: grauCfg.cor }}>
                            {grauCfg.label}
                          </span>
                          {t.status === "SALVA" && <Bookmark size={11} className="text-amber-500 fill-amber-500" />}
                          {isConvertida && <span className="text-[10px] text-gray-400">Convertida</span>}
                        </div>
                      </div>

                      {/* Título */}
                      <h3 className="text-sm font-semibold text-gray-900 mb-1.5 leading-snug">{t.titulo}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{t.descricao}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: catCfg.bg, color: catCfg.cor }}>
                          {catCfg.label}
                        </span>
                        {fmtCfg && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: fmtCfg.bg, color: fmtCfg.text }}>
                            {fmtCfg.label}
                          </span>
                        )}
                        {t.potAlcance && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                            Alcance: <span style={{ color: POT_CONFIG[t.potAlcance as keyof typeof POT_CONFIG]?.cor }}>{POT_CONFIG[t.potAlcance as keyof typeof POT_CONFIG]?.label}</span>
                          </span>
                        )}
                        {t.potVendas && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                            Vendas: <span style={{ color: POT_CONFIG[t.potVendas as keyof typeof POT_CONFIG]?.cor }}>{POT_CONFIG[t.potVendas as keyof typeof POT_CONFIG]?.label}</span>
                          </span>
                        )}
                      </div>

                      {/* Ações rápidas */}
                      {!isConvertida && (
                        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => gerarRoteiro(t)} disabled={!!convertendo}
                            className="flex items-center gap-1 text-[11px] bg-gray-900 text-white px-2.5 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 font-medium">
                            <Sparkles size={10} /> Roteiro
                          </button>
                          <button onClick={() => converterParaBancoIdeias(t)} disabled={!!convertendo}
                            className="flex items-center gap-1 text-[11px] bg-white border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                            <BookOpen size={10} /> Banco de Ideias
                          </button>
                          <button onClick={() => enviarParaCalendario(t)} disabled={!!convertendo}
                            className="flex items-center gap-1 text-[11px] bg-white border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                            <CalendarPlus size={10} /> Calendário
                          </button>
                          <button onClick={() => atualizarStatus(t.id, t.status === "SALVA" ? "NOVA" : "SALVA")}
                            className={`ml-auto p-1.5 rounded-lg border transition-all ${t.status === "SALVA" ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"}`}>
                            <Bookmark size={11} className={t.status === "SALVA" ? "fill-amber-500" : ""} />
                          </button>
                          <button onClick={() => excluir(t.id)} className="p-1.5 rounded-lg border border-gray-200 text-gray-300 hover:border-red-200 hover:text-red-400 transition-all">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-300">
                        <Clock size={9} />
                        {format(parseISO(t.criadoEm), "dd/MM · HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Painel lateral de detalhe */}
      {selecionada && (
        <div className="w-80 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                {(() => {
                  const platCfg = getPlatCfg(selecionada.plataforma);
                  const Icon = platCfg.icon;
                  return (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: platCfg.bg }}>
                      <Icon size={15} style={{ color: platCfg.cor }} />
                    </div>
                  );
                })()}
                <div>
                  <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                    {getPlatCfg(selecionada.plataforma).label}
                  </div>
                  <div className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5"
                    style={{ backgroundColor: getGrauCfg(selecionada.grau).bg, color: getGrauCfg(selecionada.grau).cor }}>
                    Tendência {getGrauCfg(selecionada.grau).label}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelecionada(null)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
            </div>

            <h2 className="text-base font-semibold text-gray-900 mb-2 leading-snug">{selecionada.titulo}</h2>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">{selecionada.descricao}</p>

            {selecionada.motivo && (
              <div className="mb-3">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Por que está em alta</div>
                <p className="text-xs text-gray-600">{selecionada.motivo}</p>
              </div>
            )}

            {selecionada.publico && (
              <div className="mb-3">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Público interessado</div>
                <p className="text-xs text-gray-600">{selecionada.publico}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-[10px] text-gray-400 mb-0.5">Potencial de Alcance</div>
                <div className="text-xs font-semibold" style={{ color: selecionada.potAlcance ? POT_CONFIG[selecionada.potAlcance as keyof typeof POT_CONFIG]?.cor : "#9CA3AF" }}>
                  {selecionada.potAlcance ? POT_CONFIG[selecionada.potAlcance as keyof typeof POT_CONFIG]?.label : "—"}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-[10px] text-gray-400 mb-0.5">Potencial de Vendas</div>
                <div className="text-xs font-semibold" style={{ color: selecionada.potVendas ? POT_CONFIG[selecionada.potVendas as keyof typeof POT_CONFIG]?.cor : "#9CA3AF" }}>
                  {selecionada.potVendas ? POT_CONFIG[selecionada.potVendas as keyof typeof POT_CONFIG]?.label : "—"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-5">
              <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: getCatCfg(selecionada.categoria).bg, color: getCatCfg(selecionada.categoria).cor }}>
                {getCatCfg(selecionada.categoria).label}
              </span>
              {selecionada.formato && FORMATOS_CONFIG[selecionada.formato] && (
                <span className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: FORMATOS_CONFIG[selecionada.formato].bg, color: FORMATOS_CONFIG[selecionada.formato].text }}>
                  {FORMATOS_CONFIG[selecionada.formato].label}
                </span>
              )}
            </div>

            {selecionada.status !== "CONVERTIDA" && (
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Ações</div>
                <button onClick={() => gerarRoteiro(selecionada)} disabled={!!convertendo}
                  className="w-full flex items-center gap-2.5 text-xs bg-gray-900 text-white px-3 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 font-medium">
                  <Sparkles size={13} /> Gerar Roteiro com IA
                  <ArrowRight size={12} className="ml-auto" />
                </button>
                <button onClick={() => converterParaBancoIdeias(selecionada)} disabled={!!convertendo}
                  className="w-full flex items-center gap-2.5 text-xs border border-gray-200 text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                  <BookOpen size={13} /> Adicionar ao Banco de Ideias
                </button>
                <button onClick={() => enviarParaCalendario(selecionada)} disabled={!!convertendo}
                  className="w-full flex items-center gap-2.5 text-xs border border-gray-200 text-gray-700 px-3 py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                  <CalendarPlus size={13} /> Enviar ao Calendário
                </button>
                <button onClick={() => atualizarStatus(selecionada.id, selecionada.status === "SALVA" ? "NOVA" : "SALVA")}
                  className={`w-full flex items-center gap-2.5 text-xs px-3 py-2.5 rounded-lg ${selecionada.status === "SALVA" ? "bg-amber-50 border border-amber-200 text-amber-700" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <Bookmark size={13} className={selecionada.status === "SALVA" ? "fill-amber-500 text-amber-500" : ""} />
                  {selecionada.status === "SALVA" ? "Remover dos salvos" : "Salvar para depois"}
                </button>
              </div>
            )}

            {selecionada.status === "CONVERTIDA" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                Esta tendência já foi convertida em conteúdo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
