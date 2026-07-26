"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Plus, X, Video, Scissors, Clock, CheckCircle,
  Pencil, CalendarX, Trash2, ChevronDown, ChevronUp, Signal,
} from "lucide-react";
import {
  format, startOfWeek, addWeeks, subWeeks, eachDayOfInterval,
  isSameDay, isToday, parseISO, addDays, isBefore, isAfter,
  startOfMonth, endOfMonth, subMonths, addMonths, getDay, subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FORMATOS_CONFIG, STATUS_CONFIG, STATUS_LIST_EDITORIAL,
  RESPONSAVEIS, getResponsavelConfig, TRAFEGO_STATUS_LIST,
} from "@/lib/constants";

type ViewMode = "hoje" | "semana" | "mes";

type Conteudo = {
  id: string; titulo: string; formato: string; status: string;
  dataplanejada?: string; canal?: string; campanha?: string; temaId?: string;
  roteiro?: string; legenda?: string; objetivo?: string; etapaFunil?: string; responsavel?: string;
  descricao?: string;
  gravado: boolean; editado: boolean; agendadoRede: boolean; concluido: boolean;
  trafegoAtivo: boolean; trafegoStatus?: string; trafegoInicio?: string; trafegoFim?: string;
  trafegoObjetivo?: string; trafegoObs?: string;
};

type Campanha = { id: string; nome: string; dataInicio: string; dataFim: string; objetivo?: string };
type Tema = { id: string; titulo: string };

type DragState = {
  evento: Conteudo; offsetY: number;
  curX: number; curY: number;
  diaIdx: number; hora: number; minuto: number;
};

const GRID_START = 10;
const GRID_END = 22;
const HOUR_HEIGHT = 60;
const TIME_COL = 56;
const HOURS = Array.from({ length: GRID_END - GRID_START + 1 }, (_, i) => i + GRID_START);

type PipelineField = "gravado" | "editado" | "agendadoRede" | "concluido";
const PIPELINE_STEPS: { field: PipelineField; label: string; icon: React.ElementType }[] = [
  { field: "gravado",      label: "Gravado",   icon: Video },
  { field: "editado",      label: "Editado",   icon: Scissors },
  { field: "agendadoRede", label: "Agendado",  icon: Clock },
  { field: "concluido",    label: "Concluída", icon: CheckCircle },
];

const ETAPAS = [{ value: "TOPO", label: "Topo" }, { value: "MEIO", label: "Meio" }, { value: "FUNDO", label: "Fundo" }];

function getCfg(fmt: string) {
  return FORMATOS_CONFIG[fmt] ?? { label: fmt, bg: "#F3F4F6", border: "#9CA3AF", text: "#374151", dot: "#9CA3AF" };
}

function toDateInputValue(iso: string) { return iso.split("T")[0]; }

const ALERTAS_STATUS = ["AGENDADO", "APROVADO", "ROTEIRO_PRONTO"];

function isAlertaGravacao(ev: Conteudo): boolean {
  if (ev.gravado || !ev.dataplanejada) return false;
  if (!ALERTAS_STATUS.includes(ev.status)) return false;
  const dp = parseISO(ev.dataplanejada);
  const agora = new Date();
  const limite = addDays(agora, 2);
  return !isBefore(dp, agora) && !isAfter(dp, limite);
}

type ConfirmDrag = {
  eventoId: string;
  titulo: string;
  dataAntiga: string;
  dataNovaISO: string;
};

