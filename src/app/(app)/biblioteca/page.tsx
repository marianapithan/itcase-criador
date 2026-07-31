"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Signal, CheckSquare, Square, CalendarPlus, X, Lightbulb, BookOpen, Copy } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_CONFIG, STATUS_LIST_EDITORIAL, FORMATOS_CONFIG, MembroEquipe, getMembroConfig } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";

type Conteudo = {
  id: string; titulo: string; formato: string; status: string;
  dataplanejada?: string; responsavel?: string; trafegoAtivo: boolean;
  trafegoStatus?: string; agendadoRede: boolean;
  gravado: boolean; editado: boolean; concluido: boolean;
  tema?: { titulo: string };
};

type AgendarState = { id: string; data: string; hora: number; minuto: number };

type FiltroProducao = "" | "gravado" | "editado" | "agendadoRede" | "concluido";

const PRODUCAO_LABELS: Record<FiltroProducao, string> = {
  "": "Produção",
  gravado: "Gravado",
  editado: "Editado",
  agendadoRede: "Agendado",
  concluido: "Concluída",
};

const STATUS_LOTE = [
  { value: "APROVADO", label: "Aprovar" },
  { value: "ROTEIRO_PRONTO", label: "Roteiro pronto" },
  { value: "AGENDADO", label: "Agendar" },
  { value: "PUBLICADO", label: "Publicado" },
  { value: "DESCARTADO", label: "Descartar" },
];

