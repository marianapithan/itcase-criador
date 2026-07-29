"use client";
import { useEffect, useState } from "react";
import {
  ShieldAlert, Plus, ArrowLeft, Sparkles, Trash2, ChevronRight,
  Zap, MessageSquare, FileVideo, Layout, ImageIcon, Mail,
  Phone, HelpCircle, CheckCircle, AlertCircle, BarChart3,
  Copy, Check, CalendarDays, Megaphone, Play,
} from "lucide-react";

type Objecao = {
  id: string;
  texto: string;
  contexto?: string;
  frequencia?: string;
  etapaVenda?: string;
  consegueContornar?: string;
  clienteCompraDepois?: string;
  respostaAtual?: string;
  prioridade?: number;
  raiz?: string;
  respostaCurta?: string;
  prevencao?: string;
  analiseCompleta?: string;
};

type Fase = "lista" | "cadastrar" | "analisando" | "mapa" | "detalhe" | "roteiro" | "gerandoRoteiro";

type RoteiroData = {
  roteiro: Record<string, unknown>;
  formato: string;
  formatoLabel: string;
  objecao: string;
};

const FREQUENCIAS = ["Alta: acontece toda semana", "Média: algumas vezes por mês", "Baixa: raramente"];
const ETAPAS = ["Primeiro contato", "Apresentação do produto", "Negociação de preço", "Fechamento", "Pós-venda"];
const CONTORNA = ["Sim, quase sempre", "Às vezes", "Raramente ou nunca"];
const COMPRA_DEPOIS = ["Sempre ou quase sempre", "Às vezes", "Raramente", "Nunca volta"];

const FORMATOS = [
  { id: "reels",     label: "Reels",           sub: "Vídeo 15-30s",         icon: FileVideo,   cor: "bg-pink-100 text-pink-700 border-pink-200" },
  { id: "carrossel", label: "Carrossel",        sub: "5-7 slides",           icon: Layout,      cor: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "stories",   label: "Stories",          sub: "Sequência",            icon: ImageIcon,   cor: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "post",      label: "Post estático",    sub: "Feed",                 icon: ImageIcon,   cor: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "email",     label: "E-mail",           sub: "Sequência de venda",   icon: Mail,        cor: "bg-green-100 text-green-700 border-green-200" },
  { id: "script",    label: "Script WhatsApp",  sub: "Atendimento",          icon: Phone,       cor: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "faq",       label: "FAQ",              sub: "Perguntas frequentes",  icon: HelpCircle, cor: "bg-gray-100 text-gray-700 border-gray-200" },
];

const PRIORIDADE_COR = [
  "border-red-300 bg-red-50",
  "border-red-200 bg-red-50/60",
  "border-amber-200 bg-amber-50",
  "border-yellow-200 bg-yellow-50",
  "border-gray-200 bg-gray-50",
];
const PRIORIDADE_BADGE = [
  "bg-red-500 text-white",
  "bg-red-400 text-white",
  "bg-amber-500 text-white",
  "bg-yellow-500 text-white",
  "bg-gray-400 text-white",
];

function s(v: unknown): string { return v == null ? "" : String(v); }
function b(v: unknown): boolean { return v != null && v !== "" && v !== false; }

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-700 transition-colors shrink-0">
      {ok ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
      {ok ? "Copiado!" : "Copiar"}
    </button>
  );
}

