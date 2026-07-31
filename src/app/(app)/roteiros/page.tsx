"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, FileText, Plus, ChevronRight, X, Check, Clock, Trash2, CalendarPlus, ChevronDown, ChevronUp, Pencil, Copy, Hash, Eye, EyeOff, Copy as CopyIcon, Calendar, CalendarX } from "lucide-react";
import { STATUS_CONFIG, STATUS_LIST_EDITORIAL, FORMATOS_CONFIG, MembroEquipe, getMembroConfig } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { CONFIG } from "@/lib/config";
import { FRAMEWORKS as LIB_FRAMEWORKS, FRAMEWORK_ORDER } from "@/lib/frameworks";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Conteudo = {
  id: string;
  titulo: string;
  formato: string;
  status: string;
  roteiro?: string;
  legenda?: string;
  roteiroAnterior?: string;
  legendaAnterior?: string;
  objetivo?: string;
  etapaFunil?: string;
  responsavel?: string;
  dataplanejada?: string;
  hashtags?: string;
  sugestoesProducao?: string;
  criadoEm: string;
};
type Tema = { id: string; titulo: string };

const FORMATOS = Object.entries(FORMATOS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

const STATUS_LIST = [...STATUS_LIST_EDITORIAL, "GERADO_IA", "REVISAR_MAIS_TARDE", "DESCARTADO"] as string[];

const ETAPAS = [
  { value: "TOPO",  label: "Topo",  desc: "Alcance" },
  { value: "MEIO",  label: "Meio",  desc: "Engajamento" },
  { value: "FUNDO", label: "Fundo", desc: "Conversão" },
];

const FRAMEWORK_DISPLAY: Record<string, { emoji: string; categoria: string }> = {
  AIDA:          { emoji: "🎯", categoria: "Frameworks" },
  PAS:           { emoji: "⚡", categoria: "Frameworks" },
  BAB:           { emoji: "🔄", categoria: "Frameworks" },
  PASTOR:        { emoji: "🌿", categoria: "Frameworks" },
  QUEST:         { emoji: "🔑", categoria: "Frameworks" },
  "4PS":         { emoji: "🧩", categoria: "Frameworks" },
  SLAP:          { emoji: "👋", categoria: "Frameworks" },
  PARABOLA:      { emoji: "📖", categoria: "Narrativos" },
  "18GANCHOS":   { emoji: "🪝", categoria: "Ganchos" },
  GANCHOS_VIDEO: { emoji: "🎬", categoria: "Ganchos" },
};

const FRAMEWORKS = FRAMEWORK_ORDER.map((id) => ({
  ...LIB_FRAMEWORKS[id],
  ...FRAMEWORK_DISPLAY[id],
}));

const CATEGORIA_COR: Record<string, string> = {
  "Frameworks": "text-blue-600",
  "Ganchos": "text-orange-500",
  "Narrativos": "text-purple-600",
};

type Filtro = "todos" | "banco" | "revisar" | "aprovados" | "descartados";
type TelaAcao = null | "aprovar" | "descartar";

function RoteiroMD({ texto }: { texto: string }) {
  function inline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
    let last = 0, ki = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      if (m[1] !== undefined) parts.push(<strong key={ki++}>{m[1]}</strong>);
      else parts.push(<em key={ki++}>{m[2]}</em>);
      last = re.lastIndex;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : <>{parts}</>;
  }

  return (
    <div className="space-y-1">
      {texto.split("\n").map((line, i) => {
        if (/^-{3,}$/.test(line.trim()))
          return <hr key={i} className="my-3 border-gray-200" />;
        if (line.startsWith("### "))
          return <p key={i} className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-4 mb-0.5">{inline(line.slice(4))}</p>;
        if (line.startsWith("## "))
          return <p key={i} className="text-sm font-bold uppercase tracking-wide text-gray-600 mt-4 mb-0.5">{inline(line.slice(3))}</p>;
        if (line.startsWith("# "))
          return <p key={i} className="text-base font-bold text-gray-800 mt-4 mb-1">{inline(line.slice(2))}</p>;
        if (line.startsWith("> "))
          return <div key={i} className="border-l-2 border-gray-300 pl-3 my-1.5 italic text-gray-500 text-sm">{inline(line.slice(2))}</div>;
        if (/^[-*] /.test(line))
          return <div key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed"><span className="text-gray-400 shrink-0 mt-px">•</span><span>{inline(line.slice(2))}</span></div>;
        if (line.trim() === "")
          return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm text-gray-700 leading-relaxed">{inline(line)}</p>;
      })}
    </div>
  );
}

function RoteirosPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [selecionado, setSelecionado] = useState<Conteudo | null>(null);
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [criandoNovo, setCriandoNovo] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [telaAcao, setTelaAcao] = useState<TelaAcao>(null);
  const [mostrarRoteiro, setMostrarRoteiro] = useState(true);
  const [mostrarLegenda, setMostrarLegenda] = useState(false);
  const [editandoRoteiro, setEditandoRoteiro] = useState(false);
  const [editandoLegenda, setEditandoLegenda] = useState(false);
  const [roteiroTemp, setRoteiroTemp] = useState("");
  const [legendaTemp, setLegendaTemp] = useState("");
  const [instrucaoMelhoria, setInstrucaoMelhoria] = useState("");
  const [mostrarVersaoAnterior, setMostrarVersaoAnterior] = useState(false);
  const [form, setForm] = useState({ titulo: "", formato: "REELS", temaId: "", instrucao: "", framework: "", microtemaId: "" });
  const [modoNovo, setModoNovo] = useState<"unico" | "lote">("unico");
  const [loteForm, setLoteForm] = useState({ prompt: "", quantidade: 7, temaId: "" });
  const [gerandoLote, setGerandoLote] = useState(false);
  const [frameworkIdeia, setFrameworkIdeia] = useState("");
  const [gerandoRoteiroIdeia, setGerandoRoteiroIdeia] = useState(false);
  const [copiadoRoteiro, setCopiadoRoteiro] = useState(false);
  const [copiadoLegenda, setCopiadoLegenda] = useState(false);
  const [hashtags, setHashtags] = useState("");
  const [gerandoHashtags, setGerandoHashtags] = useState(false);
  const [copiadoHashtags, setCopiadoHashtags] = useState(false);
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [duplicando, setDuplicando] = useState(false);
  const [erroLote, setErroLote] = useState("");
  const [sucessoLote, setSucessoLote] = useState(0);
  const [agendandoData, setAgendandoData] = useState("");
  const [agendandoHora, setAgendandoHora] = useState(12);
  const [agendandoMinuto, setAgendandoMinuto] = useState(0);
  const [salvandoData, setSalvandoData] = useState(false);
  const [membrosEquipe, setMembrosEquipe] = useState<MembroEquipe[]>([]);
  const [addingMembro, setAddingMembro] = useState(false);
  const [novoMembroNome, setNovoMembroNome] = useState("");

  const frameworkSelecionado = FRAMEWORKS.find((f) => f.id === form.framework);
  const podeGerar = form.titulo.trim() && form.framework;

  const carregar = useCallback(async () => {
    const [c, t, eq] = await Promise.all([
      fetch("/api/conteudos").then((r) => r.json()),
      fetch("/api/temas").then((r) => r.json()),
      fetch("/api/equipe").then((r) => r.json()),
    ]);
    setConteudos(c);
    setTemas(t);
    setMembrosEquipe(Array.isArray(eq) ? eq : []);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function adicionarMembro() {
    const nome = novoMembroNome.trim();
    if (!nome) return;
    const res = await fetch("/api/equipe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nome }) });
    if (res.ok) {
      const novo = await res.json();
      setMembrosEquipe((prev) => [...prev, novo]);
    }
    setNovoMembroNome("");
    setAddingMembro(false);
  }

  // Abrir formulário novo via ?novo=1 (ex: FAB ou microtema)
  useEffect(() => {
    if (searchParams.get("novo") === "1") {
      const titulo = searchParams.get("titulo") ?? "";
      const microtemaId = searchParams.get("microtemaId") ?? "";
      const temaId = searchParams.get("temaId") ?? "";
      setForm((f) => ({ ...f, titulo, microtemaId, temaId: temaId || f.temaId }));
      setCriandoNovo(true);
      setSelecionado(null);
      router.replace("/roteiros");
    }
  }, [searchParams, router]);

  const conteudosFiltrados = conteudos.filter((c) => {
    if (filtro === "banco") return c.status === "IDEIA";
    if (filtro === "revisar") return c.status === "REVISAR_MAIS_TARDE";
    if (filtro === "aprovados") return ["APROVADO", "AGENDADO", "EM_PRODUCAO", "PRONTO_PUBLICAR", "PUBLICADO"].includes(c.status);
    if (filtro === "descartados") return c.status === "DESCARTADO";
    return true;
  });

  async function criarRoteiro() {
    if (!form.titulo.trim() || !form.framework) return;
    setGerando(true);
    try {
      const res = await fetch("/api/roteiros/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, frameworkNome: frameworkSelecionado?.nome }),
      });
      const data = await res.json();
      if (data.erro) { setErroLote(data.erro); return; }
      await carregar();
      setSelecionado(data);
      setCriandoNovo(false);
      setTelaAcao(null);
      setForm({ titulo: "", formato: "REELS", temaId: "", instrucao: "", framework: "", microtemaId: "" });
    } catch {
      setErroLote("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setGerando(false);
    }
  }

  async function criarLote() {
    if (!loteForm.prompt.trim()) return;
    setErroLote("");
    setSucessoLote(0);
    setGerandoLote(true);
    try {
      const res = await fetch("/api/roteiros/gerar-lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loteForm),
      });
      const data = await res.json();
      if (data.erro) { setErroLote(data.erro); return; }
      await carregar();
      setSucessoLote(data.criados ?? 0);
      setLoteForm({ prompt: "", quantidade: 7, temaId: "" });
      // Deixa a mensagem de sucesso visível por 3s antes de fechar
      setTimeout(() => { setCriandoNovo(false); setSucessoLote(0); setModoNovo("unico"); }, 3000);
    } catch {
      setErroLote("Erro de conexão ou timeout. A IA pode demorar mais no celular. Tente novamente.");
    } finally {
      setGerandoLote(false);
    }
  }

  async function gerarRoteiroParaIdeia() {
    if (!selecionado || !frameworkIdeia) return;
    const fw = FRAMEWORKS.find((f) => f.id === frameworkIdeia);
    if (!fw) return;
    setGerandoRoteiroIdeia(true);
    try {
      const res = await fetch("/api/roteiros/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conteudoId: selecionado.id,
          titulo: selecionado.titulo,
          formato: selecionado.formato,
          frameworkNome: fw.nome,
        }),
      });
      const data = await res.json();
      if (data.erro) { alert(data.erro); return; }
      setSelecionado(data);
      setFrameworkIdeia("");
      await carregar();
    } finally {
      setGerandoRoteiroIdeia(false);
    }
  }

  async function melhorarRoteiro() {
    if (!selecionado || !instrucaoMelhoria.trim()) return;
    setGerando(true);
    try {
      const res = await fetch(`/api/roteiros/${selecionado.id}/melhorar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrucao: instrucaoMelhoria }),
      });
      const data = await res.json();
      if (data.erro) { alert(data.erro); return; }
      setSelecionado(data);
      setInstrucaoMelhoria("");
      await carregar();
    } finally {
      setGerando(false);
    }
  }

  async function aprovar(adicionarCalendario: boolean) {
    if (!selecionado) return;
    setSalvando(true);
    try {
      const res = await fetch(`/api/conteudos/${selecionado.id}/aprovar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adicionarCalendario }),
      });
      const data = await res.json();
      setSelecionado(data);
      setTelaAcao(null);
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function marcarRevisar() {
    if (!selecionado) return;
    setSalvando(true);
    try {
      await fetch(`/api/conteudos/${selecionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVISAR_MAIS_TARDE" }),
      });
      setSelecionado((p) => p ? { ...p, status: "REVISAR_MAIS_TARDE" } : p);
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function descartar() {
    if (!selecionado) return;
    setSalvando(true);
    try {
      await fetch(`/api/conteudos/${selecionado.id}`, { method: "DELETE" });
      setSelecionado(null);
      setTelaAcao(null);
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function salvarCampo(campo: string, valor: string) {
    if (!selecionado) return;
    await fetch(`/api/conteudos/${selecionado.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: valor }),
    });
    setSelecionado((p) => p ? { ...p, [campo]: valor } : p);
    setConteudos((prev) => prev.map((c) => c.id === selecionado.id ? { ...c, [campo]: valor } : c));
  }

  async function salvarStatus(status: string) {
    if (!selecionado) return;
    await fetch(`/api/conteudos/${selecionado.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSelecionado((p) => p ? { ...p, status } : p);
    setConteudos((prev) => prev.map((c) => c.id === selecionado.id ? { ...c, status } : c));
  }

  function copiar(texto: string, tipo: "roteiro" | "legenda" | "hashtags") {
    navigator.clipboard.writeText(texto);
    if (tipo === "roteiro") { setCopiadoRoteiro(true); setTimeout(() => setCopiadoRoteiro(false), 2000); }
    if (tipo === "legenda") { setCopiadoLegenda(true); setTimeout(() => setCopiadoLegenda(false), 2000); }
    if (tipo === "hashtags") { setCopiadoHashtags(true); setTimeout(() => setCopiadoHashtags(false), 2000); }
  }

  async function gerarHashtags() {
    if (!selecionado) return;
    setGerandoHashtags(true);
    try {
      const res = await fetch(`/api/roteiros/${selecionado.id}/hashtags`, { method: "POST" });
      const data = await res.json();
      if (data.erro) { alert(data.erro); return; }
      setHashtags(data.hashtags);
    } finally {
      setGerandoHashtags(false);
    }
  }

  async function duplicar() {
    if (!selecionado) return;
    setDuplicando(true);
    try {
      const res = await fetch(`/api/conteudos/${selecionado.id}/duplicar`, { method: "POST" });
      const data = await res.json();
      await carregar();
      setSelecionado(data);
      setCriandoNovo(false);
    } finally {
      setDuplicando(false);
    }
  }

  async function agendarNoCalendario() {
    if (!selecionado || !agendandoData) return;
    setSalvandoData(true);
    try {
      const [ano, mes, dia] = agendandoData.split("-").map(Number);
      const novaData = new Date(ano, mes - 1, dia, agendandoHora, agendandoMinuto, 0, 0);
      const iso = novaData.toISOString();
      await fetch(`/api/conteudos/${selecionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataplanejada: iso }),
      });
      setSelecionado((p) => p ? { ...p, dataplanejada: iso } : p);
      setConteudos((prev) => prev.map((c) => c.id === selecionado.id ? { ...c, dataplanejada: iso } : c));
      setAgendandoData("");
    } finally {
      setSalvandoData(false);
    }
  }

  async function removerDoCalendario() {
    if (!selecionado) return;
    await fetch(`/api/conteudos/${selecionado.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataplanejada: null }),
    });
    setSelecionado((p) => p ? { ...p, dataplanejada: undefined } : p);
    setConteudos((prev) => prev.map((c) => c.id === selecionado.id ? { ...c, dataplanejada: undefined } : c));
  }

  function badgeStatus(status: string) {
    const cfg = STATUS_CONFIG[status];
    const label = cfg?.label ?? status;
    const cor = cfg?.cor ?? "bg-gray-100 text-gray-600";
    const dot = cfg?.dot ?? "#9CA3AF";
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cor}`}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
        {label}
      </span>
    );
  }

  const isGeradoIA = selecionado?.status === "GERADO_IA" || selecionado?.status === "ROTEIRO_PRONTO";

  const painelDetalhe = selecionado !== null || criandoNovo;

  return (
    <div className="flex h-full">
      {/* Sidebar — visível no mobile só quando nenhum item selecionado */}
      <div className={`${painelDetalhe ? "hidden md:flex" : "flex"} w-full md:w-60 shrink-0 border-r border-gray-100 flex-col`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Roteiros</h2>
            <button
              onClick={() => { setCriandoNovo(true); setSelecionado(null); setTelaAcao(null); }}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-col gap-0.5">
            {([
              ["todos", "Todos"],
              ["banco", "Banco de Ideias"],
              ["revisar", "Revisar depois"],
              ["aprovados", "Aprovados"],
              ["descartados", "Descartados"],
            ] as [Filtro, string][]).map(([f, label]) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${filtro === f ? "bg-gray-900 text-white font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {label}
                <span className="ml-1 opacity-60 text-[10px]">
                  {f === "todos" ? conteudos.length :
                   f === "banco" ? conteudos.filter((c) => c.status === "IDEIA").length :
                   f === "revisar" ? conteudos.filter((c) => c.status === "REVISAR_MAIS_TARDE").length :
                   f === "aprovados" ? conteudos.filter((c) => ["APROVADO","AGENDADO","EM_PRODUCAO","PRONTO_PUBLICAR","PUBLICADO"].includes(c.status)).length :
                   conteudos.filter((c) => c.status === "DESCARTADO").length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {criandoNovo && (
            <button className="w-full text-left p-3 rounded-lg text-xs bg-gray-900 text-white">
              <div className="font-medium">Novo roteiro</div>
              <div className="text-gray-400 mt-0.5">{frameworkSelecionado?.nome ?? "Escolha um modelo"}</div>
            </button>
          )}
          {conteudosFiltrados.map((c) => {
            const dot = STATUS_CONFIG[c.status]?.dot ?? "#9CA3AF";
            const fmt = FORMATOS_CONFIG[c.formato]?.label ?? c.formato;
            return (
              <button
                key={c.id}
                onClick={() => { setSelecionado(c); setCriandoNovo(false); setTelaAcao(null); setEditandoRoteiro(false); setEditandoLegenda(false); setHashtags(c.hashtags ?? ""); setMostrarPreview(false); }}
                className={`w-full text-left p-3 rounded-lg text-xs transition-colors ${selecionado?.id === c.id && !criandoNovo ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-gray-700"}`}
              >
                <div className="font-medium line-clamp-2">{c.titulo}</div>
                <div className="mt-0.5 flex items-center gap-1 text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: dot }} />
                  {fmt}
                </div>
              </button>
            );
          })}

          {conteudosFiltrados.length === 0 && !criandoNovo && (
            <div className="text-center py-8 text-gray-400">
              <FileText size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhum roteiro aqui</p>
            </div>
          )}
        </div>
      </div>

      {/* Painel principal */}
      <div className={`${!painelDetalhe ? "hidden md:flex" : "flex"} flex-1 flex-col overflow-y-auto`}>

        {/* Botão voltar — só mobile, só quando em detalhe */}
        {painelDetalhe && (
          <button
            onClick={() => { setSelecionado(null); setCriandoNovo(false); }}
            className="md:hidden flex items-center gap-2 px-4 py-3 text-sm text-gray-500 border-b border-gray-100 hover:bg-gray-50"
          >
            <ChevronRight size={16} className="rotate-180" /> Voltar
          </button>
        )}

        {/* Novo roteiro */}
        {criandoNovo && (
          <div className="p-4 md:p-8 max-w-3xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Novo conteúdo</h2>
                <p className="text-sm text-gray-500 mt-0.5">Crie um roteiro ou gere várias ideias de uma vez</p>
              </div>
              <button onClick={() => setCriandoNovo(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hidden md:block"><X size={16} /></button>
            </div>

            {/* Toggle modo */}
            <div className="flex bg-gray-100 rounded-lg p-0.5 mb-6">
              <button onClick={() => setModoNovo("unico")}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${modoNovo === "unico" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                1 conteúdo
              </button>
              <button onClick={() => setModoNovo("lote")}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${modoNovo === "lote" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                Várias ideias
              </button>
            </div>

            {/* Modo: 1 conteúdo */}
            {modoNovo === "unico" && (
              <>
                <div className="flex gap-3 mb-6">
                  <input
                    value={form.titulo}
                    onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                    placeholder="Título do conteúdo"
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400"
                  />
                  <select value={form.formato} onChange={(e) => setForm((p) => ({ ...p, formato: e.target.value }))} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
                    {FORMATOS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  {temas.length > 0 && (
                    <select value={form.temaId} onChange={(e) => setForm((p) => ({ ...p, temaId: e.target.value }))} className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
                      <option value="">Sem tema</option>
                      {temas.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                    </select>
                  )}
                </div>

                <div className="mb-2">
                  <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Modelo de conteúdo</div>
                  <div className="grid grid-cols-2 gap-3">
                    {FRAMEWORKS.map((fw) => {
                      const ativo = form.framework === fw.id;
                      return (
                        <button key={fw.id} onClick={() => setForm((p) => ({ ...p, framework: fw.id }))}
                          className={`text-left p-4 rounded-xl border-2 transition-all ${ativo ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm"}`}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-lg">{fw.emoji}</span>
                            <span className={`text-[11px] font-semibold ${ativo ? "text-gray-400" : CATEGORIA_COR[fw.categoria]}`}>{fw.categoria}</span>
                          </div>
                          <div className={`font-semibold text-sm mb-2 ${ativo ? "text-white" : "text-gray-900"}`}>{fw.nome}</div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {fw.etapas.map((e, i) => (
                              <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ativo ? "bg-white/20 text-gray-200" : "bg-gray-100 text-gray-600"}`}>{e}</span>
                            ))}
                          </div>
                          <div className={`text-[11px] leading-snug mb-1.5 ${ativo ? "text-gray-300" : "text-gray-500"}`}>{fw.descricao}</div>
                          <div className={`text-[10px] leading-snug ${ativo ? "text-gray-400" : "text-gray-400"}`}>
                            <span className={`font-semibold ${ativo ? "text-gray-300" : "text-gray-500"}`}>Quando usar: </span>
                            {fw.quando}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 mb-5">
                  <input value={form.instrucao} onChange={(e) => setForm((p) => ({ ...p, instrucao: e.target.value }))}
                    placeholder="Instrução extra (opcional): ex: foco em seminovos, tom mais descontraído..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
                </div>

                <button onClick={criarRoteiro} disabled={gerando || !podeGerar}
                  className="w-full text-sm bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 font-medium">
                  <Sparkles size={14} />
                  {gerando ? "Gerando roteiro…" : !form.titulo.trim() ? "Preencha o título para gerar" : !form.framework ? "Escolha um modelo acima" : `Gerar com ${frameworkSelecionado?.nome}`}
                  {podeGerar && !gerando && <ChevronRight size={14} />}
                </button>
              </>
            )}

            {/* Modo: várias ideias */}
            {modoNovo === "lote" && (
              <>
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1.5">Sobre o que quer criar conteúdo?</div>
                  <textarea
                    value={loteForm.prompt}
                    onChange={(e) => setLoteForm((p) => ({ ...p, prompt: e.target.value }))}
                    placeholder="Ex: dicas de como cuidar da capa do celular, semana do consumidor, promoção de volta às aulas..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 h-24 resize-none"
                  />
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">Quantas ideias?</div>
                  <div className="flex gap-2">
                    {[3, 5, 7, 10].map((q) => (
                      <button key={q} onClick={() => setLoteForm((p) => ({ ...p, quantidade: q }))}
                        className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-all ${loteForm.quantidade === q ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {temas.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1.5">Tema (opcional)</div>
                    <select value={loteForm.temaId} onChange={(e) => setLoteForm((p) => ({ ...p, temaId: e.target.value }))}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white">
                      <option value="">Sem tema</option>
                      {temas.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                    </select>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-700">
                  A IA vai gerar {loteForm.quantidade} ideias com títulos e formatos variados. Depois você clica em cada ideia para gerar o roteiro completo.
                  {gerandoLote && <span className="block mt-1 font-medium">Isso pode levar 15–30 segundos, aguarde…</span>}
                </div>

                {sucessoLote > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-xs text-green-700 font-medium">
                    ✓ {sucessoLote} {sucessoLote === 1 ? "ideia criada" : "ideias criadas"}! Aparecerão na lista em instantes.
                  </div>
                )}

                {erroLote && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-xs text-red-700">
                    {erroLote}
                  </div>
                )}

                <button onClick={criarLote} disabled={gerandoLote || !loteForm.prompt.trim() || sucessoLote > 0}
                  className="w-full text-sm bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 font-medium">
                  <Sparkles size={14} />
                  {gerandoLote ? `Gerando ${loteForm.quantidade} ideias…` : `Gerar ${loteForm.quantidade} ideias`}
                  {!gerandoLote && loteForm.prompt.trim() && <ChevronRight size={14} />}
                </button>
              </>
            )}
          </div>
        )}

        {/* Visualizar roteiro selecionado */}
        {selecionado && !criandoNovo && (
          <div className="p-4 md:p-8 max-w-3xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{FORMATOS_CONFIG[selecionado.formato]?.label ?? selecionado.formato}</span>
                  <StatusBadge status={selecionado.status} />
                  {selecionado.etapaFunil && (
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                      {selecionado.etapaFunil === "TOPO" ? "Topo do funil" : selecionado.etapaFunil === "MEIO" ? "Meio do funil" : "Fundo do funil"}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900 leading-snug">{selecionado.titulo}</h2>
                {selecionado.objetivo && <p className="text-sm text-gray-500 mt-1">{selecionado.objetivo}</p>}
              </div>
              <button onClick={duplicar} disabled={duplicando} title="Duplicar conteúdo"
                className="ml-3 shrink-0 p-2 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-colors disabled:opacity-40">
                <CopyIcon size={14} />
              </button>
            </div>

            {/* Gerar roteiro para IDEIA sem roteiro */}
            {selecionado.status === "IDEIA" && !selecionado.roteiro && (
              <div className="mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-800 mb-0.5">Gerar roteiro para esta ideia</p>
                <p className="text-xs text-gray-500 mb-3">Escolha o modelo que a IA vai usar para criar o roteiro completo.</p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {FRAMEWORKS.map((fw) => {
                    const ativo = frameworkIdeia === fw.id;
                    return (
                      <button key={fw.id} onClick={() => setFrameworkIdeia(fw.id)}
                        className={`text-left p-3 rounded-xl border-2 transition-all ${ativo ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-base">{fw.emoji}</span>
                          <span className={`text-[10px] font-semibold ${ativo ? "text-gray-400" : CATEGORIA_COR[fw.categoria]}`}>{fw.categoria}</span>
                        </div>
                        <div className={`font-semibold text-xs mb-1.5 ${ativo ? "text-white" : "text-gray-900"}`}>{fw.nome}</div>
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {fw.etapas.map((e, i) => (
                            <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${ativo ? "bg-white/20 text-gray-200" : "bg-gray-100 text-gray-600"}`}>{e}</span>
                          ))}
                        </div>
                        <div className={`text-[11px] leading-snug mb-1 ${ativo ? "text-gray-300" : "text-gray-400"}`}>{fw.descricao}</div>
                        <div className={`text-[10px] leading-snug ${ativo ? "text-gray-400" : "text-gray-400"}`}>
                          <span className={`font-semibold ${ativo ? "text-gray-300" : "text-gray-500"}`}>Quando: </span>
                          {fw.quando}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={gerarRoteiroParaIdeia} disabled={gerandoRoteiroIdeia || !frameworkIdeia}
                  className="w-full text-sm bg-gray-900 text-white py-2.5 rounded-xl hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center gap-2 font-medium">
                  <Sparkles size={13} />
                  {gerandoRoteiroIdeia ? "Gerando roteiro…" : frameworkIdeia ? `Gerar com ${FRAMEWORKS.find((f) => f.id === frameworkIdeia)?.nome}` : "Escolha um modelo acima"}
                </button>
              </div>
            )}

            {/* Botões de ação para GERADO_IA */}
            {isGeradoIA && telaAcao === null && (
              <div className="flex gap-2 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-900 mb-1">Roteiro gerado pela IA</p>
                  <p className="text-xs text-blue-700">Revise o conteúdo e escolha uma ação</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setTelaAcao("aprovar")} className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
                    <Check size={13} /> Aprovar
                  </button>
                  <button onClick={marcarRevisar} disabled={salvando} className="flex items-center gap-1.5 text-xs bg-amber-500 text-white px-3 py-2 rounded-lg hover:bg-amber-600 transition-colors font-medium">
                    <Clock size={13} /> Mais tarde
                  </button>
                  <button onClick={() => setTelaAcao("descartar")} className="flex items-center gap-1.5 text-xs bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors font-medium">
                    <Trash2 size={13} /> Descartar
                  </button>
                </div>
              </div>
            )}

            {/* Confirmação de aprovar */}
            {telaAcao === "aprovar" && (
              <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-sm font-semibold text-green-900 mb-1 flex items-center gap-1.5"><CalendarPlus size={15} />Adicionar ao calendário?</p>
                <p className="text-xs text-green-700 mb-3">Deseja agendar este conteúdo no próximo dia disponível?</p>
                <div className="flex gap-2">
                  <button onClick={() => aprovar(true)} disabled={salvando} className="flex items-center gap-1.5 text-xs bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50">
                    <CalendarPlus size={13} />{salvando ? "Agendando…" : "Sim, adicionar ao calendário"}
                  </button>
                  <button onClick={() => aprovar(false)} disabled={salvando} className="flex items-center gap-1.5 text-xs bg-white text-green-700 border border-green-200 px-4 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium disabled:opacity-50">
                    <Check size={13} /> Não, só aprovar
                  </button>
                  <button onClick={() => setTelaAcao(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancelar</button>
                </div>
              </div>
            )}

            {/* Confirmação de descartar */}
            {telaAcao === "descartar" && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-sm font-semibold text-red-800 mb-1">Tem certeza?</p>
                <p className="text-xs text-red-600 mb-3">Este roteiro será excluído permanentemente.</p>
                <div className="flex gap-2">
                  <button onClick={descartar} disabled={salvando} className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50">
                    {salvando ? "Excluindo…" : "Sim, excluir"}
                  </button>
                  <button onClick={() => setTelaAcao(null)} className="text-xs bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                </div>
              </div>
            )}

            {/* Status + Responsável (para não-GERADO_IA) */}
            {!isGeradoIA && (
              <div className="flex flex-wrap items-center gap-4 mb-5">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 shrink-0">Status</div>
                  <select value={selecionado.status} onChange={(e) => salvarStatus(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-gray-400 bg-white">
                    {STATUS_LIST.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-xs text-gray-500 shrink-0">Responsável</div>
                  <div className="flex gap-1 flex-wrap items-center">
                    {membrosEquipe.map((r) => {
                      const ativo = selecionado.responsavel === r.nome;
                      const inicial = r.nome[0]?.toUpperCase() ?? "?";
                      return (
                        <button key={r.id}
                          onClick={() => salvarCampo("responsavel", ativo ? "" : r.nome)}
                          title={r.nome}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-all"
                          style={{ backgroundColor: ativo ? r.cor : "#E5E7EB", color: ativo ? "white" : r.cor, border: ativo ? `2px solid ${r.cor}` : "2px solid #E5E7EB" }}>
                          {inicial}
                        </button>
                      );
                    })}
                    {addingMembro ? (
                      <div className="flex items-center gap-1">
                        <input autoFocus value={novoMembroNome} onChange={(e) => setNovoMembroNome(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") adicionarMembro(); if (e.key === "Escape") { setAddingMembro(false); setNovoMembroNome(""); } }}
                          placeholder="Nome" className="text-[11px] border border-gray-300 rounded-lg px-2 py-1 w-20 focus:outline-none" />
                        <button onClick={adicionarMembro} className="text-[10px] bg-gray-900 text-white px-1.5 py-1 rounded">OK</button>
                        <button onClick={() => { setAddingMembro(false); setNovoMembroNome(""); }} className="text-gray-400 text-xs">✕</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingMembro(true)} title="Adicionar responsável"
                        className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-500 transition-colors text-sm font-bold">+</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Calendário editorial */}
            <div className="mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Calendar size={12} /> Calendário editorial
              </div>
              {selecionado.dataplanejada ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">
                    {format(parseISO(selecionado.dataplanejada), "d 'de' MMM 'às' HH:mm", { locale: ptBR })}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const d = parseISO(selecionado.dataplanejada!);
                        setAgendandoData(format(d, "yyyy-MM-dd"));
                        setAgendandoHora(d.getHours());
                        setAgendandoMinuto(d.getMinutes());
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <CalendarPlus size={12} /> Alterar
                    </button>
                    <button onClick={removerDoCalendario}
                      className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                      <CalendarX size={12} /> Remover
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-2">Não agendado no calendário</p>
              )}
              {(!selecionado.dataplanejada || agendandoData) && (
                <div className="mt-2 flex flex-wrap gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400">Data</span>
                    <input type="date" value={agendandoData}
                      onChange={(e) => setAgendandoData(e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400">Hora</span>
                    <select value={agendandoHora} onChange={(e) => setAgendandoHora(Number(e.target.value))}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white">
                      {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, "0")}h</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400">Min</span>
                    <select value={agendandoMinuto} onChange={(e) => setAgendandoMinuto(Number(e.target.value))}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white">
                      {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
                    </select>
                  </div>
                  <button onClick={agendarNoCalendario}
                    disabled={!agendandoData || salvandoData}
                    className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors">
                    <CalendarPlus size={12} />
                    {salvandoData ? "Salvando…" : "Salvar no calendário"}
                  </button>
                  {agendandoData && selecionado.dataplanejada && (
                    <button onClick={() => setAgendandoData("")}
                      className="text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                  )}
                </div>
              )}
            </div>

            {/* Roteiro */}
            {selecionado.roteiro && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setMostrarRoteiro((v) => !v)} className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide hover:text-gray-900">
                    <span>Roteiro</span>
                    {mostrarRoteiro ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {mostrarRoteiro && selecionado.roteiro && !editandoRoteiro && (
                    <button onClick={() => copiar(selecionado.roteiro!, "roteiro")}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
                      {copiadoRoteiro ? <><Check size={11} className="text-green-500" /> Copiado!</> : <><Copy size={11} /> Copiar</>}
                    </button>
                  )}
                </div>
                {mostrarRoteiro && (
                  editandoRoteiro ? (
                    <div>
                      <textarea value={roteiroTemp} onChange={(e) => setRoteiroTemp(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl p-4 focus:outline-none focus:border-gray-400 min-h-[200px] leading-relaxed resize-y" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={async () => { await salvarCampo("roteiro", roteiroTemp); setEditandoRoteiro(false); }}
                          className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700">Salvar</button>
                        <button onClick={() => setEditandoRoteiro(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <RoteiroMD texto={selecionado.roteiro} />
                      </div>
                      <button onClick={() => { setRoteiroTemp(selecionado.roteiro ?? ""); setEditandoRoteiro(true); }}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500 hover:text-gray-700">
                        <Pencil size={12} />
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Legenda */}
            {(selecionado.legenda || mostrarLegenda) && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => setMostrarLegenda((v) => !v)} className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide hover:text-gray-900">
                    <span>Legenda</span>
                    {mostrarLegenda ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {mostrarLegenda && selecionado.legenda && !editandoLegenda && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setMostrarPreview((v) => !v)}
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
                        {mostrarPreview ? <><EyeOff size={11} /> Preview</> : <><Eye size={11} /> Preview</>}
                      </button>
                      <button onClick={() => copiar(selecionado.legenda!, "legenda")}
                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100">
                        {copiadoLegenda ? <><Check size={11} className="text-green-500" /> Copiado!</> : <><Copy size={11} /> Copiar</>}
                      </button>
                    </div>
                  )}
                </div>
                {mostrarLegenda && (
                  editandoLegenda ? (
                    <div>
                      <textarea value={legendaTemp} onChange={(e) => setLegendaTemp(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl p-4 focus:outline-none focus:border-gray-400 min-h-[100px] leading-relaxed resize-y" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={async () => { await salvarCampo("legenda", legendaTemp); setEditandoLegenda(false); }}
                          className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700">Salvar</button>
                        <button onClick={() => setEditandoLegenda(false)} className="text-xs text-gray-500 hover:text-gray-700 px-2">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="bg-purple-50 rounded-xl p-4 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed border border-purple-100">
                        {selecionado.legenda || <span className="text-gray-400 italic">Nenhuma legenda gerada</span>}
                      </div>
                      <button onClick={() => { setLegendaTemp(selecionado.legenda ?? ""); setEditandoLegenda(true); }}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-500 hover:text-gray-700">
                        <Pencil size={12} />
                      </button>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Mostrar legenda se não existir ainda */}
            {!selecionado.legenda && !mostrarLegenda && (
              <button onClick={() => setMostrarLegenda(true)} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4">
                <ChevronDown size={12} /> Mostrar legenda
              </button>
            )}

            {/* Sugestões de Produção */}
            {selecionado.sugestoesProducao && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Sugestões de Produção</p>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{selecionado.sugestoesProducao}</p>
                </div>
              </div>
            )}

            {/* Preview estilo Instagram */}
            {mostrarPreview && selecionado.legenda && (
              <div className="mb-4 border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">Preview — estilo Instagram</div>
                <div className="p-4 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold">IC</div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{CONFIG.instagram.handle}</div>
                      <div className="text-[10px] text-gray-400">{CONFIG.instagram.localizacao}</div>
                    </div>
                  </div>
                  <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">{FORMATOS_CONFIG[selecionado.formato]?.label ?? selecionado.formato}</span>
                  </div>
                  <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                    <span className="font-semibold">{CONFIG.instagram.handle}</span>{" "}
                    {selecionado.legenda}
                  </div>
                </div>
              </div>
            )}

            {/* Hashtags */}
            {selecionado.roteiro && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Hashtags</span>
                  <button onClick={gerarHashtags} disabled={gerandoHashtags}
                    className="flex items-center gap-1 text-[11px] text-purple-600 hover:text-purple-800 transition-colors px-2 py-1 rounded-lg hover:bg-purple-50 disabled:opacity-40">
                    <Hash size={11} />
                    {gerandoHashtags ? "Gerando…" : hashtags ? "Gerar novamente" : "Gerar hashtags"}
                  </button>
                </div>
                {hashtags && (
                  <div className="relative bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-xs text-purple-800 leading-relaxed">{hashtags}</p>
                    <button onClick={() => copiar(hashtags, "hashtags")}
                      className="absolute top-3 right-3 flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-700 transition-colors px-2 py-1 rounded-lg hover:bg-purple-100">
                      {copiadoHashtags ? <><Check size={10} className="text-green-500" /> Copiado!</> : <><Copy size={10} /> Copiar</>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Versão anterior */}
            {selecionado.roteiroAnterior && (
              <div className="mb-4 border border-amber-100 rounded-xl overflow-hidden">
                <button onClick={() => setMostrarVersaoAnterior((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> Versão anterior (antes de "Melhorar")
                  </span>
                  {mostrarVersaoAnterior ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                {mostrarVersaoAnterior && (
                  <div className="p-4 bg-amber-50/40 max-h-48 overflow-y-auto border-t border-amber-100">
                    <RoteiroMD texto={selecionado.roteiroAnterior ?? ""} />
                  </div>
                )}
              </div>
            )}

            {/* Melhorar com IA */}
            <div className="flex gap-2 mt-2">
              <input value={instrucaoMelhoria} onChange={(e) => setInstrucaoMelhoria(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && melhorarRoteiro()}
                placeholder="O que quer melhorar? Ex: deixar mais curto, mudar o gancho..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
              <button onClick={melhorarRoteiro} disabled={gerando || !instrucaoMelhoria.trim()}
                className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors flex items-center gap-2 whitespace-nowrap">
                <Sparkles size={13} />
                {gerando ? "Melhorando…" : "Melhorar"}
              </button>
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!selecionado && !criandoNovo && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <FileText size={40} className="mb-4 opacity-20" />
            <p className="text-sm mb-3">Selecione um roteiro ou crie um novo</p>
            <button onClick={() => setCriandoNovo(true)} className="text-xs bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-1.5">
              <Plus size={12} /> Novo roteiro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoteirosPage() {
  return (
    <Suspense>
      <RoteirosPageInner />
    </Suspense>
  );
}
