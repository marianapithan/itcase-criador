"use client";
import { useEffect, useState } from "react";
import {
  Megaphone, ArrowLeft, ChevronDown, ChevronUp,
  Target, TrendingUp, AlertTriangle, Sparkles, Pencil, CircleCheck,
  CircleAlert, CircleX, Info, Users, ListChecks, Play, CalendarDays,
  Zap, CheckSquare, Square, Check,
} from "lucide-react";
import { FORMATOS_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyBtn } from "@/components/CopyBtn";

// ─── Types ────────────────────────────────────────────────────────────────────

type Conteudo = {
  id: string; titulo: string; formato: string; status: string;
  objetivo?: string; etapaFunil?: string; legenda?: string; dataPublicacao?: string;
  trafegoAtivo: boolean; trafegoStatus?: string; trafegoObjetivo?: string; trafegoObs?: string;
};

type CopyAIDA = {
  numero: 1 | 2 | 3;
  angulo: string;
  atencao: string;
  interesse: string;
  desejo: string;
  acao: string;
  textoCompleto: string;
};

type Plano = {
  personaRapida: string;
  publicoAlvo: { segmentacao: string; interesses: string[]; palavrasChave?: string[]; exclusoes: string };
  nomenclatura: { campanha: string; conjunto: string; anuncio: string };
  saudeIA: string;
  cpas: { empate: number; escala: number; alerta: number; verbaDia: number; investimento: number; ticket: number; dias: number };
  passoAPasso: string[];
  checklist: { id: string; label: string; categoria: string }[];
  copy: { texto: string; angulo: string };
  plataforma: string;
  objetivo: string;
};

type SaudePonto = { tipo: "otimo" | "ok" | "atencao" | "critico" | "info"; texto: string };
type SaudeCampanha = { nivel: "otimo" | "saudavel" | "atencao" | "critico"; pontos: SaudePonto[]; verbaDia: number };

type Fase = "lista" | "aida" | "budget" | "plataforma" | "objetivo" | "plano" | "checklist";

// ─── Constants ────────────────────────────────────────────────────────────────

const TICKETS = [
  { label: "Acessórios (capa, película, fone)", value: 175 },
  { label: "iPhone seminovo (~R$3.000)", value: 3000 },
  { label: "iPad (~R$3.500)", value: 3500 },
  { label: "MacBook (~R$8.000)", value: 8000 },
];

const PLATAFORMAS = [
  { id: "meta",     label: "Meta Ads",     sub: "Facebook & Instagram", cor: "blue",   letra: "M" },
  { id: "google",   label: "Google Ads",   sub: "Pesquisa & Display",   cor: "red",    letra: "G" },
  { id: "youtube",  label: "YouTube Ads",  sub: "Vídeo",                cor: "red",    letra: "Y" },
  { id: "tiktok",   label: "TikTok Ads",   sub: "Vídeo curto",          cor: "gray",   letra: "T" },
  { id: "linkedin", label: "LinkedIn Ads", sub: "B2B",                  cor: "blue",   letra: "in" },
];

const OBJETIVOS: Record<string, { id: string; label: string; desc: string }[]> = {
  meta: [
    { id: "whatsapp",       label: "Mensagens no WhatsApp",  desc: "Pessoas iniciam conversa diretamente com você" },
    { id: "leads",          label: "Geração de leads",       desc: "Cadastros pelo formulário do Meta" },
    { id: "trafego",        label: "Tráfego para o site",    desc: "Cliques para seu site ou landing page" },
    { id: "reconhecimento", label: "Reconhecimento de marca",desc: "Alcance e visibilidade no feed" },
    { id: "engajamento",    label: "Engajamento",            desc: "Curtidas, comentários e compartilhamentos" },
    { id: "vendas",         label: "Vendas no site",         desc: "Conversões com pixel instalado" },
  ],
  google: [
    { id: "pesquisa",       label: "Rede de Pesquisa",       desc: "Anúncios em resultados de busca no Google" },
    { id: "display",        label: "Rede de Display",        desc: "Banners em sites e apps parceiros" },
    { id: "performance-max",label: "Performance Max",        desc: "Campanha automática em todos os canais Google" },
    { id: "leads",          label: "Geração de leads",       desc: "Formulário de contato nos resultados de busca" },
  ],
  youtube: [
    { id: "instream",       label: "In-stream pulável",      desc: "Antes dos vídeos, pode ser pulado após 5s" },
    { id: "shorts",         label: "YouTube Shorts",         desc: "No feed de Shorts (formato vertical)" },
    { id: "discovery",      label: "Vídeo discovery",        desc: "Nos resultados de busca do YouTube" },
  ],
  tiktok: [
    { id: "infeed",         label: "In-Feed Ads",            desc: "No feed de vídeos recomendados" },
    { id: "spark",          label: "Spark Ads",              desc: "Impulsiona um post orgânico existente" },
    { id: "topview",        label: "TopView",                desc: "Primeiro vídeo ao abrir o app" },
  ],
  linkedin: [
    { id: "conteudo",       label: "Conteúdo patrocinado",   desc: "No feed do LinkedIn" },
    { id: "mensagem",       label: "Message Ads",            desc: "Mensagem direta na caixa de entrada" },
    { id: "lead-form",      label: "Lead Gen Forms",         desc: "Formulário de captação embutido" },
  ],
};