function renderRoteiro(roteiro: Record<string, unknown>, formato: string) {
  if (formato === "reels") {
    return (
      <div className="space-y-3">
        <div className="bg-gray-900 text-white rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">Gancho (0-3s)</p>
          <p className="text-sm font-semibold">{s(roteiro.gancho)}</p>
        </div>
        {(roteiro.cenas as string[] || []).map((c, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
            <p className="text-sm text-gray-700">{c}</p>
          </div>
        ))}
        {b(roteiro.quebraObjecao) && <div className="bg-green-50 border border-green-200 rounded-lg p-3"><p className="text-[11px] text-green-600 font-semibold mb-0.5">Quebra da objeção</p><p className="text-sm text-green-800">{s(roteiro.quebraObjecao)}</p></div>}
        {b(roteiro.prova) && <div className="bg-blue-50 border border-blue-100 rounded-lg p-3"><p className="text-[11px] text-blue-600 font-semibold mb-0.5">Prova</p><p className="text-sm text-blue-800">{s(roteiro.prova)}</p></div>}
        {b(roteiro.cta) && <div className="bg-orange-50 border border-orange-200 rounded-lg p-3"><p className="text-[11px] text-orange-600 font-semibold mb-0.5">CTA</p><p className="text-sm text-orange-800">{s(roteiro.cta)}</p></div>}
        {b(roteiro.legenda) && (
          <div className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1"><p className="text-[11px] text-gray-400 font-semibold">Legenda</p><CopyBtn text={s(roteiro.legenda)} /></div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{s(roteiro.legenda)}</p>
            {(roteiro.hashtags as string[] || []).length > 0 && <p className="text-xs text-blue-500 mt-1">{(roteiro.hashtags as string[]).join(" ")}</p>}
          </div>
        )}
      </div>
    );
  }

  if (formato === "carrossel") {
    const slides = [roteiro.capa, ...(roteiro.slides as string[] || []), roteiro.encerramento].filter(Boolean);
    return (
      <div className="space-y-2">
        {slides.map((sl, i) => (
          <div key={i} className="flex gap-3 items-start bg-gray-50 rounded-lg p-3">
            <div className="w-7 h-7 rounded-lg bg-gray-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</div>
            <p className="text-sm text-gray-700">{s(sl)}</p>
          </div>
        ))}
        {b(roteiro.cta) && <div className="bg-orange-50 border border-orange-200 rounded-lg p-3"><p className="text-[11px] text-orange-600 font-semibold mb-0.5">CTA</p><p className="text-sm">{s(roteiro.cta)}</p></div>}
        {b(roteiro.legenda) && (
          <div className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1"><p className="text-[11px] text-gray-400 font-semibold">Legenda</p><CopyBtn text={s(roteiro.legenda)} /></div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{s(roteiro.legenda)}</p>
            {(roteiro.hashtags as string[] || []).length > 0 && <p className="text-xs text-blue-500 mt-1">{(roteiro.hashtags as string[]).join(" ")}</p>}
          </div>
        )}
      </div>
    );
  }

  if (formato === "stories") {
    const stories = roteiro.stories as { tipo: string; conteudo?: string; pergunta?: string; opcoes?: string[]; instrucao?: string }[] || [];
    const tipoLabel: Record<string, string> = { texto: "Texto", enquete: "Enquete", caixaPerguntas: "Caixa de perguntas", cta: "CTA" };
    const tipoCor: Record<string, string> = { texto: "bg-gray-100", enquete: "bg-purple-100", caixaPerguntas: "bg-blue-100", cta: "bg-orange-100" };
    return (
      <div className="space-y-2">
        {stories.map((st, i) => (
          <div key={i} className={`rounded-xl p-3 ${tipoCor[st.tipo] || "bg-gray-50"}`}>
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Story {i + 1} · {tipoLabel[st.tipo] || st.tipo}</p>
            {st.conteudo && <p className="text-sm text-gray-800">{st.conteudo}</p>}
            {st.pergunta && <p className="text-sm text-gray-800 font-medium">{st.pergunta}</p>}
            {st.opcoes && <div className="flex gap-2 mt-1">{st.opcoes.map((o, j) => <span key={j} className="text-xs bg-white rounded px-2 py-0.5 font-medium">{o}</span>)}</div>}
            {st.instrucao && <p className="text-sm text-gray-700 italic">{st.instrucao}</p>}
          </div>
        ))}
      </div>
    );
  }

  if (formato === "email") {
    return (
      <div className="space-y-3">
        <div className="border border-gray-100 rounded-lg p-3">
          <p className="text-[11px] text-gray-400 font-semibold mb-0.5">Assunto</p>
          <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-gray-800">{s(roteiro.assunto)}</p><CopyBtn text={s(roteiro.assunto)} /></div>
        </div>
        {b(roteiro.preview) && <div className="border border-gray-100 rounded-lg p-3"><p className="text-[11px] text-gray-400 font-semibold mb-0.5">Preview</p><p className="text-sm text-gray-600 italic">{s(roteiro.preview)}</p></div>}
        {b(roteiro.corpo) && (
          <div className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1"><p className="text-[11px] text-gray-400 font-semibold">Corpo</p><CopyBtn text={s(roteiro.corpo)} /></div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{s(roteiro.corpo)}</p>
          </div>
        )}
        {b(roteiro.ps) && <div className="bg-amber-50 border border-amber-100 rounded-lg p-3"><p className="text-[11px] text-amber-600 font-semibold mb-0.5">PS</p><p className="text-sm text-amber-800">{s(roteiro.ps)}</p></div>}
      </div>
    );
  }

  if (formato === "script") {
    return (
      <div className="space-y-3">
        {b(roteiro.abertura) && <div className="bg-blue-50 border border-blue-100 rounded-lg p-3"><p className="text-[11px] text-blue-600 font-semibold mb-0.5">Abertura</p><p className="text-sm text-blue-800">{s(roteiro.abertura)}</p></div>}
        {(roteiro.desenvolvimento as string[] || []).map((f, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="text-[10px] font-bold text-gray-400 pt-0.5 w-4 shrink-0">{i + 1}</span>
            <p className="text-gray-700">{f}</p>
          </div>
        ))}
        {b(roteiro.quebraObjecao) && <div className="bg-green-50 border border-green-200 rounded-lg p-3"><p className="text-[11px] text-green-600 font-semibold mb-0.5">Virada: quebrando a objeção</p><p className="text-sm text-green-800">{s(roteiro.quebraObjecao)}</p></div>}
        {b(roteiro.fechamento) && <div className="bg-orange-50 border border-orange-100 rounded-lg p-3"><p className="text-[11px] text-orange-600 font-semibold mb-0.5">Fechamento</p><p className="text-sm text-orange-800">{s(roteiro.fechamento)}</p></div>}
      </div>
    );
  }

  if (formato === "faq") {
    return (
      <div className="space-y-3">
        {b(roteiro.pergunta) && <div className="bg-gray-50 border border-gray-200 rounded-lg p-3"><p className="text-[11px] text-gray-500 font-semibold mb-0.5">Pergunta do cliente</p><p className="text-sm font-semibold text-gray-800">{s(roteiro.pergunta)}</p></div>}
        {b(roteiro.resposta) && (
          <div className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1"><p className="text-[11px] text-gray-400 font-semibold">Resposta</p><CopyBtn text={s(roteiro.resposta)} /></div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{s(roteiro.resposta)}</p>
          </div>
        )}
        {b(roteiro.dica) && <div className="bg-blue-50 border border-blue-100 rounded-lg p-3"><p className="text-[11px] text-blue-600 font-semibold mb-0.5">Dica pra quem responde</p><p className="text-sm text-blue-800">{s(roteiro.dica)}</p></div>}
      </div>
    );
  }

  // post
  return (
    <div className="space-y-3">
      {b(roteiro.titulo) && <div className="bg-gray-900 text-white rounded-xl p-4"><p className="text-sm font-bold">{s(roteiro.titulo)}</p></div>}
      {b(roteiro.corpo) && (
        <div className="border border-gray-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1"><p className="text-[11px] text-gray-400 font-semibold">Corpo</p><CopyBtn text={s(roteiro.corpo)} /></div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{s(roteiro.corpo)}</p>
        </div>
      )}
      {b(roteiro.cta) && <div className="bg-orange-50 border border-orange-200 rounded-lg p-3"><p className="text-[11px] text-orange-600 font-semibold mb-0.5">CTA</p><p className="text-sm">{s(roteiro.cta)}</p></div>}
      {b(roteiro.legenda) && (
        <div className="border border-gray-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1"><p className="text-[11px] text-gray-400 font-semibold">Legenda Instagram</p><CopyBtn text={s(roteiro.legenda)} /></div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{s(roteiro.legenda)}</p>
          {(roteiro.hashtags as string[] || []).length > 0 && <p className="text-xs text-blue-500 mt-1">{(roteiro.hashtags as string[]).join(" ")}</p>}
        </div>
      )}
    </div>
  );
}