export default function BibliotecaPage() {
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroFormato, setFiltroFormato] = useState("");
  const [filtroProducao, setFiltroProducao] = useState<FiltroProducao>("");
  const [filtroAgendado, setFiltroAgendado] = useState<"" | "sim" | "nao">("");
  const [filtroTrafego, setFiltroTrafego] = useState<"" | "sim" | "nao">("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [operandoLote, setOperandoLote] = useState(false);
  const [agendando, setAgendando] = useState<AgendarState | null>(null);
  const [salvandoData, setSalvandoData] = useState(false);
  const [duplicando, setDuplicando] = useState<string | null>(null);
  const [membrosEquipe, setMembrosEquipe] = useState<MembroEquipe[]>([]);

  async function carregar() {
    const [data, eq] = await Promise.all([
      fetch("/api/conteudos?incluirTema=true").then((r) => r.json()),
      fetch("/api/equipe").then((r) => r.json()),
    ]);
    setConteudos(data);
    setMembrosEquipe(Array.isArray(eq) ? eq : []);
  }

  async function duplicar(c: Conteudo) {
    if (duplicando) return;
    setDuplicando(c.id);
    try {
      await fetch("/api/conteudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: `${c.titulo} (cópia)`,
          formato: c.formato,
          status: "IDEIA",
          temaId: undefined,
        }),
      });
      await carregar();
    } finally {
      setDuplicando(null);
    }
  }

  useEffect(() => { carregar(); }, []);

  const filtrados = conteudos.filter((c) => {
    if (busca && !c.titulo.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroStatus && c.status !== filtroStatus) return false;
    if (filtroFormato && c.formato !== filtroFormato) return false;
    if (filtroProducao && !c[filtroProducao as keyof Conteudo]) return false;
    if (filtroAgendado === "sim" && !c.agendadoRede) return false;
    if (filtroAgendado === "nao" && c.agendadoRede) return false;
    if (filtroTrafego === "sim" && !c.trafegoAtivo) return false;
    if (filtroTrafego === "nao" && c.trafegoAtivo) return false;
    if (filtroResponsavel && c.responsavel !== filtroResponsavel) return false;
    return true;
  });

  const temFiltro = busca || filtroStatus || filtroFormato || filtroProducao || filtroAgendado || filtroTrafego || filtroResponsavel;
  const todosSelecionados = filtrados.length > 0 && filtrados.every((c) => selecionados.has(c.id));
  const algunsSelecionados = selecionados.size > 0 && !todosSelecionados;

  function limparFiltros() {
    setBusca(""); setFiltroStatus(""); setFiltroFormato(""); setFiltroProducao("");
    setFiltroAgendado(""); setFiltroTrafego(""); setFiltroResponsavel("");
  }

  function toggleSelecionado(id: string) {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    if (todosSelecionados) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(filtrados.map((c) => c.id)));
    }
  }

  async function aplicarLote(novoStatus: string) {
    setOperandoLote(true);
    try {
      const ids = Array.from(selecionados);
      await Promise.all(ids.map((id) =>
        fetch(`/api/conteudos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: novoStatus }),
        })
      ));
      await carregar();
      setSelecionados(new Set());
    } finally {
      setOperandoLote(false);
    }
  }

  async function salvarAgendamento() {
    if (!agendando?.data) return;
    setSalvandoData(true);
    try {
      const [ano, mes, dia] = agendando.data.split("-").map(Number);
      const novaData = new Date(ano, mes - 1, dia, agendando.hora, agendando.minuto, 0, 0);
      await fetch(`/api/conteudos/${agendando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataplanejada: novaData.toISOString() }),
      });
      setConteudos((prev) => prev.map((c) =>
        c.id === agendando.id ? { ...c, dataplanejada: novaData.toISOString() } : c
      ));
      setAgendando(null);
    } finally {
      setSalvandoData(false);
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-full">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Biblioteca</h1>
          <p className="text-gray-400 text-xs mt-0.5">{filtrados.length} conteúdo{filtrados.length !== 1 ? "s" : ""}{temFiltro ? " filtrados" : ""}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/roteiros"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors bg-white">
            <Lightbulb size={13} className="text-yellow-500" />
            Salvar ideia
          </Link>
          <Link href="/roteiros?novo=1"
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors">
            <BookOpen size={13} />
            Criar roteiro
          </Link>
          {temFiltro && (
            <button onClick={limparFiltros} className="text-xs text-gray-400 hover:text-gray-700 underline ml-1">Limpar filtros</button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar..."
            className="text-xs border border-gray-200 rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-gray-400 w-44"
          />
        </div>

        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none bg-white text-gray-600">
          <option value="">Status</option>
          {[...STATUS_LIST_EDITORIAL, "REVISAR_MAIS_TARDE", "DESCARTADO"].map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
          ))}
        </select>

        <select value={filtroFormato} onChange={(e) => setFiltroFormato(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none bg-white text-gray-600">
          <option value="">Formato</option>
          {Object.entries(FORMATOS_CONFIG).map(([k, cfg]) => <option key={k} value={k}>{cfg.label}</option>)}
        </select>

        <select value={filtroProducao} onChange={(e) => setFiltroProducao(e.target.value as FiltroProducao)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none bg-white text-gray-600">
          {Object.entries(PRODUCAO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select value={filtroAgendado} onChange={(e) => setFiltroAgendado(e.target.value as "" | "sim" | "nao")}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none bg-white text-gray-600">
          <option value="">Agendado</option>
          <option value="sim">Agendado ✓</option>
          <option value="nao">Não agendado</option>
        </select>

        <select value={filtroTrafego} onChange={(e) => setFiltroTrafego(e.target.value as "" | "sim" | "nao")}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none bg-white text-gray-600">
          <option value="">Tráfego</option>
          <option value="sim">Com tráfego</option>
          <option value="nao">Orgânico</option>
        </select>

        <select value={filtroResponsavel} onChange={(e) => setFiltroResponsavel(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none bg-white text-gray-600">
          <option value="">Responsável</option>
          {membrosEquipe.map((r) => <option key={r.id} value={r.nome}>{r.nome}</option>)}
        </select>
      </div>

      {/* Barra de ação em lote */}
      {selecionados.size > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-gray-900 text-white rounded-xl">
          <span className="text-xs font-medium text-gray-300">
            {selecionados.size} selecionado{selecionados.size !== 1 ? "s" : ""}
          </span>
          <div className="flex-1 flex items-center gap-2 flex-wrap">
            {STATUS_LOTE.map(({ value, label }) => (
              <button key={value}
                onClick={() => aplicarLote(value)}
                disabled={operandoLote}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-40">
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setSelecionados(new Set())}
            className="text-xs text-gray-400 hover:text-white transition-colors">
            Cancelar
          </button>
        </div>
      )}

      {/* Modal agendar */}
      {agendando && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setAgendando(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CalendarPlus size={15} className="text-gray-500" /> Agendar no calendário
              </h3>
              <button onClick={() => setAgendando(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Data</div>
                <input type="date" value={agendando.data}
                  onChange={(e) => setAgendando((p) => p ? { ...p, data: e.target.value } : p)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Hora</div>
                  <select value={agendando.hora}
                    onChange={(e) => setAgendando((p) => p ? { ...p, hora: Number(e.target.value) } : p)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none bg-white">
                    {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => (
                      <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Minuto</div>
                  <select value={agendando.minuto}
                    onChange={(e) => setAgendando((p) => p ? { ...p, minuto: Number(e.target.value) } : p)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none bg-white">
                    {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={salvarAgendamento} disabled={!agendando.data || salvandoData}
                className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                <CalendarPlus size={14} />
                {salvandoData ? "Salvando…" : "Salvar no calendário"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="border border-gray-100 rounded-xl overflow-hidden bg-white overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-2.5 w-8">
                <button onClick={toggleTodos} className="text-gray-400 hover:text-gray-700 flex items-center">
                  {todosSelecionados
                    ? <CheckSquare size={14} className="text-gray-700" />
                    : algunsSelecionados
                    ? <CheckSquare size={14} className="text-gray-400" />
                    : <Square size={14} />}
                </button>
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-auto">Título</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-24">Formato</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-36">Status</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-28">Produção</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-28">Data</th>
              <th className="text-center px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-20">Agendado</th>
              <th className="text-center px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-24">Tráfego</th>
              <th className="text-center px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-24">Rodando</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-24">Resp.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtrados.map((c) => {
              const status = STATUS_CONFIG[c.status] ?? { label: c.status, cor: "bg-gray-100 text-gray-600", dot: "#9CA3AF" };
              const fmt = FORMATOS_CONFIG[c.formato] ?? { label: c.formato, bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" };
              const resp = getMembroConfig(c.responsavel ?? "", membrosEquipe);
              const producaoStep = c.concluido ? "Concluída" : c.agendadoRede ? "Agendada" : c.editado ? "Editado" : c.gravado ? "Gravado" : "—";
              const producaoCor = c.concluido ? "text-emerald-600" : c.agendadoRede ? "text-purple-600" : c.editado ? "text-blue-600" : c.gravado ? "text-amber-600" : "text-gray-300";
              const rodandoCor = c.trafegoStatus === "EM_VEICULACAO" ? "text-orange-500" : "text-gray-300";
              const rodandoLabel = c.trafegoStatus === "EM_VEICULACAO" ? "Sim" : c.trafegoAtivo ? "Não" : "—";
              const sel = selecionados.has(c.id);

              return (
                <tr key={c.id} onClick={() => toggleSelecionado(c.id)}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer select-none ${sel ? "bg-blue-50/60" : ""}`}>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => toggleSelecionado(c.id)} className="text-gray-400 hover:text-gray-700 flex items-center">
                      {sel ? <CheckSquare size={14} className="text-blue-500" /> : <Square size={14} />}
                    </button>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start gap-2 group/title">
                      <div className="flex-1 cursor-pointer" onClick={() => toggleSelecionado(c.id)}>
                        <div className="font-medium text-gray-900 line-clamp-2">{c.titulo}</div>
                        {c.tema && <div className="text-gray-400 mt-0.5 text-[10px]">{c.tema.titulo}</div>}
                      </div>
                      <button
                        onClick={() => duplicar(c)}
                        disabled={duplicando === c.id}
                        className="opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0 p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 mt-0.5"
                        title="Duplicar conteúdo">
                        <Copy size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ backgroundColor: fmt.bg, color: fmt.text }}>
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: fmt.dot }} />
                      {fmt.label}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className={`px-3 py-3 text-xs font-medium ${producaoCor}`}>{producaoStep}</td>
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        const d = c.dataplanejada ? parseISO(c.dataplanejada) : new Date();
                        setAgendando({
                          id: c.id,
                          data: c.dataplanejada ? format(parseISO(c.dataplanejada), "yyyy-MM-dd") : "",
                          hora: c.dataplanejada ? d.getHours() : 12,
                          minuto: c.dataplanejada ? d.getMinutes() : 0,
                        });
                      }}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 group">
                      <CalendarPlus size={12} className="text-gray-300 group-hover:text-gray-700 shrink-0" />
                      {c.dataplanejada
                        ? format(parseISO(c.dataplanejada), "dd/MM · HH:mm", { locale: ptBR })
                        : <span className="text-gray-300 group-hover:text-gray-500">Agendar</span>}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {c.agendadoRede
                      ? <span className="text-purple-500 font-bold">✓</span>
                      : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {c.trafegoAtivo
                      ? <span className="inline-flex items-center gap-0.5 text-orange-500 font-medium"><Signal size={10} /> Sim</span>
                      : <span className="text-gray-200">—</span>}
                  </td>
                  <td className={`px-3 py-3 text-center font-medium ${rodandoCor}`}>{rodandoLabel}</td>
                  <td className="px-3 py-3">
                    {resp ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ backgroundColor: resp.cor }}>{resp.inicial}</div>
                        <span className="text-gray-600">{resp.nome}</span>
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtrados.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-xs">Nenhum conteúdo encontrado.</div>
        )}
      </div>
    </div>
  );
}