const PASSOS_LABELS = ["Conteúdo", "Copies AIDA", "Orçamento", "Plataforma", "Objetivo", "Plano", "Checklist"];
const FASE_STEP: Record<Fase, number> = { lista: 1, aida: 2, budget: 3, plataforma: 4, objetivo: 5, plano: 6, checklist: 7 };

// ─── Health calculator ────────────────────────────────────────────────────────

function calcSaude(inv: number, dias: number, ticket: number): SaudeCampanha {
  const verbaDia = inv / dias;
  const pontos: SaudePonto[] = [];
  let nivel: SaudeCampanha["nivel"] = "saudavel";

  if (verbaDia < 10) { nivel = "critico"; pontos.push({ tipo: "critico", texto: `R$${Math.round(verbaDia)}/dia abaixo do mínimo. O Meta precisa de pelo menos R$15/dia pra aprender. Aumente o investimento ou reduza os dias.` }); }
  else if (verbaDia < 15) { if (nivel === "saudavel") nivel = "atencao"; pontos.push({ tipo: "atencao", texto: `R$${Math.round(verbaDia)}/dia no limite. Vai funcionar, mas o aprendizado será mais lento.` }); }
  else if (verbaDia >= 40) pontos.push({ tipo: "otimo", texto: `R$${Math.round(verbaDia)}/dia: ótimo para testar e escalar rápido.` });
  else pontos.push({ tipo: "ok", texto: `R$${Math.round(verbaDia)}/dia: orçamento sólido.` });

  if (dias < 7) { nivel = "critico"; pontos.push({ tipo: "critico", texto: `${dias} dias é muito curto. Mínimo de 7 dias para o algoritmo aprender.` }); }
  else if (dias < 14) { if (nivel === "saudavel") nivel = "atencao"; pontos.push({ tipo: "atencao", texto: `${dias} dias suficiente para começar, mas dados limitados. Ideal: 21-30 dias.` }); }
  else if (dias >= 21) pontos.push({ tipo: "otimo", texto: `${dias} dias: espaço ideal para aprender e testar criativos.` });
  else pontos.push({ tipo: "ok", texto: `${dias} dias: boa duração.` });

  const valorConversa = ticket * 0.2;
  if (verbaDia > valorConversa) { if (nivel === "saudavel") nivel = "atencao"; pontos.push({ tipo: "atencao", texto: `Cada conversa vale até R$${Math.round(valorConversa)}. Você gasta R$${Math.round(verbaDia)}/dia. Se não converter 1 por dia, não empata.` }); }
  else pontos.push({ tipo: "ok", texto: `Margem boa: cada conversa vale até R$${Math.round(valorConversa)} e você investe R$${Math.round(verbaDia)}/dia.` });

  return { nivel, pontos, verbaDia: Math.round(verbaDia) };
}

// ─── Sub-components ───────────────────────────────────────────────────────────


function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
        <CopyBtn text={value} />
      </div>
      <p className="px-3 py-2.5 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}

function AccordionSec({ titulo, icon: Icon, children, defaultOpen = true }: { titulo: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [aberto, setAberto] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white mb-3">
      <button onClick={() => setAberto(v => !v)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2"><Icon size={13} className="text-gray-400" /><span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{titulo}</span></div>
        {aberto ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {aberto && <div className="border-t border-gray-50 p-4">{children}</div>}
    </div>
  );
}

function SaudeCard({ saude }: { saude: SaudeCampanha }) {
  const cfg = { otimo: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", label: "Ótima", Icon: CircleCheck }, saudavel: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", label: "Saudável", Icon: CircleCheck }, atencao: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", label: "Atenção", Icon: CircleAlert }, critico: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", label: "Ajuste necessário", Icon: CircleX } };
  const { bg, border, text, label, Icon } = cfg[saude.nivel];
  const picoIco: Record<string, React.ElementType> = { otimo: CircleCheck, ok: CircleCheck, atencao: CircleAlert, critico: CircleX, info: Info };
  const picoCor: Record<string, string> = { otimo: "text-green-600", ok: "text-green-600", atencao: "text-amber-600", critico: "text-red-600", info: "text-blue-600" };
  return (
    <div className={`rounded-xl border ${bg} ${border} p-4 mb-4`}>
      <div className="flex items-center gap-2 mb-3"><Icon size={15} className={text} /><span className={`text-sm font-bold ${text}`}>{label}</span><span className={`text-xs ml-auto ${text} opacity-70`}>R${saude.verbaDia}/dia</span></div>
      <div className="space-y-2">{saude.pontos.map((p, i) => { const PIco = picoIco[p.tipo]; return (<div key={i} className="flex gap-2"><PIco size={13} className={`${picoCor[p.tipo]} shrink-0 mt-0.5`} /><p className="text-xs text-gray-700 leading-relaxed">{p.texto}</p></div>); })}</div>
    </div>
  );
}