export default function CalendarioPage() {
  const [view, setView] = useState<ViewMode>("semana");
  const [refDate, setRefDate] = useState(new Date());
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [selecionado, setSelecionado] = useState<Conteudo | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [novoSlot, setNovoSlot] = useState<{ dia: Date; hora: number } | null>(null);
  const [novoForm, setNovoForm] = useState({ titulo: "", formato: "REELS", hora: 12, minuto: 0 });
  const [salvando, setSalvando] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [mesoDrag, setMesDrag] = useState<Conteudo | null>(null);
  const [confirmDrag, setConfirmDrag] = useState<ConfirmDrag | null>(null);
  const [horaAtual, setHoraAtual] = useState({ h: new Date().getHours(), m: new Date().getMinutes() });
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [mostrarRoteiro, setMostrarRoteiro] = useState(false);
  const [mostrarLegenda, setMostrarLegenda] = useState(false);
  const [editandoRoteiro, setEditandoRoteiro] = useState(false);
  const [editandoLegenda, setEditandoLegenda] = useState(false);
  const [roteiroTemp, setRoteiroTemp] = useState("");
  const [legendaTemp, setLegendaTemp] = useState("");
  const [novaCampanha, setNovaCampanha] = useState(false);
  const [campForm, setCampForm] = useState({ nome: "", dataInicio: "", dataFim: "", objetivo: "" });

  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const diasRef = useRef<Date[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Computed dates ---
  const inicioSemana = startOfWeek(refDate, { weekStartsOn: 0 });
  const diasSemana = eachDayOfInterval({ start: inicioSemana, end: addDays(inicioSemana, 6) });

  // For "hoje": single day
  const diasHoje = [refDate];

  // For "mes": grid of 6 weeks starting from first Sunday before month start
  const inicioMes = startOfMonth(refDate);
  const fimMes = endOfMonth(refDate);
  const inicioGrid = subDays(inicioMes, getDay(inicioMes));
  const diasMes = eachDayOfInterval({ start: inicioGrid, end: addDays(inicioGrid, 41) });

  const dias = view === "mes" ? diasSemana : view === "hoje" ? diasHoje : diasSemana;

  useEffect(() => { dragRef.current = drag; }, [drag]);
  useEffect(() => { diasRef.current = dias; }, [dias]);

  async function carregar() {
    const [c, camp, t] = await Promise.all([
      fetch("/api/conteudos?comData=true").then((r) => r.json()),
      fetch("/api/campanhas").then((r) => r.json()),
      fetch("/api/temas").then((r) => r.json()),
    ]);
    setConteudos(c);
    setCampanhas(camp);
    setTemas(t);
  }

  useEffect(() => {
    carregar();
    const timer = setInterval(() => {
      const n = new Date();
      setHoraAtual({ h: n.getHours(), m: n.getMinutes() });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (drag) {
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    return () => { document.body.style.cursor = ""; document.body.style.userSelect = ""; };
  }, [!!drag]);

  function numCols() { return view === "hoje" ? 1 : 7; }

  const calcTarget = useCallback((clientX: number, clientY: number, offsetY: number) => {
    const el = scrollRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cols = dragRef.current ? (diasRef.current.length === 1 ? 1 : 7) : 7;
    const dayW = (rect.width - TIME_COL) / cols;
    const relX = clientX - rect.left - TIME_COL;
    const diaIdx = Math.max(0, Math.min(cols - 1, Math.floor(relX / dayW)));
    const relY = (clientY - rect.top) + el.scrollTop - offsetY;
    const totalMinsInGrid = Math.round((relY / HOUR_HEIGHT) * 60 / 15) * 15;
    const totalMins = totalMinsInGrid + GRID_START * 60;
    const clamped = Math.max(GRID_START * 60, Math.min(GRID_END * 60 - 15, totalMins));
    return { diaIdx, hora: Math.floor(clamped / 60), minuto: clamped % 60 };
  }, []);

  const isDragging = drag !== null;
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const t = calcTarget(e.clientX, e.clientY, d.offsetY);
      if (!t) return;
      setDrag((p) => p ? { ...p, curX: e.clientX, curY: e.clientY, ...t } : null);
    };
    const onUp = (e: PointerEvent) => {
      const d = dragRef.current;
      setDrag(null);
      document.body.style.cursor = "";
      if (!d) return;
      const t = calcTarget(e.clientX, e.clientY, d.offsetY);
      if (!t) return;
      const novoDia = diasRef.current[t.diaIdx];
      if (!novoDia) return;
      const novaData = new Date(novoDia);
      novaData.setHours(t.hora, t.minuto, 0, 0);
      const original = d.evento.dataplanejada ? parseISO(d.evento.dataplanejada) : null;
      if (!original || Math.abs(novaData.getTime() - original.getTime()) > 60000) {
        setConfirmDrag({
          eventoId: d.evento.id,
          titulo: d.evento.titulo,
          dataAntiga: d.evento.dataplanejada ?? "",
          dataNovaISO: novaData.toISOString(),
        });
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [isDragging, calcTarget]);

  function startDrag(e: React.PointerEvent, evento: Conteudo) {
    if (!evento.dataplanejada || view === "mes") return;
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const d = parseISO(evento.dataplanejada);
    const activeDias = view === "hoje" ? diasHoje : diasSemana;
    const diaIdx = Math.max(0, activeDias.findIndex((dia) => isSameDay(dia, d)));
    setDrag({ evento, offsetY, curX: e.clientX, curY: e.clientY, diaIdx, hora: d.getHours(), minuto: d.getMinutes() });
    setSelecionado(null);
    setNovoSlot(null);
  }

  function mesDrop(novoDia: Date) {
    if (!mesoDrag) return;
    const ev = mesoDrag;
    setMesDrag(null);
    document.body.style.cursor = "";
    const original = ev.dataplanejada ? parseISO(ev.dataplanejada) : null;
    const novaData = new Date(novoDia);
    novaData.setHours(original ? original.getHours() : 12, original ? original.getMinutes() : 0, 0, 0);
    if (original && isSameDay(original, novoDia)) return;
    setConfirmDrag({
      eventoId: ev.id,
      titulo: ev.titulo,
      dataAntiga: ev.dataplanejada ?? "",
      dataNovaISO: novaData.toISOString(),
    });
  }

  async function confirmarDrag() {
    if (!confirmDrag) return;
    const { eventoId, dataNovaISO } = confirmDrag;
    setConfirmDrag(null);
    setConteudos((prev) => prev.map((c) =>
      c.id === eventoId ? { ...c, dataplanejada: dataNovaISO } : c
    ));
    await fetch(`/api/conteudos/${eventoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataplanejada: dataNovaISO }),
    });
  }

  function cancelarDrag() {
    setConfirmDrag(null);
  }

  async function excluirDragEvento() {
    if (!confirmDrag) return;
    const { eventoId } = confirmDrag;
    setConfirmDrag(null);
    setConteudos((prev) => prev.filter((c) => c.id !== eventoId));
    await fetch(`/api/conteudos/${eventoId}`, { method: "DELETE" });
  }

  async function abrirDetalhe(ev: Conteudo) {
    setSelecionado(ev);
    setNovoSlot(null);
    setConfirmandoExclusao(false);
    setMostrarRoteiro(false);
    setMostrarLegenda(false);
    setEditandoRoteiro(false);
    setEditandoLegenda(false);
    setCarregandoDetalhe(true);
    try {
      const res = await fetch(`/api/conteudos/${ev.id}`);
      if (res.ok) setSelecionado(await res.json());
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  function eventosNaDia(dia: Date) {
    return conteudos.filter((c) => c.dataplanejada && isSameDay(parseISO(c.dataplanejada), dia));
  }

  function campanhasDoPeriodo(inicio: Date, fim: Date) {
    return campanhas.filter((c) => {
      const ini = parseISO(c.dataInicio);
      const end = parseISO(c.dataFim);
      return !isAfter(ini, fim) && !isBefore(end, inicio);
    });
  }

  async function criarConteudo() {
    if (!novoForm.titulo.trim() || !novoSlot) return;
    const d = new Date(novoSlot.dia);
    d.setHours(novoForm.hora, novoForm.minuto, 0, 0);
    await fetch("/api/conteudos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo: novoForm.titulo, formato: novoForm.formato, dataplanejada: d.toISOString(), status: "AGENDADO" }),
    });
    setNovoSlot(null);
    setNovoForm({ titulo: "", formato: "REELS", hora: 12, minuto: 0 });
    await carregar();
  }

  async function criarCampanha() {
    if (!campForm.nome || !campForm.dataInicio || !campForm.dataFim) return;
    await fetch("/api/campanhas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campForm),
    });
    setNovaCampanha(false);
    setCampForm({ nome: "", dataInicio: "", dataFim: "", objetivo: "" });
    await carregar();
  }

  async function excluirCampanha(id: string) {
    await fetch(`/api/campanhas/${id}`, { method: "DELETE" });
    await carregar();
  }

  async function togglePipeline(id: string, field: PipelineField, valor: boolean) {
    setSalvando(field);
    await fetch(`/api/conteudos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: valor }) });
    setSalvando(null);
    setConteudos((prev) => prev.map((c) => c.id === id ? { ...c, [field]: valor } : c));
    setSelecionado((p) => p?.id === id ? { ...p, [field]: valor } : p);
  }

  function atualizarCampoLocal(campo: string, valor: string | boolean) {
    if (!selecionado) return;
    setSelecionado((p) => p ? { ...p, [campo]: valor } : p);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (!selecionado) return;
      await fetch(`/api/conteudos/${selecionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [campo]: valor }),
      });
      setConteudos((prev) => prev.map((c) => c.id === selecionado.id ? { ...c, [campo]: valor } : c));
    }, 700);
  }

  async function salvarCampoImediato(campo: string, valor: string | boolean | null) {
    if (!selecionado) return;
    setSelecionado((p) => p ? { ...p, [campo]: valor } : p);
    await fetch(`/api/conteudos/${selecionado.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: valor }),
    });
    setConteudos((prev) => prev.map((c) => c.id === selecionado.id ? { ...c, [campo]: valor } : c));
  }

  async function atualizarDataHora(date: string, hora: number, minuto: number) {
    if (!selecionado) return;
    const [ano, mes, dia] = date.split("-").map(Number);
    const novaData = new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
    const iso = novaData.toISOString();
    setSelecionado((p) => p ? { ...p, dataplanejada: iso } : p);
    setConteudos((prev) => prev.map((c) => c.id === selecionado.id ? { ...c, dataplanejada: iso } : c));
    await fetch(`/api/conteudos/${selecionado.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataplanejada: iso }),
    });
  }

  async function removerDoCalendario() {
    if (!selecionado) return;
    await fetch(`/api/conteudos/${selecionado.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataplanejada: null }) });
    setConteudos((prev) => prev.filter((c) => c.id !== selecionado.id));
    setSelecionado(null);
  }

  async function excluirConteudo() {
    if (!selecionado) return;
    await fetch(`/api/conteudos/${selecionado.id}`, { method: "DELETE" });
    setConteudos((prev) => prev.filter((c) => c.id !== selecionado.id));
    setSelecionado(null);
    setConfirmandoExclusao(false);
  }

  async function salvarRoteiro() {
    if (!selecionado) return;
    await fetch(`/api/conteudos/${selecionado.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roteiro: roteiroTemp }) });
    setSelecionado((p) => p ? { ...p, roteiro: roteiroTemp } : p);
    setEditandoRoteiro(false);
  }

  async function salvarLegenda() {
    if (!selecionado) return;
    await fetch(`/api/conteudos/${selecionado.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ legenda: legendaTemp }) });
    setSelecionado((p) => p ? { ...p, legenda: legendaTemp } : p);
    setEditandoLegenda(false);
  }

  // Navigation
  function navPrev() {
    if (view === "hoje") setRefDate((d) => addDays(d, -1));
    else if (view === "semana") setRefDate((d) => subWeeks(d, 1));
    else setRefDate((d) => subMonths(d, 1));
  }
  function navNext() {
    if (view === "hoje") setRefDate((d) => addDays(d, 1));
    else if (view === "semana") setRefDate((d) => addWeeks(d, 1));
    else setRefDate((d) => addMonths(d, 1));
  }
  function navHoje() { setRefDate(new Date()); }

  function headerLabel() {
    if (view === "hoje") return format(refDate, "EEEE, d 'de' MMMM yyyy", { locale: ptBR });
    if (view === "semana") return `${format(inicioSemana, "d 'de' MMM", { locale: ptBR })} — ${format(addDays(inicioSemana, 6), "d 'de' MMM yyyy", { locale: ptBR })}`;
    return format(refDate, "MMMM yyyy", { locale: ptBR });
  }

  const activeDias = view === "hoje" ? diasHoje : diasSemana;
  const campSemana = campanhasDoPeriodo(activeDias[0], activeDias[activeDias.length - 1]);

  // ===================== RENDER =====================
  return (
    <div className="flex h-full overflow-hidden">

      {/* Modal de confirmação de drag */}
      {confirmDrag && (
        <div className="fixed inset-0 bg-black/40 z-[300] flex items-center justify-center" onClick={cancelarDrag}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[340px] mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Confirmar alteração</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-medium text-gray-700">{confirmDrag.titulo}</span>
                <br />
                {confirmDrag.dataAntiga
                  ? `${format(parseISO(confirmDrag.dataAntiga), "EEE, d MMM · HH:mm", { locale: ptBR })}`
                  : "sem data"}{" "}
                →{" "}
                <span className="font-medium text-gray-700">
                  {format(parseISO(confirmDrag.dataNovaISO), "EEE, d MMM · HH:mm", { locale: ptBR })}
                </span>
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={confirmarDrag}
                className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
                Sim, mover
              </button>
              <button onClick={cancelarDrag}
                className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                Cancelar
              </button>
              <button onClick={excluirDragEvento}
                className="w-full text-red-500 py-2 rounded-xl text-xs font-medium hover:bg-red-50 transition-colors">
                Excluir este conteúdo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white shrink-0 gap-2">
          <div className="flex items-center gap-1">
            <button onClick={navPrev} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronLeft size={15} /></button>
            <span className="text-xs md:text-sm font-semibold text-gray-900 min-w-0 md:min-w-[240px] text-center capitalize truncate max-w-[140px] md:max-w-none">{headerLabel()}</span>
            <button onClick={navNext} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronRight size={15} /></button>
            <button onClick={navHoje} className="text-xs border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 text-gray-600 ml-0.5">Hoje</button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* View selector */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {(["hoje", "semana", "mes"] as ViewMode[]).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`text-[11px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-md capitalize transition-all ${view === v ? "bg-white text-gray-900 font-semibold shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {v === "hoje" ? "Dia" : v === "mes" ? "Mês" : "Sem."}
                </button>
              ))}
            </div>

            {view !== "mes" && (
              <div className="hidden md:flex items-center gap-2">
                {Object.entries(FORMATOS_CONFIG).map(([k, cfg]) => (
                  <div key={k} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                    <span className="text-xs text-gray-500">{cfg.label}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setNovaCampanha(true)} className="hidden md:flex items-center gap-1 text-xs text-orange-600 border border-orange-200 px-2.5 py-1 rounded-lg hover:bg-orange-50">
              <Signal size={11} /> Campanha
            </button>
          </div>
        </div>

        {/* Modal nova campanha */}
        {novaCampanha && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setNovaCampanha(false)}>
            <div className="bg-white rounded-xl p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold text-gray-900 mb-4">Nova Campanha de Tráfego</h3>
              <div className="space-y-3">
                <input value={campForm.nome} onChange={(e) => setCampForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome da campanha" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
                <div className="flex gap-2">
                  <div className="flex-1"><div className="text-xs text-gray-500 mb-1">Início</div><input type="date" value={campForm.dataInicio} onChange={(e) => setCampForm((p) => ({ ...p, dataInicio: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" /></div>
                  <div className="flex-1"><div className="text-xs text-gray-500 mb-1">Fim</div><input type="date" value={campForm.dataFim} onChange={(e) => setCampForm((p) => ({ ...p, dataFim: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" /></div>
                </div>
                <input value={campForm.objetivo} onChange={(e) => setCampForm((p) => ({ ...p, objetivo: e.target.value }))} placeholder="Objetivo (opcional)" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
                <div className="flex gap-2 pt-1">
                  <button onClick={criarCampanha} disabled={!campForm.nome || !campForm.dataInicio || !campForm.dataFim} className="flex-1 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40">Criar campanha</button>
                  <button onClick={() => setNovaCampanha(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MÊS VIEW ===== */}
        {view === "mes" && (
          <div className="flex-1 overflow-auto p-4">
            {/* Campanhas do mês */}
            {campanhasDoPeriodo(inicioMes, fimMes).length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {campanhasDoPeriodo(inicioMes, fimMes).map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5 text-xs bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1 rounded-full font-medium">
                    <Signal size={10} className="text-orange-500" />
                    {c.nome}
                    <span className="text-orange-400">
                      {format(parseISO(c.dataInicio), "d/MM")} — {format(parseISO(c.dataFim), "d/MM")}
                    </span>
                    <button onClick={() => excluirCampanha(c.id)} className="text-orange-400 hover:text-orange-700 ml-0.5"><X size={9} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                <div key={d} className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide py-1">{d}</div>
              ))}
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
              {diasMes.map((dia, idx) => {
                const doMes = dia >= inicioMes && dia <= fimMes;
                const hoje = isToday(dia);
                const eventos = eventosNaDia(dia);
                const isDragOver = mesoDrag && !isSameDay(dia, parseISO(mesoDrag.dataplanejada ?? ""));
                return (
                  <div key={idx}
                    className={`bg-white min-h-[70px] md:min-h-[100px] p-1 md:p-1.5 transition-colors ${isDragOver ? "bg-blue-50" : ""} ${!doMes ? "opacity-40" : ""}`}
                    onPointerUp={() => { if (mesoDrag) mesDrop(dia); }}
                    onPointerEnter={() => { if (mesoDrag) document.body.style.cursor = "copy"; }}
                    onPointerLeave={() => { if (mesoDrag) document.body.style.cursor = "grabbing"; }}>
                    {/* Day number */}
                    <button
                      onClick={() => { setRefDate(dia); setView("hoje"); }}
                      className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full mx-auto transition-colors ${hoje ? "bg-gray-900 text-white" : doMes ? "text-gray-700 hover:bg-gray-100" : "text-gray-400 hover:bg-gray-100"}`}>
                      {format(dia, "d")}
                    </button>
                    {/* Add button — navega pro dia no mobile; só visível no hover em desktop */}
                    <button className="w-full text-[10px] text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded py-0.5 transition-colors flex items-center justify-center gap-0.5 mb-1 opacity-0 hover:opacity-100"
                      onClick={() => { setRefDate(dia); setView("hoje"); }}>
                      <Plus size={10} />
                    </button>
                    {/* Events */}
                    <div className="space-y-0.5">
                      {eventos.slice(0, 3).map((ev) => {
                        const cfg = getCfg(ev.formato);
                        const resp = getResponsavelConfig(ev.responsavel ?? "");
                        return (
                          <div key={ev.id}
                            className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded cursor-grab active:cursor-grabbing relative overflow-hidden"
                            style={{ backgroundColor: cfg.bg, borderLeft: `3px solid ${cfg.border}` }}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              document.body.style.cursor = "grabbing";
                              setMesDrag(ev);
                            }}
                            onClick={(e) => { e.stopPropagation(); if (!mesoDrag) abrirDetalhe(ev); }}>
                            {isAlertaGravacao(ev) && (
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" title="Não gravado — próximas 48h" />
                            )}
                            <span className="truncate font-medium flex-1" style={{ color: cfg.text }}>{ev.titulo}</span>
                            {resp && (
                              <div className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0" style={{ backgroundColor: resp.cor }}>{resp.inicial}</div>
                            )}
                          </div>
                        );
                      })}
                      {eventos.length > 3 && (
                        <div className="text-[10px] text-gray-400 text-center">+{eventos.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== HOJE / SEMANA VIEW ===== */}
        {view !== "mes" && (
          <>
            {/* Day headers */}
            <div className="flex border-b border-gray-200 bg-white shrink-0">
              <div style={{ width: TIME_COL }} className="shrink-0" />
              {activeDias.map((dia) => {
                const hoje = isToday(dia);
                return (
                  <button key={dia.toISOString()} onClick={() => { setRefDate(dia); setView("hoje"); }}
                    className="flex-1 py-2 text-center border-l border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{format(dia, "EEE", { locale: ptBR })}</div>
                    <div className={`text-sm font-bold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full mx-auto ${hoje ? "bg-gray-900 text-white" : "text-gray-700"}`}>
                      {format(dia, "d")}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Campanhas row */}
            {campSemana.length > 0 && (
              <div className="flex border-b border-orange-100 bg-orange-50 shrink-0" style={{ minHeight: 28 }}>
                <div style={{ width: TIME_COL }} className="shrink-0 flex items-center justify-end pr-1.5">
                  <Signal size={10} className="text-orange-400" />
                </div>
                <div className="flex-1 relative py-1">
                  {campSemana.map((c) => {
                    const startIdx = activeDias.findIndex((d) => !isBefore(d, parseISO(c.dataInicio)));
                    const endIdx = activeDias.reduce((last, d, i) => !isAfter(d, parseISO(c.dataFim)) ? i : last, -1);
                    if (startIdx < 0 || endIdx < 0) return null;
                    const totalDays = activeDias.length;
                    const left = (startIdx / totalDays) * 100;
                    const width = ((endIdx - startIdx + 1) / totalDays) * 100;
                    return (
                      <div key={c.id}
                        className="absolute top-1 h-5 rounded flex items-center px-2 text-[10px] font-semibold text-white overflow-hidden group cursor-pointer"
                        style={{ left: `${left}%`, width: `calc(${width}% - 4px)`, backgroundColor: "#EA580C" }}
                        onClick={() => excluirCampanha(c.id)}>
                        <span className="truncate">{c.nome}</span>
                        <X size={9} className="ml-1 opacity-0 group-hover:opacity-100 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Time grid */}
            <div className="flex-1 overflow-y-auto" ref={scrollRef}>
              <div className="flex relative" style={{ minHeight: `${(GRID_END - GRID_START + 1) * HOUR_HEIGHT}px` }}>
                {/* Hour labels */}
                <div style={{ width: TIME_COL }} className="shrink-0 relative">
                  {HOURS.map((h) => (
                    <div key={h} className="relative" style={{ height: HOUR_HEIGHT }}>
                      <span className="absolute -top-2.5 right-2 text-[11px] text-gray-400 select-none">{String(h).padStart(2, "0")}:00</span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {activeDias.map((dia, diaIdx) => {
                  const eventos = eventosNaDia(dia);
                  const hoje = isToday(dia);
                  const isTargetCol = drag?.diaIdx === diaIdx;
                  return (
                    <div key={dia.toISOString()} className="flex-1 relative border-l border-gray-100">
                      {HOURS.map((h) => (
                        <div key={h}
                          className="absolute left-0 right-0 border-b border-gray-100 hover:bg-blue-50/20 cursor-pointer group transition-colors"
                          style={{ top: (h - GRID_START) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                          onClick={() => {
                            if (drag) return;
                            if (view === "semana") {
                              setRefDate(dia);
                              setView("hoje");
                            } else {
                              setSelecionado(null);
                              setNovoSlot({ dia, hora: h });
                              setNovoForm((p) => ({ ...p, hora: h, minuto: 0 }));
                            }
                          }}>
                          <div className="absolute top-0.5 right-1 text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity select-none flex items-center gap-0.5">
                            <Plus size={8} />{String(h).padStart(2, "0")}:00
                          </div>
                        </div>
                      ))}

                      {hoje && horaAtual.h >= GRID_START && horaAtual.h <= GRID_END && (
                        <div className="absolute left-0 right-0 z-20 pointer-events-none"
                          style={{ top: (horaAtual.h - GRID_START) * HOUR_HEIGHT + (horaAtual.m / 60) * HOUR_HEIGHT }}>
                          <div className="relative flex items-center">
                            <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                            <div className="flex-1 h-px bg-red-400" />
                          </div>
                        </div>
                      )}

                      {isTargetCol && drag && (
                        <div className="absolute rounded-lg border-2 border-dashed pointer-events-none z-20 transition-all duration-75"
                          style={{
                            top: (drag.hora - GRID_START) * HOUR_HEIGHT + (drag.minuto / 60) * HOUR_HEIGHT + 2,
                            left: 3, right: 3, height: HOUR_HEIGHT - 6,
                            borderColor: getCfg(drag.evento.formato).border,
                            backgroundColor: getCfg(drag.evento.formato).bg, opacity: 0.6,
                          }}>
                          <div className="px-1.5 py-1">
                            <div className="text-[10px] font-semibold" style={{ color: getCfg(drag.evento.formato).text }}>
                              {String(drag.hora).padStart(2, "0")}:{String(drag.minuto).padStart(2, "0")}
                            </div>
                          </div>
                        </div>
                      )}

                      {eventos.map((ev, idx) => {
                        const h = parseISO(ev.dataplanejada!).getHours();
                        const m = parseISO(ev.dataplanejada!).getMinutes();
                        if (h < GRID_START || h > GRID_END) return null;
                        const top = (h - GRID_START) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
                        const cfg = getCfg(ev.formato);
                        const isDraggingThis = drag?.evento.id === ev.id;
                        const resp = getResponsavelConfig(ev.responsavel ?? "");
                        return (
                          <div key={ev.id}
                            onPointerDown={(e) => startDrag(e, ev)}
                            onClick={(e) => { if (drag) return; e.stopPropagation(); abrirDetalhe(ev); }}
                            className="absolute rounded-lg border overflow-hidden z-10 shadow-sm transition-opacity"
                            style={{
                              top: top + 2 + (idx > 0 ? idx * 2 : 0), left: 2, right: 2, height: HOUR_HEIGHT - 6,
                              backgroundColor: cfg.bg, borderColor: cfg.border, borderLeftWidth: 3,
                              opacity: isDraggingThis ? 0.25 : 1,
                              cursor: isDraggingThis ? "grabbing" : "grab",
                              touchAction: "none",
                            }}>
                            <div className="px-1.5 py-1 pointer-events-none select-none h-full relative">
                              <div className="text-[11px] font-semibold leading-tight truncate pr-5" style={{ color: cfg.text }}>{ev.titulo}</div>
                              <div className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: cfg.text, opacity: 0.7 }}>
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                                {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")} · {cfg.label}
                              </div>
                              {resp && (
                                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm" style={{ backgroundColor: resp.cor }}>
                                  {resp.inicial}
                                </div>
                              )}
                              {isAlertaGravacao(ev) && (
                                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shadow-sm animate-pulse" title="Não gravado — próximas 48h">
                                  <span className="text-white text-[7px] font-bold leading-none">!</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ghost drag (semana/hoje) */}
      {drag && (() => {
        const cfg = getCfg(drag.evento.formato);
        return (
          <div className="fixed pointer-events-none z-[200] rounded-lg border shadow-2xl"
            style={{ left: drag.curX - 75, top: drag.curY - drag.offsetY, width: 160, height: HOUR_HEIGHT - 6, backgroundColor: cfg.bg, borderColor: cfg.border, borderLeftWidth: 3, opacity: 0.95 }}>
            <div className="px-2 py-1 select-none">
              <div className="text-[11px] font-semibold truncate" style={{ color: cfg.text }}>{drag.evento.titulo}</div>
              <div className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: cfg.text, opacity: 0.75 }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                {String(drag.hora).padStart(2, "0")}:{String(drag.minuto).padStart(2, "0")} · {cfg.label}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Side panel */}
      {(selecionado || novoSlot) && (
        <div className="w-[380px] shrink-0 border-l border-gray-200 overflow-y-auto bg-white">

          {/* Detalhe */}
          {selecionado && !novoSlot && (() => {
            const dp = selecionado.dataplanejada ? parseISO(selecionado.dataplanejada) : null;
            const dateVal = dp ? toDateInputValue(selecionado.dataplanejada!) : "";
            const horaVal = dp ? dp.getHours() : 12;
            const minVal = dp ? dp.getMinutes() : 0;
            const cfg = getCfg(selecionado.formato);
            return (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />{cfg.label}
                  </span>
                  <button onClick={() => { setSelecionado(null); setConfirmandoExclusao(false); }} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                </div>

                {carregandoDetalhe && <div className="text-xs text-gray-400">Carregando...</div>}

                <div>
                  <div className="text-xs text-gray-500 mb-1">Título</div>
                  <input value={selecionado.titulo} onChange={(e) => atualizarCampoLocal("titulo", e.target.value)}
                    className="w-full text-sm font-semibold border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Formato</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(FORMATOS_CONFIG).map(([key, c]) => {
                      const ativo = selecionado.formato === key;
                      return (
                        <button key={key} onClick={() => salvarCampoImediato("formato", key)}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all"
                          style={ativo ? { backgroundColor: c.bg, borderColor: c.border, color: c.text } : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#6B7280" }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />{c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Data e horário</div>
                  <div className="flex gap-2">
                    <input type="date" value={dateVal} onChange={(e) => atualizarDataHora(e.target.value, horaVal, minVal)}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none" />
                    <select value={horaVal} onChange={(e) => atualizarDataHora(dateVal, Number(e.target.value), minVal)}
                      className="w-18 text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none bg-white">
                      {Array.from({ length: GRID_END - GRID_START + 1 }, (_, i) => i + GRID_START).map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, "0")}h</option>
                      ))}
                    </select>
                    <select value={minVal} onChange={(e) => atualizarDataHora(dateVal, horaVal, Number(e.target.value))}
                      className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none bg-white">
                      {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Status editorial</div>
                  <select value={selecionado.status} onChange={(e) => salvarCampoImediato("status", e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none bg-white">
                    {STATUS_LIST_EDITORIAL.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>)}
                  </select>
                </div>

                {temas.length > 0 && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tema</div>
                    <select value={selecionado.temaId ?? ""} onChange={(e) => salvarCampoImediato("temaId", e.target.value || null)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none bg-white">
                      <option value="">Sem tema</option>
                      {temas.map((t) => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <div className="text-xs text-gray-500 mb-1">Objetivo</div>
                  <input value={selecionado.objetivo ?? ""} onChange={(e) => atualizarCampoLocal("objetivo", e.target.value)}
                    placeholder="Objetivo deste conteúdo"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none" />
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Etapa do funil</div>
                  <div className="flex gap-1.5">
                    {ETAPAS.map((et) => (
                      <button key={et.value} onClick={() => salvarCampoImediato("etapaFunil", et.value)}
                        className={`flex-1 text-[11px] py-1.5 rounded-lg border font-medium transition-all ${selecionado.etapaFunil === et.value ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"}`}>
                        {et.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Responsável</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {RESPONSAVEIS.map((r) => {
                      const ativo = selecionado.responsavel === r.nome;
                      return (
                        <button key={r.nome} onClick={() => salvarCampoImediato("responsavel", ativo ? "" : r.nome)}
                          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border font-medium transition-all"
                          style={ativo ? { backgroundColor: r.bg, borderColor: r.cor, color: r.cor } : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#6B7280" }}>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: r.cor }}>{r.inicial}</div>
                          {r.nome}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Roteiro */}
                <div className="border-t border-gray-100 pt-3">
                  <button onClick={() => setMostrarRoteiro((v) => !v)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900">
                    <span>Roteiro</span>{mostrarRoteiro ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {mostrarRoteiro && (
                    <div className="mt-2">
                      {editandoRoteiro ? (
                        <>
                          <textarea value={roteiroTemp} onChange={(e) => setRoteiroTemp(e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none min-h-[120px] leading-relaxed resize-y" />
                          <div className="flex gap-2 mt-1.5">
                            <button onClick={salvarRoteiro} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg">Salvar</button>
                            <button onClick={() => setEditandoRoteiro(false)} className="text-xs text-gray-500">Cancelar</button>
                          </div>
                        </>
                      ) : (
                        <div className="relative group">
                          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap border border-gray-100">
                            {selecionado.roteiro || <span className="text-gray-400 italic">Sem roteiro</span>}
                          </div>
                          <button onClick={() => { setRoteiroTemp(selecionado.roteiro ?? ""); setEditandoRoteiro(true); }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white rounded border border-gray-200 text-gray-400"><Pencil size={11} /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Legenda */}
                <div className="border-t border-gray-100 pt-3">
                  <button onClick={() => setMostrarLegenda((v) => !v)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-900">
                    <span>Legenda</span>{mostrarLegenda ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {mostrarLegenda && (
                    <div className="mt-2">
                      {editandoLegenda ? (
                        <>
                          <textarea value={legendaTemp} onChange={(e) => setLegendaTemp(e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none min-h-[80px] leading-relaxed resize-y" />
                          <div className="flex gap-2 mt-1.5">
                            <button onClick={salvarLegenda} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg">Salvar</button>
                            <button onClick={() => setEditandoLegenda(false)} className="text-xs text-gray-500">Cancelar</button>
                          </div>
                        </>
                      ) : (
                        <div className="relative group">
                          <div className="bg-purple-50 rounded-lg p-3 text-xs text-gray-600 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap border border-purple-100">
                            {selecionado.legenda || <span className="text-gray-400 italic">Sem legenda</span>}
                          </div>
                          <button onClick={() => { setLegendaTemp(selecionado.legenda ?? ""); setEditandoLegenda(true); }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white rounded border border-gray-200 text-gray-400"><Pencil size={11} /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tráfego Pago */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                      <Signal size={12} className="text-orange-500" /> Tráfego Pago
                    </div>
                    <button onClick={() => salvarCampoImediato("trafegoAtivo", !selecionado.trafegoAtivo)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${selecionado.trafegoAtivo ? "bg-orange-500" : "bg-gray-200"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${selecionado.trafegoAtivo ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                  {selecionado.trafegoAtivo && (
                    <div className="space-y-2 pl-2 border-l-2 border-orange-200">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Status da campanha</div>
                        <select value={selecionado.trafegoStatus ?? ""} onChange={(e) => salvarCampoImediato("trafegoStatus", e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none bg-white">
                          <option value="">Selecionar</option>
                          {TRAFEGO_STATUS_LIST.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">Início</div>
                          <input type="date" value={selecionado.trafegoInicio ? toDateInputValue(selecionado.trafegoInicio) : ""}
                            onChange={(e) => salvarCampoImediato("trafegoInicio", e.target.value ? new Date(e.target.value + "T12:00:00").toISOString() : null)}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">Fim</div>
                          <input type="date" value={selecionado.trafegoFim ? toDateInputValue(selecionado.trafegoFim) : ""}
                            onChange={(e) => salvarCampoImediato("trafegoFim", e.target.value ? new Date(e.target.value + "T12:00:00").toISOString() : null)}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Objetivo</div>
                        <input value={selecionado.trafegoObjetivo ?? ""} onChange={(e) => atualizarCampoLocal("trafegoObjetivo", e.target.value)}
                          placeholder="Objetivo da campanha" className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Observações</div>
                        <textarea value={selecionado.trafegoObs ?? ""} onChange={(e) => atualizarCampoLocal("trafegoObs", e.target.value)}
                          placeholder="Observações adicionais" className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none resize-none h-16" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Produção */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Produção</div>
                  <div className="space-y-1.5">
                    {PIPELINE_STEPS.map(({ field, label, icon: Icon }) => {
                      const feito = selecionado[field];
                      return (
                        <button key={field} disabled={salvando === field}
                          onClick={() => togglePipeline(selecionado.id, field, !feito)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${feito ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${feito ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`}>
                            {feito && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <Icon size={12} className="shrink-0" />
                          <span>{label}</span>
                          {feito && <span className="ml-auto text-emerald-500 text-[10px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ações */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <button onClick={removerDoCalendario}
                    className="w-full flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 border border-gray-200">
                    <CalendarX size={13} /> Remover do calendário
                  </button>
                  {!confirmandoExclusao ? (
                    <button onClick={() => setConfirmandoExclusao(true)}
                      className="w-full flex items-center gap-2 text-xs text-red-500 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 border border-red-100">
                      <Trash2 size={13} /> Excluir permanentemente
                    </button>
                  ) : (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-xs text-red-700 mb-2">Tem certeza? Não pode ser desfeito.</p>
                      <div className="flex gap-2">
                        <button onClick={excluirConteudo} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg">Excluir</button>
                        <button onClick={() => setConfirmandoExclusao(false)} className="text-xs text-gray-500">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Novo conteúdo */}
          {novoSlot && (
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Novo conteúdo</h3>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{format(novoSlot.dia, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
                </div>
                <button onClick={() => setNovoSlot(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <input autoFocus value={novoForm.titulo} onChange={(e) => setNovoForm((p) => ({ ...p, titulo: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && criarConteudo()}
                  placeholder="Título do conteúdo"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Horário</div>
                  <div className="flex gap-2">
                    <select value={novoForm.hora} onChange={(e) => setNovoForm((p) => ({ ...p, hora: Number(e.target.value) }))} className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none bg-white">
                      {Array.from({ length: GRID_END - GRID_START + 1 }, (_, i) => i + GRID_START).map((h) => (
                        <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                      ))}
                    </select>
                    <select value={novoForm.minuto} onChange={(e) => setNovoForm((p) => ({ ...p, minuto: Number(e.target.value) }))} className="w-20 text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none bg-white">
                      {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{String(m).padStart(2, "0")}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1.5">Formato</div>
                  <div className="space-y-1.5">
                    {Object.entries(FORMATOS_CONFIG).map(([key, cfg]) => {
                      const ativo = novoForm.formato === key;
                      return (
                        <button key={key} onClick={() => setNovoForm((p) => ({ ...p, formato: key }))}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                          style={ativo ? { backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.text, borderWidth: 2, borderStyle: "solid" } : { backgroundColor: "white", borderColor: "#E5E7EB", color: "#374151", borderWidth: 1, borderStyle: "solid" }}>
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cfg.dot }} />
                          {cfg.label}
                          {ativo && <span className="ml-auto">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button onClick={criarConteudo} disabled={!novoForm.titulo.trim()}
                  className="w-full text-sm bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center gap-1.5 font-medium">
                  <Plus size={13} />Adicionar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