export default function ObjecoesPage() {
  const [fase, setFase] = useState<Fase>("lista");
  const [objecoes, setObjecoes] = useState<Objecao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [novaObjecao, setNovaObjecao] = useState("");
  const [novoContexto, setNovoContexto] = useState("");
  const [etapaCadastro, setEtapaCadastro] = useState(0);
  const [metaFreq, setMetaFreq] = useState("");
  const [metaEtapa, setMetaEtapa] = useState("");
  const [metaContorna, setMetaContorna] = useState("");
  const [metaCompra, setMetaCompra] = useState("");
  const [metaResposta, setMetaResposta] = useState("");
  const [salvandoObjecao, setSalvandoObjecao] = useState(false);

  const [objecaoAtiva, setObjecaoAtiva] = useState<Objecao | null>(null);
  const [formatoEscolhido, setFormatoEscolhido] = useState("");
  const [roteiroData, setRoteiroData] = useState<RoteiroData | null>(null);
  const [calendarioSalvo, setCalendarioSalvo] = useState(false);

  useEffect(() => { carregarObjecoes(); }, []);

  async function carregarObjecoes() {
    setCarregando(true);
    const r = await fetch("/api/objecoes").then(r => r.json()).catch(() => []);
    setObjecoes(Array.isArray(r) ? r : []);
    setCarregando(false);
  }

  async function salvarObjecao() {
    if (!novaObjecao.trim()) return;
    setSalvandoObjecao(true);
    await fetch("/api/objecoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: novaObjecao.trim(), contexto: novoContexto.trim() || null, frequencia: metaFreq, etapaVenda: metaEtapa, consegueContornar: metaContorna, clienteCompraDepois: metaCompra, respostaAtual: metaResposta || null }),
    });
    await carregarObjecoes();
    setNovaObjecao(""); setNovoContexto(""); setMetaFreq(""); setMetaEtapa(""); setMetaContorna(""); setMetaCompra(""); setMetaResposta("");
    setEtapaCadastro(0);
    setSalvandoObjecao(false);
    setFase("lista");
  }

  async function deletarObjecao(id: string) {
    await fetch(`/api/objecoes/${id}`, { method: "DELETE" });
    setObjecoes(prev => prev.filter(o => o.id !== id));
  }

  async function analisarTodas() {
    setFase("analisando");
    setErro(null);
    const r = await fetch("/api/objecoes/analisar", { method: "POST" }).then(r => r.json()).catch(() => ({ erro: "Erro de conexão" }));
    if (r.erro) { setErro(r.erro); setFase("lista"); return; }
    setObjecoes(Array.isArray(r) ? r : []);
    setFase("mapa");
  }

  async function gerarRoteiro() {
    if (!objecaoAtiva || !formatoEscolhido) return;
    setFase("gerandoRoteiro");
    setRoteiroData(null);
    setErro(null);
    const r = await fetch(`/api/objecoes/${objecaoAtiva.id}/roteiro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formato: formatoEscolhido }),
    }).then(r => r.json()).catch(() => ({ erro: "Erro de conexão" }));
    if (r.erro) { setErro(r.detalhe ? `${r.erro}: ${r.detalhe}` : r.erro); setFase("roteiro"); return; }
    setRoteiroData(r);
    setFase("roteiro");
  }

  async function enviarParaCalendario() {
    if (!objecaoAtiva || !roteiroData) return;
    const fmtLabel = FORMATOS.find(f => f.id === roteiroData.formato)?.label || roteiroData.formato;
    await fetch("/api/conteudos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo: `[Objeção] ${objecaoAtiva.texto} — ${fmtLabel}`,
        formato: roteiroData.formato === "reels" ? "Reels" : roteiroData.formato === "carrossel" ? "Carrossel" : roteiroData.formato === "stories" ? "Story" : "Post",
        status: "IDEIA",
        objetivo: "Quebra de objeção",
        etapaFunil: "Consideração",
        legenda: typeof roteiroData.roteiro.legenda === "string" ? roteiroData.roteiro.legenda : "",
      }),
    }).catch(() => {});
    setCalendarioSalvo(true);
  }

  // ── FASE: Lista ──────────────────────────────────────────────────────────────
  if (fase === "lista" || fase === "analisando") {
    const temMapa = objecoes.some(o => o.prioridade != null);
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5"><ShieldAlert size={18} className="text-red-500" /><h1 className="text-xl md:text-2xl font-semibold text-gray-900">Mapa de Objeções</h1></div>
            <p className="text-gray-500 text-sm">Identifique por que você perde vendas e como contornar cada objeção.</p>
          </div>
        </div>

        {erro && <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{erro}</p>}

        {fase === "analisando" && (
          <div className="flex flex-col items-center py-12 gap-3 mb-6">
            <div className="w-10 h-10 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">IA analisando {objecoes.length} objeções e calculando prioridades…</p>
          </div>
        )}

        {objecoes.length === 0 && fase !== "analisando" ? (
          <div className="text-center py-12">
            <ShieldAlert size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 mb-6">Nenhuma objeção cadastrada ainda.<br />Adicione pelo menos 3 para gerar o mapa.</p>
            <button onClick={() => setFase("cadastrar")} className="flex items-center gap-2 mx-auto px-5 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
              <Plus size={16} />Adicionar primeira objeção
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {objecoes.map((o, i) => (
                <div key={o.id} className="flex items-center gap-3 p-3 border border-gray-100 bg-white rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                  <p className="flex-1 text-sm text-gray-800 truncate">"{o.texto}"</p>
                  {o.prioridade != null && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PRIORIDADE_BADGE[Math.min(o.prioridade - 1, 4)]}`}>P{o.prioridade}</span>}
                  <button onClick={() => deletarObjecao(o.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setFase("cadastrar")} className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                <Plus size={14} />Adicionar
              </button>
              {objecoes.length >= 3 && (
                <button onClick={analisarTodas} disabled={fase === "analisando"} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50">
                  <Sparkles size={15} />
                  {temMapa ? "Reanalisar com IA" : "Analisar e gerar mapa"}
                </button>
              )}
              {temMapa && (
                <button onClick={() => setFase("mapa")} className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors">
                  <BarChart3 size={14} />Ver mapa
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── FASE: Cadastrar ──────────────────────────────────────────────────────────
  if (fase === "cadastrar") {
    const perguntas = [
      { label: "Qual a frase exata que o cliente usou?", tipo: "texto" },
      { label: "Conta o contexto completo dessa situação", tipo: "textareaContexto" },
      { label: "Com que frequência você ouve isso?", tipo: "opcoes", opts: FREQUENCIAS },
      { label: "Em qual etapa da venda ela aparece?", tipo: "opcoes", opts: ETAPAS },
      { label: "Você consegue contornar essa objeção?", tipo: "opcoes", opts: CONTORNA },
      { label: "O cliente costuma comprar depois da sua resposta?", tipo: "opcoes", opts: COMPRA_DEPOIS },
      { label: "Como você responde hoje? (opcional)", tipo: "textareaOpcional" },
    ];
    const TOTAL = perguntas.length;
    const perguntaAtual = perguntas[etapaCadastro];
    const valores = ["", "", metaFreq, metaEtapa, metaContorna, metaCompra, metaResposta];
    const setores: React.Dispatch<React.SetStateAction<string>>[] = [setNovaObjecao, setNovoContexto, setMetaFreq, setMetaEtapa, setMetaContorna, setMetaCompra, setMetaResposta];
    const podeAvancar =
      etapaCadastro === TOTAL - 1 ? true :
      etapaCadastro === 0 ? novaObjecao.trim().length > 0 :
      etapaCadastro === 1 ? novoContexto.trim().length > 0 :
      valores[etapaCadastro].length > 0;

    function avancar() {
      if (etapaCadastro < TOTAL - 1) { setEtapaCadastro(e => e + 1); return; }
      salvarObjecao();
    }

    return (
      <div className="p-4 md:p-8 max-w-xl mx-auto pb-24 md:pb-8">
        <button onClick={() => { setFase("lista"); setEtapaCadastro(0); setNovaObjecao(""); setNovoContexto(""); setMetaFreq(""); setMetaEtapa(""); setMetaContorna(""); setMetaCompra(""); setMetaResposta(""); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft size={15} />Voltar
        </button>

        <div className="mb-6">
          <div className="flex gap-1 mb-4">
            {Array.from({ length: TOTAL }, (_, i) => (
              <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= etapaCadastro ? "bg-gray-900" : "bg-gray-100"}`} />
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium">Pergunta {etapaCadastro + 1} de {TOTAL}</p>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">{perguntaAtual.label}</h2>

        {perguntaAtual.tipo === "texto" && (
          <div>
            <input
              type="text"
              placeholder='Ex: "Tá caro", "Vou pensar", "Meu amigo vende mais barato"'
              value={novaObjecao}
              onChange={e => setNovaObjecao(e.target.value)}
              onKeyDown={e => e.key === "Enter" && podeAvancar && avancar()}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-2">Escreva exatamente como o cliente fala.</p>
          </div>
        )}

        {perguntaAtual.tipo === "textareaContexto" && (
          <div>
            <p className="text-sm text-gray-500 mb-3">Descreva a situação completa: onde estava, o que o cliente disse, como foi o tom, o que aconteceu antes e depois. <strong className="text-gray-700">Quanto mais detalhe, melhor a análise da IA.</strong></p>
            <textarea
              rows={6}
              placeholder={"Ex: A cliente entrou na loja, olhou os iPhones por uns 15 minutos, perguntou o preço do 15 Pro e quando eu falei R$7.500 ela deu uma risadinha nervosa e disse 'Nossa, tá caro demais, não esperava tanto'. Ela já estava saindo quando perguntei se ela tinha visto o modelo anterior, mas ela falou que ia pensar e foi embora. Nunca mais voltou."}
              value={novoContexto}
              onChange={e => setNovoContexto(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 resize-none"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-2">Inclua o que a pessoa disse, o clima da conversa e o que aconteceu depois.</p>
          </div>
        )}

        {perguntaAtual.tipo === "opcoes" && (
          <div className="space-y-2">
            {(perguntaAtual.opts ?? []).map(opt => (
              <button key={opt} onClick={() => { setores[etapaCadastro](opt); setTimeout(() => avancar(), 200); }}
                className={`w-full flex items-center justify-between p-3.5 border rounded-xl text-left text-sm transition-all ${valores[etapaCadastro] === opt ? "border-gray-900 bg-gray-900 text-white" : "border-gray-100 bg-white text-gray-700 hover:border-gray-300"}`}>
                <span>{opt}</span>
                {valores[etapaCadastro] === opt && <Check size={14} />}
              </button>
            ))}
          </div>
        )}

        {perguntaAtual.tipo === "textareaOpcional" && (
          <textarea
            rows={3}
            placeholder="Ex: Falo que a qualidade compensa... (ou deixe em branco)"
            value={metaResposta}
            onChange={e => setMetaResposta(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 resize-none"
          />
        )}

        {perguntaAtual.tipo !== "opcoes" && (
          <button onClick={avancar} disabled={!podeAvancar || salvandoObjecao}
            className="w-full mt-5 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
            {salvandoObjecao ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Salvando…</> : etapaCadastro < TOTAL - 1 ? "Próxima pergunta →" : "Salvar objeção"}
          </button>
        )}
      </div>
    );
  }

  // ── FASE: Mapa ───────────────────────────────────────────────────────────────
  if (fase === "mapa") {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setFase("lista")} className="text-gray-400 hover:text-gray-700 transition-colors"><ArrowLeft size={18} /></button>
            <h2 className="text-lg font-semibold text-gray-900">Mapa de Objeções</h2>
          </div>
          <button onClick={() => setFase("cadastrar")} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={12} />Adicionar
          </button>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5 flex items-center gap-2">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-700">Objeções em vermelho são as que mais fazem você perder vendas. Resolva na ordem.</p>
        </div>

        <div className="space-y-3">
          {objecoes.map((o) => {
            const pIdx = Math.min((o.prioridade ?? 5) - 1, 4);
            return (
              <button key={o.id} onClick={() => { setObjecaoAtiva(o); setFase("detalhe"); setFormatoEscolhido(""); setRoteiroData(null); setCalendarioSalvo(false); }}
                className={`w-full text-left border ${PRIORIDADE_COR[pIdx]} rounded-2xl p-4 hover:shadow-sm transition-all`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PRIORIDADE_BADGE[pIdx]}`}>#{o.prioridade ?? "—"}</span>
                    <p className="text-sm font-semibold text-gray-900">"{o.texto}"</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-400 shrink-0 mt-0.5" />
                </div>
                {o.raiz && <p className="text-xs text-gray-600 leading-relaxed ml-8"><span className="font-medium text-gray-400">Raiz:</span> {o.raiz}</p>}
                <div className="flex items-center gap-3 mt-2 ml-8">
                  {o.frequencia && <span className="text-[10px] text-gray-400">{o.frequencia.split(/\s*[—:]\s*/)[0]}</span>}
                  {o.etapaVenda && <span className="text-[10px] text-gray-400">· {o.etapaVenda}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── FASE: Detalhe / Roteiro ───────────────────────────────────────────────────
  if (objecaoAtiva && (fase === "detalhe" || fase === "roteiro" || fase === "gerandoRoteiro")) {
    const pIdx = Math.min((objecaoAtiva.prioridade ?? 5) - 1, 4);

    if (fase === "detalhe") {
      return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
          <button onClick={() => setFase("mapa")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"><ArrowLeft size={15} />Mapa</button>

          <div className={`border ${PRIORIDADE_COR[pIdx]} rounded-2xl p-4 mb-5`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PRIORIDADE_BADGE[pIdx]}`}>Prioridade #{objecaoAtiva.prioridade ?? "—"}</span>
            </div>
            <p className="text-base font-bold text-gray-900">"{objecaoAtiva.texto}"</p>
          </div>

          {objecaoAtiva.contexto && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Contexto da situação</p>
              <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 leading-relaxed italic">{objecaoAtiva.contexto}</p>
            </div>
          )}

          {objecaoAtiva.raiz && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Raiz verdadeira</p>
              <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">{objecaoAtiva.raiz}</p>
            </div>
          )}

          {objecaoAtiva.respostaCurta && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Resposta rápida para WhatsApp</p>
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-green-800 leading-relaxed flex-1">{objecaoAtiva.respostaCurta}</p>
                  <CopyBtn text={objecaoAtiva.respostaCurta} />
                </div>
              </div>
            </div>
          )}

          {objecaoAtiva.prevencao && (
            <div className="mb-5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Como prevenir com conteúdo</p>
              <p className="text-sm text-gray-700 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 leading-relaxed">{objecaoAtiva.prevencao}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-3">
            {objecaoAtiva.frequencia && <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400 font-semibold">Frequência</p><p className="text-xs text-gray-700 mt-0.5">{objecaoAtiva.frequencia.split(/\s*[—:]\s*/)[0]}</p></div>}
            {objecaoAtiva.etapaVenda && <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400 font-semibold">Etapa da venda</p><p className="text-xs text-gray-700 mt-0.5">{objecaoAtiva.etapaVenda}</p></div>}
            {objecaoAtiva.consegueContornar && <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400 font-semibold">Contorna hoje</p><p className="text-xs text-gray-700 mt-0.5">{objecaoAtiva.consegueContornar.split(",")[0]}</p></div>}
            {objecaoAtiva.clienteCompraDepois && <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[10px] text-gray-400 font-semibold">Compra depois</p><p className="text-xs text-gray-700 mt-0.5">{objecaoAtiva.clienteCompraDepois.split(" ou ")[0]}</p></div>}
          </div>

          <div className="border border-gray-100 rounded-2xl p-4 mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">Transformar esta objeção em:</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setFase("roteiro")} className="flex items-center gap-2 px-3 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
                <FileVideo size={14} />Roteiro de conteúdo
              </button>
              <a href="/trafego" className="flex items-center gap-2 px-3 py-2.5 border border-orange-200 bg-orange-50 text-orange-700 rounded-xl text-sm font-semibold hover:bg-orange-100 transition-colors">
                <Megaphone size={14} />Campanha de anúncio
              </a>
            </div>
          </div>
        </div>
      );
    }

    if (fase === "roteiro" && !roteiroData) {
      return (
        <div className="p-4 md:p-8 max-w-xl mx-auto pb-24 md:pb-8">
          <button onClick={() => setFase("detalhe")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"><ArrowLeft size={15} />Voltar</button>

          <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Objeção</p>
            <p className="text-sm font-semibold text-gray-800">"{objecaoAtiva.texto}"</p>
          </div>

          <h2 className="text-base font-semibold text-gray-900 mb-1">Escolha o formato do conteúdo</h2>
          <p className="text-sm text-gray-400 mb-4">A IA vai criar um roteiro para quebrar essa objeção antes que o cliente a diga.</p>

          {erro && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg mb-3">{erro}</p>}

          <div className="grid grid-cols-2 gap-2">
            {FORMATOS.map(f => {
              const Icon = f.icon;
              return (
                <button key={f.id} onClick={() => setFormatoEscolhido(f.id)}
                  className={`flex items-center gap-2.5 p-3.5 border rounded-xl text-left transition-all hover:shadow-sm ${formatoEscolhido === f.id ? "border-gray-900 bg-gray-900 text-white" : "border-gray-100 bg-white"}`}>
                  <Icon size={16} className={formatoEscolhido === f.id ? "text-white" : "text-gray-400"} />
                  <div>
                    <p className={`text-sm font-semibold ${formatoEscolhido === f.id ? "text-white" : "text-gray-900"}`}>{f.label}</p>
                    <p className={`text-[11px] ${formatoEscolhido === f.id ? "text-white/70" : "text-gray-400"}`}>{f.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button onClick={gerarRoteiro} disabled={!formatoEscolhido}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40">
            <Zap size={15} />Gerar roteiro com IA →
          </button>
        </div>
      );
    }

    if (fase === "gerandoRoteiro") {
      const fmtLabel = FORMATOS.find(f => f.id === formatoEscolhido)?.label || formatoEscolhido;
      return (
        <div className="p-4 md:p-8 max-w-xl mx-auto pb-24 md:pb-8">
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Gerando roteiro de <strong>{fmtLabel}</strong>…</p>
            <p className="text-xs text-gray-400 text-center">Adaptando para quebrar "{objecaoAtiva.texto}"</p>
          </div>
        </div>
      );
    }

    if (fase === "roteiro" && roteiroData) {
      const fmtLabel = FORMATOS.find(f => f.id === roteiroData.formato)?.label || roteiroData.formatoLabel;
      const FmtIcon = FORMATOS.find(f => f.id === roteiroData.formato)?.icon || FileVideo;
      return (
        <div className="p-4 md:p-8 max-w-2xl mx-auto pb-24 md:pb-8">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => { setRoteiroData(null); setFase("roteiro"); }} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"><ArrowLeft size={15} />Trocar formato</button>
            <button onClick={() => { setRoteiroData(null); setFormatoEscolhido(""); setFase("roteiro"); }} className="text-xs text-orange-500 hover:text-orange-700 font-medium">Regenerar</button>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <FmtIcon size={16} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">{fmtLabel}</h2>
          </div>
          <p className="text-xs text-gray-400 mb-5">Quebra a objeção: "{roteiroData.objecao}"</p>

          {erro && <p className="text-sm text-red-500 bg-red-50 border border-red-100 px-3 py-2 rounded-lg mb-3">{erro}</p>}

          {renderRoteiro(roteiroData.roteiro, roteiroData.formato)}

          <div className="flex gap-2 mt-5">
            {calendarioSalvo ? (
              <div className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle size={15} className="text-green-500" />
                <span className="text-sm font-medium text-green-700">Adicionado ao calendário!</span>
              </div>
            ) : (
              <button onClick={enviarParaCalendario} className="flex-1 flex items-center justify-center gap-2 py-3 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors">
                <CalendarDays size={14} />Enviar para calendário
              </button>
            )}
            <button onClick={() => setFase("mapa")} className="flex items-center gap-2 px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Play size={14} />Ver mapa
            </button>
          </div>
        </div>
      );
    }
  }

  return null;
}