function ProgressBar({ fase }: { fase: Fase }) {
  const step = FASE_STEP[fase];
  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
      {PASSOS_LABELS.map((label, i) => {
        const num = i + 1;
        const done = num < step;
        const active = num === step;
        return (
          <div key={label} className="flex items-center gap-1 shrink-0">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${active ? "bg-gray-900 text-white" : done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? "bg-white text-gray-900" : done ? "bg-green-500 text-white" : "bg-gray-300 text-gray-500"}`}>{done ? "✓" : num}</span>
              <span className="hidden sm:block">{label}</span>
            </div>
            {i < PASSOS_LABELS.length - 1 && <div className={`w-3 h-px ${done ? "bg-green-300" : "bg-gray-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TrafegoPage() {
  const [fase, setFase] = useState<Fase>("lista");
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState<Conteudo | null>(null);
  const [tabLista, setTabLista] = useState<"todos" | "calendario">("todos");

  // AIDA
  const [copiesAIDA, setCopiesAIDA] = useState<CopyAIDA[]>([]);
  const [copiaEscolhida, setCopiaEscolhida] = useState<CopyAIDA | null>(null);
  const [gerandoAIDA, setGerandoAIDA] = useState(false);

  // Budget
  const [investimento, setInvestimento] = useState("");
  const [dias, setDias] = useState("30");
  const [ticketIdx, setTicketIdx] = useState(0);
  const [ticketCustom, setTicketCustom] = useState("");
  const [dataPublicacao, setDataPublicacao] = useState("");

  // Platform + objetivo
  const [plataforma, setPlataforma] = useState("");
  const [objetivo, setObjetivo] = useState("");

  // Plan
  const [plano, setPlano] = useState<Plano | null>(null);
  const [gerandoPlano, setGerandoPlano] = useState(false);

  // Checklist
  const [checklistDone, setChecklistDone] = useState<Record<string, boolean>>({});

  // Calendário
  const [dataInicioAd, setDataInicioAd] = useState("");
  const [salvandoCalendario, setSalvandoCalendario] = useState(false);
  const [calendarioSalvo, setCalendarioSalvo] = useState(false);

  // Misc
  const [erro, setErro] = useState<string | null>(null);
  const [verbaMensal, setVerbaMensal] = useState(500);
  const [editandoVerba, setEditandoVerba] = useState(false);
  const [verbaInput, setVerbaInput] = useState("");

  useEffect(() => {
    const v = localStorage.getItem("itcase_verba_mensal");
    if (v) setVerbaMensal(Number(v));
    setCarregando(true);
    fetch("/api/conteudos").then(r => r.json()).then((d: Conteudo[]) => setConteudos(d)).finally(() => setCarregando(false));
  }, []);

  function salvarVerba(v: number) { setVerbaMensal(v); localStorage.setItem("itcase_verba_mensal", String(v)); setEditandoVerba(false); }

  const ticketValor = ticketIdx === TICKETS.length ? Number(ticketCustom.replace(",", ".")) || 0 : TICKETS[ticketIdx].value;
  const invNum = Number(investimento.replace(",", ".")) || 0;
  const diasNum = Math.max(1, Number(dias) || 30);
  const saude = invNum > 0 && ticketValor > 0 ? calcSaude(invNum, diasNum, ticketValor) : null;

  async function iniciarAIDA(c: Conteudo) {
    setSelecionado(c);
    setCopiesAIDA([]);
    setCopiaEscolhida(null);
    setErro(null);
    setFase("aida");
    setGerandoAIDA(true);
    try {
      const res = await fetch("/api/trafego/aida", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conteudoId: c.id }) });
      const data = await res.json();
      if (!res.ok) { setErro(data.erro || "Erro ao gerar copies."); return; }
      setCopiesAIDA(data.copies || []);
    } catch { setErro("Erro de conexão ao gerar copies."); }
    finally { setGerandoAIDA(false); }
  }

  function escolherCopia(copy: CopyAIDA) { setCopiaEscolhida(copy); setFase("budget"); }

  async function gerarPlano() {
    if (!selecionado || !copiaEscolhida) return;
    setPlano(null);
    setGerandoPlano(true);
    setErro(null);
    setFase("plano");
    try {
      const res = await fetch("/api/trafego/plano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudoId: selecionado.id, investimento: invNum, ticket: ticketValor, dias: diasNum, plataforma, objetivo, copiaTexto: copiaEscolhida.textoCompleto, copiaAngulo: copiaEscolhida.angulo }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.erro || "Erro ao gerar plano."); return; }
      setPlano(data as Plano);
      setChecklistDone({});
    } catch { setErro("Erro de conexão ao gerar plano."); }
    finally { setGerandoPlano(false); }
  }

  async function salvarNoCalendario() {
    if (!selecionado || !plano || !dataInicioAd) return;
    setSalvandoCalendario(true);
    try {
      const inicio = new Date(dataInicioAd + "T12:00:00");
      const fim = new Date(inicio);
      fim.setDate(fim.getDate() + plano.cpas.dias);
      const plat = PLATAFORMAS.find(p => p.id === plataforma);
      const nomeCampanha = plano.nomenclatura?.campanha || `${selecionado.titulo} · ${plat?.label}`;

      await Promise.all([
        // Cria entrada em CampanhaTrafego (aparece como barra no calendário)
        fetch("/api/campanhas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nomeCampanha,
            dataInicio: inicio.toISOString(),
            dataFim: fim.toISOString(),
            objetivo: `${plat?.label} · ${OBJETIVOS[plataforma]?.find(o => o.id === objetivo)?.label ?? objetivo}`,
            observacoes: `Conteúdo: ${selecionado.titulo} · R$${plano.cpas.investimento} · ${plano.cpas.dias} dias`,
          }),
        }),
        // Atualiza trafegoInicio e trafegoFim no conteúdo
        fetch(`/api/conteudos/${selecionado.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trafegoInicio: inicio.toISOString(),
            trafegoFim: fim.toISOString(),
          }),
        }),
      ]);
      setCalendarioSalvo(true);
    } catch {
      // silencioso — não bloqueia o usuário
    } finally {
      setSalvandoCalendario(false);
    }
  }

  function voltar() {
    setErro(null);
    if (fase === "checklist") { setFase("plano"); return; }
    if (fase === "plano") { setFase("objetivo"); return; }
    if (fase === "objetivo") { setFase("plataforma"); return; }
    if (fase === "plataforma") { setFase("budget"); return; }
    if (fase === "budget") { setFase("aida"); return; }
    if (fase === "aida") { setFase("lista"); setSelecionado(null); setCopiesAIDA([]); return; }
    setFase("lista");
  }

  // ── PHASE: Lista ──────────────────────────────────────────────────────────
  if (fase === "lista") {
    const comCalendario = conteudos.filter(c => c.dataPublicacao);
    const todos = conteudos;
    const lista = tabLista === "calendario" ? comCalendario : todos;
    const ativas = conteudos.filter(c => c.trafegoAtivo);

    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5"><Megaphone size={18} className="text-orange-500" /><h1 className="text-xl md:text-2xl font-semibold text-gray-900">Tráfego Pago</h1></div>
            <p className="text-gray-500 text-sm">Selecione um conteúdo para criar sua campanha.</p>
          </div>
          <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white shrink-0">
            {editandoVerba ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">R$</span>
                <input type="number" className="w-20 text-sm font-bold border-b border-gray-400 outline-none" value={verbaInput} onChange={e => setVerbaInput(e.target.value)} onKeyDown={e => e.key === "Enter" && salvarVerba(Number(verbaInput))} autoFocus />
                <button onClick={() => salvarVerba(Number(verbaInput))} className="text-xs text-orange-600 font-medium">Salvar</button>
                <button onClick={() => setEditandoVerba(false)} className="text-xs text-gray-400">✕</button>
              </div>
            ) : (
              <button onClick={() => { setEditandoVerba(true); setVerbaInput(String(verbaMensal)); }} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <div><div className="text-[11px] text-gray-400 leading-tight">Investimento mensal</div><div className="text-sm font-bold text-gray-900">R$ {verbaMensal.toLocaleString("pt-BR")}</div></div>
                <Pencil size={12} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {ativas.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Campanhas ativas</p>
            <div className="space-y-2">
              {ativas.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 line-clamp-2">{c.titulo}</p><p className="text-xs text-gray-400">{c.trafegoObjetivo}</p></div>
                  <button onClick={() => iniciarAIDA(c)} className="text-xs text-orange-500 font-medium shrink-0">Refazer →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          {(["todos", "calendario"] as const).map(t => (
            <button key={t} onClick={() => setTabLista(t)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${tabLista === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
              {t === "todos" ? "Todos os conteúdos" : "Do calendário"}
            </button>
          ))}
        </div>

        {carregando ? (
          <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" /></div>
        ) : lista.length === 0 ? (
          <div className="text-center py-10 text-gray-300"><Megaphone size={32} className="mx-auto mb-2" /><p className="text-sm">{tabLista === "calendario" ? "Nenhum conteúdo com data no calendário" : "Nenhum conteúdo disponível"}</p></div>
        ) : (
          <div className="space-y-2">
            {lista.map(c => {
              const fmt = FORMATOS_CONFIG[c.formato];
              return (
                <button key={c.id} onClick={() => iniciarAIDA(c)} className="w-full flex items-center gap-3 p-3 border border-gray-100 bg-white rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: fmt?.bg ?? "#F3F4F6", color: fmt?.text ?? "#374151" }}>{(fmt?.label ?? c.formato).slice(0, 2)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{c.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400">{fmt?.label ?? c.formato}</span>
                      <StatusBadge status={c.status} />
                      {c.dataPublicacao && <span className="text-[10px] text-blue-500">{new Date(c.dataPublicacao).toLocaleDateString("pt-BR")}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-orange-500 font-medium shrink-0">Criar anúncio →</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── PHASE: AIDA ──────────────────────────────────────────────────────────
  if (fase === "aida") {
    const anguloCores = ["bg-blue-50 border-blue-200 text-blue-700", "bg-purple-50 border-purple-200 text-purple-700", "bg-green-50 border-green-200 text-green-700"];
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
        <button onClick={voltar} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"><ArrowLeft size={15} />Voltar</button>
        <ProgressBar fase={fase} />

        <div className="flex items-center gap-2 mb-1"><Sparkles size={16} className="text-orange-500" /><h2 className="text-lg font-semibold text-gray-900">Copies AIDA</h2></div>
        <p className="text-sm text-gray-400 mb-5">Para <span className="font-medium text-gray-700">"{selecionado?.titulo}"</span>: escolha uma das 3 versões abaixo.</p>

        {gerandoAIDA && (
          <div className="flex flex-col items-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Gerando 3 copies AIDA…</p>
          </div>
        )}

        {erro && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg mb-4">{erro}</p>}

        {copiesAIDA.length > 0 && (
          <div className="space-y-4">
            {copiesAIDA.map((copy, i) => (
              <div key={copy.numero} className="border border-gray-100 bg-white rounded-2xl overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center">{copy.numero}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${anguloCores[i]}`}>{copy.angulo}</span>
                  </div>
                  <CopyBtn text={copy.textoCompleto} />
                </div>
                <div className="p-4 space-y-2">
                  {([["A: Atenção", copy.atencao], ["I: Interesse", copy.interesse], ["D: Desejo", copy.desejo], ["A: Ação", copy.acao]] as [string, string][]).map(([label, val]) => (
                    <div key={label} className="flex gap-2 text-sm">
                      <span className="text-[10px] font-bold text-gray-400 uppercase pt-0.5 w-20 shrink-0">{label}</span>
                      <span className="text-gray-700">{val}</span>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-gray-50 text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">{copy.textoCompleto}</div>
                </div>
                <div className="px-4 pb-4">
                  <button onClick={() => escolherCopia(copy)} className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
                    Usar esta copy →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── PHASE: Budget ─────────────────────────────────────────────────────────
  if (fase === "budget" && copiaEscolhida) {
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto pb-24 md:pb-8">
        <button onClick={voltar} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"><ArrowLeft size={15} />Voltar</button>
        <ProgressBar fase={fase} />

        <h2 className="text-lg font-semibold text-gray-900 mb-1">Orçamento da campanha</h2>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5">
          <p className="text-[11px] text-orange-600 font-semibold uppercase tracking-wide mb-0.5">Copy selecionada: {copiaEscolhida.angulo}</p>
          <p className="text-sm text-gray-700 leading-relaxed">{copiaEscolhida.textoCompleto}</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">Investimento e duração</label>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[11px] text-gray-400 mb-1.5">Total (R$)</label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span><input type="number" placeholder="Ex: 200" value={investimento} onChange={e => setInvestimento(e.target.value)} className="w-full pl-9 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" /></div>
              </div>
              <div className="w-28">
                <label className="block text-[11px] text-gray-400 mb-1.5">Dias</label>
                <input type="number" placeholder="30" value={dias} min={1} max={90} onChange={e => setDias(e.target.value)} className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 text-center" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-3">Produto anunciado</label>
            <div className="space-y-2">
              {TICKETS.map((t, i) => (
                <button key={t.value} onClick={() => setTicketIdx(i)} className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-sm transition-colors text-left ${ticketIdx === i ? "border-orange-400 bg-orange-50 text-orange-800" : "border-gray-100 hover:border-gray-300 text-gray-700"}`}>
                  <span>{t.label}</span>{ticketIdx === i && <Check size={14} className="text-orange-500 shrink-0" />}
                </button>
              ))}
              <button onClick={() => setTicketIdx(TICKETS.length)} className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-sm transition-colors text-left ${ticketIdx === TICKETS.length ? "border-orange-400 bg-orange-50 text-orange-800" : "border-gray-100 hover:border-gray-300 text-gray-700"}`}>
                <span>Outro valor</span>{ticketIdx === TICKETS.length && <Check size={14} className="text-orange-500" />}
              </button>
              {ticketIdx === TICKETS.length && (
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span><input type="number" placeholder="Ticket médio" value={ticketCustom} onChange={e => setTicketCustom(e.target.value)} className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" autoFocus /></div>
              )}
            </div>
          </div>

          {saude && <SaudeCard saude={saude} />}

          {invNum > 0 && ticketValor > 0 && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Regras calculadas</p>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                {[{ label: "Escala", value: Math.round(ticketValor * 0.2 * 0.7), cor: "text-green-600" }, { label: "Empate", value: Math.round(ticketValor * 0.2), cor: "text-blue-600" }, { label: "Alerta", value: Math.round(ticketValor * 0.2 * 1.35), cor: "text-amber-600" }].map(({ label, value, cor }) => (
                  <div key={label}><div className={`text-base font-bold ${cor}`}>R${value}</div><div className="text-[10px] text-gray-400">{label}</div></div>
                ))}
              </div>
              <p className="text-[11px] text-center text-gray-500">Pausa SÓ no anúncio. Nunca na campanha ou conjunto.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Data de publicação (opcional)</label>
            <p className="text-xs text-gray-400 mb-2">Para adicionar ao calendário de conteúdo.</p>
            <input type="date" value={dataPublicacao} onChange={e => setDataPublicacao(e.target.value)} className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
          </div>

          <button onClick={() => setFase("plataforma")} disabled={!investimento || !ticketValor} className="w-full py-4 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Escolher plataforma →
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE: Plataforma ─────────────────────────────────────────────────────
  if (fase === "plataforma") {
    const corMap: Record<string, string> = { blue: "bg-blue-600", red: "bg-red-500", gray: "bg-gray-800" };
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto pb-24 md:pb-8">
        <button onClick={voltar} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"><ArrowLeft size={15} />Voltar</button>
        <ProgressBar fase={fase} />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Onde vai anunciar?</h2>
        <p className="text-sm text-gray-400 mb-5">Selecione a plataforma. O passo a passo será específico para ela.</p>
        <div className="grid grid-cols-2 gap-3">
          {PLATAFORMAS.map(p => (
            <button key={p.id} onClick={() => { setPlataforma(p.id); setObjetivo(""); setFase("objetivo"); }}
              className={`flex items-center gap-3 p-4 border rounded-2xl text-left transition-all hover:border-gray-400 hover:shadow-sm ${plataforma === p.id ? "border-gray-900 bg-gray-50" : "border-gray-100 bg-white"}`}>
              <div className={`w-9 h-9 rounded-xl ${corMap[p.cor]} text-white text-xs font-bold flex items-center justify-center shrink-0`}>{p.letra}</div>
              <div><p className="text-sm font-semibold text-gray-900">{p.label}</p><p className="text-[11px] text-gray-400">{p.sub}</p></div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── PHASE: Objetivo ───────────────────────────────────────────────────────
  if (fase === "objetivo") {
    const objetivos = OBJETIVOS[plataforma] ?? [];
    const plat = PLATAFORMAS.find(p => p.id === plataforma);
    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto pb-24 md:pb-8">
        <button onClick={voltar} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"><ArrowLeft size={15} />Voltar</button>
        <ProgressBar fase={fase} />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Qual o objetivo?</h2>
        <p className="text-sm text-gray-400 mb-5">Para <span className="font-medium text-gray-700">{plat?.label}</span>: o plano será adaptado ao objetivo escolhido.</p>
        <div className="space-y-2">
          {objetivos.map(obj => (
            <button key={obj.id} onClick={() => { setObjetivo(obj.id); gerarPlano(); }}
              className={`w-full flex items-center justify-between p-4 border rounded-xl text-left transition-all hover:border-gray-400 ${objetivo === obj.id ? "border-gray-900 bg-gray-50" : "border-gray-100 bg-white hover:shadow-sm"}`}>
              <div><p className="text-sm font-semibold text-gray-900">{obj.label}</p><p className="text-xs text-gray-400 mt-0.5">{obj.desc}</p></div>
              <Target size={14} className="text-gray-300 shrink-0 ml-3" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── PHASE: Plano ──────────────────────────────────────────────────────────
  if (fase === "plano") {
    const plat = PLATAFORMAS.find(p => p.id === plataforma);
    if (gerandoPlano || (!plano && !erro)) {
      return (
        <div className="p-4 md:p-8 max-w-xl mx-auto pb-24 md:pb-8">
          <button onClick={voltar} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"><ArrowLeft size={15} />Voltar</button>
          <ProgressBar fase={fase} />
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Gerando plano para <strong>{plat?.label}</strong>…</p>
            <p className="text-xs text-gray-400">Calculando público, nomenclatura e passo a passo</p>
          </div>
        </div>
      );
    }

    if (erro) {
      return (
        <div className="p-4 md:p-8 max-w-xl mx-auto pb-24 md:pb-8">
          <button onClick={voltar} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"><ArrowLeft size={15} />Voltar</button>
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{erro}</p>
          <button onClick={gerarPlano} className="mt-4 w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">Tentar novamente</button>
        </div>
      );
    }

    const saudePlano = plano ? calcSaude(plano.cpas.investimento, plano.cpas.dias, plano.cpas.ticket) : null;

    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-4">
          <button onClick={voltar} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"><ArrowLeft size={15} />Voltar</button>
          <button onClick={() => { setPlano(null); setGerandoPlano(true); gerarPlano(); }} className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-800">
            <Zap size={12} />Regenerar
          </button>
        </div>
        <ProgressBar fase={fase} />

        <div className="flex items-center gap-2 mb-1"><Megaphone size={16} className="text-orange-500" /><h2 className="text-lg font-semibold text-gray-900">Plano da campanha</h2></div>
        <p className="text-xs text-gray-400 mb-5">{plat?.label} · {selecionado?.titulo} · R${plano?.cpas.investimento} / {plano?.cpas.dias} dias</p>

        {saudePlano && <SaudeCard saude={saudePlano} />}

        {plano?.saudeIA && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <p className="text-[11px] font-semibold text-blue-500 uppercase tracking-wide mb-1">Análise da IA</p>
            <p className="text-sm text-blue-800 leading-relaxed">{plano.saudeIA}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[{ label: "Escala", v: plano?.cpas.escala, cor: "text-green-700", bg: "bg-green-50 border-green-200", Icon: TrendingUp }, { label: "Empate", v: plano?.cpas.empate, cor: "text-blue-700", bg: "bg-blue-50 border-blue-200", Icon: Target }, { label: "Alerta", v: plano?.cpas.alerta, cor: "text-amber-700", bg: "bg-amber-50 border-amber-200", Icon: AlertTriangle }].map(({ label, v, cor, bg, Icon }) => (
            <div key={label} className={`border ${bg} rounded-xl p-3 text-center`}><Icon size={13} className={`${cor} mx-auto mb-1`} /><div className={`text-lg font-bold ${cor}`}>R${v}</div><div className="text-[10px] text-gray-500">{label}</div></div>
          ))}
        </div>
        <p className="text-[11px] text-red-500 font-medium mb-5">Pausa SÓ no anúncio. Nunca na campanha ou conjunto.</p>

        <AccordionSec titulo="Copy escolhida" icon={Sparkles}>
          <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2 mb-2"><p className="text-[11px] text-orange-600 font-semibold">{plano?.copy.angulo}</p></div>
          <Campo label="Texto do anúncio" value={plano?.copy.texto ?? ""} />
        </AccordionSec>

        <AccordionSec titulo="Persona & por que vai funcionar" icon={Users}>
          <p className="text-sm text-gray-700 leading-relaxed">{plano?.personaRapida}</p>
        </AccordionSec>

        <AccordionSec titulo="Público alvo" icon={Target} defaultOpen={false}>
          <p className="text-xs text-gray-600 mb-2">{plano?.publicoAlvo?.segmentacao}</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {plano?.publicoAlvo?.interesses?.map(i => <span key={i} className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">{i}</span>)}
          </div>
          {(plano?.publicoAlvo?.palavrasChave?.length ?? 0) > 0 && (
            <div className="mb-2"><p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Palavras-chave</p><div className="flex flex-wrap gap-1.5">{plano?.publicoAlvo?.palavrasChave?.map(k => <span key={k} className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{k}</span>)}</div></div>
          )}
          {plano?.publicoAlvo?.exclusoes && <p className="text-[11px] text-gray-400">Excluir: {plano.publicoAlvo.exclusoes}</p>}
        </AccordionSec>

        <AccordionSec titulo="Nomenclatura" icon={Target} defaultOpen={false}>
          {plano?.nomenclatura && Object.entries(plano.nomenclatura).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3 font-mono text-xs bg-gray-50 px-3 py-2 rounded-lg mb-1">
              <span className="text-gray-400 shrink-0 capitalize">{k}:</span>
              <span className="text-gray-700 truncate">{v}</span>
              <CopyBtn text={v} />
            </div>
          ))}
        </AccordionSec>

        <AccordionSec titulo={`Passo a passo: ${plat?.label}`} icon={ListChecks}>
          <div className="space-y-3">
            {plano?.passoAPasso?.map((p, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-sm text-gray-700 leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">Nasce pausado. Ative manualmente quando estiver pronto.</div>
        </AccordionSec>

        <button onClick={() => setFase("checklist")} className="w-full mt-2 flex items-center justify-center gap-2 py-4 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 transition-colors">
          <CheckSquare size={16} />Ver checklist de publicação →
        </button>
      </div>
    );
  }

  // ── PHASE: Checklist ──────────────────────────────────────────────────────
  if (fase === "checklist" && plano) {
    const categorias = [...new Set(plano.checklist.map(i => i.categoria))];
    const total = plano.checklist.length;
    const feitos = Object.values(checklistDone).filter(Boolean).length;
    const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
    const plat = PLATAFORMAS.find(p => p.id === plataforma);

    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto pb-24 md:pb-8">
        <button onClick={voltar} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"><ArrowLeft size={15} />Voltar</button>
        <ProgressBar fase={fase} />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Checklist de publicação</h2>
          <span className={`text-sm font-bold ${pct === 100 ? "text-green-600" : "text-gray-500"}`}>{feitos}/{total}</span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2 mb-6">
          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>

        {categorias.map(cat => (
          <div key={cat} className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">{cat}</p>
            <div className="space-y-2">
              {plano.checklist.filter(i => i.categoria === cat).map(item => (
                <button key={item.id} onClick={() => setChecklistDone(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${checklistDone[item.id] ? "border-green-200 bg-green-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                  {checklistDone[item.id] ? <CheckSquare size={16} className="text-green-500 shrink-0" /> : <Square size={16} className="text-gray-300 shrink-0" />}
                  <span className={`text-sm ${checklistDone[item.id] ? "text-green-700 line-through decoration-green-300" : "text-gray-700"}`}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {pct === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-4">
            <CircleCheck size={24} className="text-green-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-green-700">Tudo pronto para publicar!</p>
            <p className="text-xs text-green-600 mt-1">Campanha em {plat?.label} · R${plano.cpas.investimento} por {plano.cpas.dias} dias</p>
          </div>
        )}

        {/* Seção de calendário */}
        <div className="border border-blue-100 bg-blue-50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={15} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">Subir ao calendário</span>
          </div>

          {calendarioSalvo ? (
            <div className="flex items-center gap-2 py-2">
              <CircleCheck size={18} className="text-green-500" />
              <div>
                <p className="text-sm font-semibold text-green-700">Campanha adicionada ao calendário!</p>
                {dataInicioAd && (
                  <p className="text-xs text-green-600 mt-0.5">
                    {new Date(dataInicioAd + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    {" → "}
                    {(() => { const f = new Date(dataInicioAd + "T12:00:00"); f.setDate(f.getDate() + plano.cpas.dias); return f.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }); })()}
                    {" · "}{plano.cpas.dias} dias
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-blue-700 mb-3">Defina quando o anúncio vai ao ar. O fim é calculado automaticamente.</p>
              <div className="flex gap-3 items-end mb-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-blue-600 font-semibold mb-1">Início da campanha</label>
                  <input
                    type="date"
                    value={dataInicioAd || dataPublicacao}
                    onChange={e => setDataInicioAd(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2.5 border border-blue-200 bg-white rounded-xl text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-blue-600 font-semibold mb-1">Fim (calculado)</label>
                  <div className="px-3 py-2.5 border border-blue-100 bg-blue-50 rounded-xl text-sm text-blue-700 font-medium">
                    {dataInicioAd
                      ? (() => { const f = new Date(dataInicioAd + "T12:00:00"); f.setDate(f.getDate() + plano.cpas.dias); return f.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }); })()
                      : `+ ${plano.cpas.dias} dias`}
                  </div>
                </div>
              </div>
              <button
                onClick={salvarNoCalendario}
                disabled={!dataInicioAd || salvandoCalendario}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {salvandoCalendario
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Salvando…</>
                  : <><CalendarDays size={15} />Adicionar ao calendário</>}
              </button>
            </>
          )}
        </div>

        <div className="flex gap-3 mt-2">
          <button onClick={() => setFase("plano")} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Play size={14} />Ver plano
          </button>
          <button onClick={() => { setFase("lista"); setSelecionado(null); setCopiesAIDA([]); setCopiaEscolhida(null); setPlano(null); setChecklistDone({}); setInvestimento(""); setDias("30"); setPlataforma(""); setObjetivo(""); setDataInicioAd(""); setCalendarioSalvo(false); }} className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors">
            Nova campanha
          </button>
        </div>
      </div>
    );
  }

  return null;
}
