"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Loader2, ChevronRight, ChevronLeft, Sparkles, RotateCcw,
  Building2, User, ArrowRight, Globe, Target, Map, BookOpen,
  CheckCircle2, AlertCircle, Lightbulb, TrendingUp, MessageSquare,
  Heart, Shield, Zap, Eye, Copy, Check,
} from "lucide-react";

// ── Tipos ────────────────────────────────────────────────────────────────

type Respostas = Record<string, string>;

type Fase = "carregando" | "novo" | "entrevista" | "gerando" | "completo";

type Secao = {
  id: string;
  numero: string;
  titulo: string;
  subtitulo: string;
  cor: string;
  icon: React.ElementType;
  perguntas: { campo: string; pergunta: string; exemplo: string }[];
};

// ── Seções da entrevista ──────────────────────────────────────────────────

const SECOES: Secao[] = [
  {
    id: "empresa", numero: "01", titulo: "A Empresa", cor: "#c8d92a",
    subtitulo: "Vamos entender o negócio em profundidade : o que você vende, como vende e qual valor entrega.",
    icon: Building2,
    perguntas: [
      {
        campo: "empresa_produtos",
        pergunta: "O que a empresa vende? Liste todos os produtos e serviços.",
        exemplo: "Ex: iPhones novos e seminovos (todos os modelos a partir do iPhone X), acessórios Apple originais (cabos, carregadores, AirPods, Apple Watch), películas de vidro temperado e fosca, cases e capas, serviços de instalação de película com garantia, limpeza interna de aparelhos, troca de bateria, desbloqueio de operadora.",
      },
      {
        campo: "empresa_como_vende",
        pergunta: "Como funciona a venda? Onde e como o cliente chega até você?",
        exemplo: "Ex: Loja física no Shopping Catuaí com vitrine e atendimento presencial. Também atendo pelo WhatsApp e Instagram Direct. Não tenho loja virtual, mas faço delivery para Londrina. A maioria dos clientes chega por indicação de amigos ou pelo Instagram.",
      },
      {
        campo: "empresa_ticket",
        pergunta: "Qual o ticket médio? Qual o produto mais acessível (entrada) e o mais premium?",
        exemplo: "Ex: Ticket médio R$1.200. Produto de entrada: película + instalação (R$80–120). Produto médio: iPhone 11 ou 12 seminovo (R$1.500–2.800). Produto premium: iPhone 15 Pro Max novo (R$8.000–10.000).",
      },
      {
        campo: "empresa_diferenciais",
        pergunta: "Quais são os diferenciais REAIS que nenhum concorrente tem?",
        exemplo: "Ex: Garantia de tela de 6 meses na película (única na região). iPhones seminovos com IMEI verificado, lacrados e com nota fiscal. Atendimento consultivo — a gente descobre qual iPhone encaixa na vida do cliente, não só no bolso. Suporte pós-venda: se tiver qualquer problema, pode voltar.",
      },
      {
        campo: "empresa_posicionamento",
        pergunta: "Como a empresa se posiciona hoje? E onde quer estar em 12 meses?",
        exemplo: "Ex: Hoje somos conhecidos como loja de celulares e acessórios Apple no shopping. Em 12 meses quero ser a referência em experiência Apple em Londrina — quando alguém pensa em comprar qualquer coisa Apple na cidade, pensa na It Case.",
      },
      {
        campo: "empresa_valores",
        pergunta: "Quais são os valores, a personalidade da marca, a promessa central e a transformação que entrega?",
        exemplo: "Ex: Valores: honestidade, cuidado, qualidade. Personalidade: amiga especialista, acolhedora, direta. Promessa: você vai sair daqui com o produto certo para você, sem arrependimento. Transformação: o cliente chega inseguro com medo de ser enganado e sai confiante sabendo que tomou a decisão certa.",
      },
    ],
  },
  {
    id: "persona", numero: "02", titulo: "A Persona", cor: "#9b8fd4",
    subtitulo: "Vamos desenhar quem é a cliente ideal — do perfil demográfico aos desejos mais profundos.",
    icon: User,
    perguntas: [
      {
        campo: "persona_perfil",
        pergunta: "Quem é a cliente ideal? Descreva em detalhes: idade, sexo, estado civil, profissão, renda, cidade.",
        exemplo: "Ex: Mulher, 26–40 anos, casada ou em relacionamento sério, trabalha com carteira assinada (funcionária pública, administrativa, professora) ou tem negócio próprio pequeno. Tem 1 ou 2 filhos. Renda familiar 4–8 salários mínimos. Mora em Londrina, Cambé, Rolândia ou Ibiporã.",
      },
      {
        campo: "persona_rotina",
        pergunta: "Como é a rotina e o estilo de vida dela? O que ela faz no celular? O que ela consome?",
        exemplo: "Ex: Acorda às 6h, leva filho para escola, trabalha o dia inteiro, usa o celular para trabalho (WhatsApp, planilhas, fotos) e lazer (Instagram, YouTube, Netflix). Vai ao shopping no fim de semana com a família. Segue influencers de moda, família e autodesenvolvimento. Valoriza praticidade e aparência.",
      },
      {
        campo: "persona_objetivos",
        pergunta: "Quais são os objetivos e sonhos dela? E quais são os medos, frustrações e dores (emocionais, financeiras e práticas)?",
        exemplo: "Ex: OBJETIVOS: crescer profissionalmente, dar vida boa para os filhos, se sentir atualizada. MEDOS: ser enganada, pagar caro por algo que quebra. DORES EMOCIONAIS: medo de julgamento por comprar produto ruim. FINANCEIRAS: investir R$5k e se arrepender. PRÁTICAS: ficar sem celular durante conserto.",
      },
      {
        campo: "persona_confianca",
        pergunta: "O que faz ela CONFIAR numa empresa? E o que faz ela DESISTIR de comprar?",
        exemplo: "Ex: CONFIA: loja física estabelecida, boas avaliações no Google, vendedor que sabe o que fala, garantia por escrito, transparência no preço. DESISTE: vendedor que pressiona, preço sem justificativa, demora no atendimento, não consegue resposta para dúvida técnica.",
      },
      {
        campo: "persona_linguagem",
        pergunta: "Como ela se comunica? Que palavras usa? O que odeia ouvir? O que ela pesquisa, salva e comenta?",
        exemplo: "Ex: FALA: 'Tem como parcelar?', 'É garantido que é original?', 'Minha amiga comprou aqui'. ODEIA: 'Posso te ajudar?', 'Aproveite!', 'Última unidade'. PESQUISA: 'iPhone seminovo vale a pena', 'It Case Londrina'. SALVA: comparativos de modelos, dicas de cuidado com celular.",
      },
      {
        campo: "persona_influencia",
        pergunta: "Quem influencia a decisão de compra dela? Que conteúdo ela consome? Quais são os desejos conscientes e inconscientes?",
        exemplo: "Ex: INFLUENCIA: marido/namorado (opina no valor), amiga que comprou e recomendou, influencer de tecnologia. CONSOME: YouTube de reviews, Instagram de lifestyle, grupos de WhatsApp com dicas de promoção. DESEJO CONSCIENTE: um iPhone que funcione bem. INCONSCIENTE: sentir que chegou lá, pertencer.",
      },
    ],
  },
  {
    id: "jornada", numero: "03", titulo: "A Jornada do Cliente", cor: "#6ee7b7",
    subtitulo: "Vamos mapear o caminho que ela percorre — do momento em que percebe o problema até a compra e além.",
    icon: Map,
    perguntas: [
      {
        campo: "jornada_percebe",
        pergunta: "Como ela percebe que precisa comprar? O que a faz começar a pesquisar?",
        exemplo: "Ex: O celular atual começa a travar ou a bateria dura pouco. Viu uma amiga com um iPhone novo e ficou encantada. Ganhou aumento no trabalho e quer se presentear. Tela quebrou e decidiu que dessa vez vai comprar um novo de verdade.",
      },
      {
        campo: "jornada_trava",
        pergunta: "O que ela tenta fazer sozinha antes de comprar? Quais soluções já tentou que frustraram ela? E em qual etapa ela trava?",
        exemplo: "Ex: Pesquisa no Google, compara preços no Mercado Livre, pergunta para amigos, assiste review no YouTube. FRUSTRAÇÃO: comprou online e veio produto ruim; foi em outra loja e o vendedor não sabia nada. TRAVA: quando vê o preço e não entende por que vale mais que a concorrência.",
      },
      {
        campo: "jornada_emocoes",
        pergunta: "Que emoções predominam em cada etapa da jornada? O que falta para ela finalizar a compra?",
        exemplo: "Ex: PERCEBE: frustração com o celular atual. PESQUISA: curiosidade + ansiedade com tantas opções. DECIDE: medo de errar + excitação com a possibilidade. PÓS-COMPRA: alívio e satisfação, ou arrependimento. FALTA: ver a garantia por escrito, sentir confiança no vendedor, entender por que o preço vale.",
      },
    ],
  },
  {
    id: "mercado", numero: "04", titulo: "O Mercado", cor: "#f06080",
    subtitulo: "Vamos entender o cenário competitivo e onde estão as oportunidades que ninguém está aproveitando.",
    icon: Globe,
    perguntas: [
      {
        campo: "mercado_concorrentes",
        pergunta: "Quem são os principais concorrentes? Como eles se comunicam? Quais promessas fazem e não cumprem?",
        exemplo: "Ex: Lojas do shopping (apelo em promoção e preço, não entregam garantia real). Mercado Livre e OLX (preço baixo, produto sem procedência confiável). Operadoras (plano com aparelho, não explicam custo total). Apple Store online (marca forte mas sem atendimento local).",
      },
      {
        campo: "mercado_oportunidades",
        pergunta: "Quais oportunidades você enxerga que ninguém está aproveitando? E quais padrões do mercado precisam ser quebrados?",
        exemplo: "Ex: OPORTUNIDADES: conteúdo educativo real (ninguém explica qual iPhone encaixa em qual perfil de uso), comunidade de clientes, experiência premium local. PADRÕES: acabar com a pressão de venda, explicar procedência, focar em valor em vez de preço.",
      },
      {
        campo: "mercado_tendencias",
        pergunta: "Quais tendências de comportamento do consumidor fazem sentido para o seu negócio agora?",
        exemplo: "Ex: Cliente pesquisa muito antes de comprar (precisa de conteúdo educativo). Alta desconfiança com lojas online pós-pandemia (experiência presencial valorizada). Valorização de marcas com propósito e valores claros. Busca por comunidade e conexão além do produto.",
      },
    ],
  },
  {
    id: "posicionamento", numero: "05", titulo: "Posicionamento", cor: "#fbbf24",
    subtitulo: "Vamos definir quem você é, o que representa e como quer ser percebida — a essência estratégica da marca.",
    icon: Target,
    perguntas: [
      {
        campo: "pos_personalidade",
        pergunta: "Se a marca fosse uma pessoa real, quem ela seria? Como fala, como age, o que valoriza?",
        exemplo: "Ex: Seria a amiga especialista em Apple que você liga antes de comprar qualquer coisa tech. Fala de igual para igual, sem jargão. É direta, honesta, sabe tudo sobre o ecossistema Apple mas não precisa mostrar isso o tempo todo. Você confia nela antes de qualquer loja ou site.",
      },
      {
        campo: "pos_big_idea",
        pergunta: "Qual é a Big Idea da marca? O que ela representa além de vender iPhones? Qual o mecanismo único que só ela tem?",
        exemplo: "Ex: BIG IDEA: a conquista de ter o melhor sem precisar se arriscar. REPRESENTA: o lugar onde você não precisa ter medo de comprar. MECANISMO ÚNICO: garantia de tela de 6 meses + atendimento consultivo que encontra o iPhone certo para a sua vida.",
      },
      {
        campo: "pos_crencas",
        pergunta: "Qual é o inimigo comum? Quais crenças a cliente precisa construir? E quais crenças limitantes precisa superar?",
        exemplo: "Ex: INIMIGO: a insegurança que o mercado criou — loja que pressiona, produto sem procedência, preço sem explicação. CONSTRUIR: 'seminovo de qualidade existe sim', 'dá pra ter iPhone sem medo'. SUPERAR: 'todo seminovo tem problema', 'é mais barato comprar na internet'.",
      },
    ],
  },
];

// ── Estados de geração ──────────────────────────────────────────────────

const ESTADOS_GERACAO = [
  "Lendo as respostas da entrevista…",
  "Mapeando o perfil da empresa…",
  "Construindo a persona em profundidade…",
  "Desenhando a jornada do cliente…",
  "Analisando o mercado e os concorrentes…",
  "Definindo o posicionamento estratégico…",
  "Gerando 30 dores, desejos e objeções…",
  "Criando o mapa de comunicação completo…",
  "Organizando o documento estratégico…",
];

// ── Componente de cópia ─────────────────────────────────────────────────

function CopiarBtn({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1500);
      }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
      style={{ color: "var(--muted)" }}
    >
      {copiado ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

// ── Utilitários de parse ────────────────────────────────────────────────

function parse<T = unknown>(s: string, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[];
  return [];
}

// ── Tags de item do mapa ────────────────────────────────────────────────

function Tag({ texto }: { texto: string }) {
  return (
    <div className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--accent)", border: "1px solid var(--card-border)" }}>
      <span className="text-xs" style={{ color: "var(--foreground)" }}>{texto}</span>
      <CopiarBtn texto={texto} />
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────

export default function PersonaPage() {
  const [fase, setFase] = useState<Fase>("carregando");
  const [secaoAtual, setSecaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [tabDocumento, setTabDocumento] = useState(0);
  const [estadoGeracaoIdx, setEstadoGeracaoIdx] = useState(0);
  const [estudo, setEstudo] = useState<Record<string, string>>({});
  const [erroGeracao, setErroGeracao] = useState<string | null>(null);

  // Carregar estudo existente
  const carregar = useCallback(async () => {
    const res = await fetch("/api/estrategia");
    if (!res.ok) { setFase("novo"); return; }
    const data = await res.json();
    if (!data || data.status === "novo") { setFase("novo"); return; }
    setEstudo(data);
    if (data.status === "completo") setFase("completo");
    else if (data.status === "rascunho") {
      const r = parse<Respostas>(data.respostas, {});
      setRespostas(r);
      setFase("entrevista");
    } else setFase("novo");
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Animação de geração
  useEffect(() => {
    if (fase !== "gerando") return;
    const iv = setInterval(() => setEstadoGeracaoIdx((i) => (i + 1) % ESTADOS_GERACAO.length), 4000);
    return () => clearInterval(iv);
  }, [fase]);

  function atualizar(campo: string, valor: string) {
    setRespostas((r) => ({ ...r, [campo]: valor }));
  }

  async function salvarRascunho() {
    await fetch("/api/estrategia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respostas }),
    });
  }

  async function proximaSecao() {
    await salvarRascunho();
    if (secaoAtual < SECOES.length - 1) setSecaoAtual((s) => s + 1);
  }

  function secaoAnterior() {
    if (secaoAtual > 0) setSecaoAtual((s) => s - 1);
  }

  async function gerarDocumento() {
    await salvarRascunho();
    setFase("gerando");
    setEstadoGeracaoIdx(0);
    setErroGeracao(null);
    try {
      // Fase 1: empresa, persona, jornada, mercado, posicionamento (~60s)
      const res1 = await fetch("/api/estrategia/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas, fase: 1 }),
      });
      if (!res1.ok) {
        const body = await res1.json().catch(() => ({}));
        throw new Error(body?.erro ?? `Erro ${res1.status}`);
      }

      // Avança animação para a fase do mapa
      setEstadoGeracaoIdx(6);

      // Fase 2: mapa de comunicação (~60s)
      const res2 = await fetch("/api/estrategia/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fase: 2 }),
      });
      if (!res2.ok) {
        const body = await res2.json().catch(() => ({}));
        throw new Error(body?.erro ?? `Erro ${res2.status}`);
      }
      const data = await res2.json();
      setEstudo(data);
      setFase("completo");
    } catch (err) {
      setErroGeracao(err instanceof Error ? err.message : "Erro desconhecido. Tente novamente.");
      setFase("entrevista");
    }
  }

  const secaoInfo = SECOES[secaoAtual];
  const progresso = ((secaoAtual + 1) / SECOES.length) * 100;

  // ── Renderizações por fase ──────────────────────────────────────────────

  if (fase === "carregando") {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--lime)" }} />
      </div>
    );
  }

  // ── FASE: NOVO ──────────────────────────────────────────────────────────

  if (fase === "novo") {
    return (
      <div className="min-h-full grid-bg" style={{ background: "var(--background)" }}>
        <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
          {/* Header */}
          <div className="mb-12 text-center">
            <p className="section-label mb-3">· Diagnóstico Estratégico</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)", letterSpacing: "-0.02em" }}>
              Estudo de Persona<br />& Produto
            </h1>
            <p className="text-base leading-relaxed max-w-lg mx-auto" style={{ color: "var(--muted)" }}>
              Uma entrevista estratégica completa que vai gerar um documento de inteligência de negócio: persona profunda, jornada do cliente, análise de mercado e um mapa de comunicação com 300 insights prontos para virar conteúdo.
            </p>
          </div>

          {/* O que você vai receber */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
            {[
              { icon: Building2, titulo: "Diagnóstico da Empresa", desc: "Produtos, diferenciais, posicionamento atual e desejado, promessa e transformação.", cor: "#c8d92a" },
              { icon: User, titulo: "Persona em Profundidade", desc: "30+ atributos: demográfico, psicográfico, linguagem, gatilhos, medos e desejos.", cor: "#9b8fd4" },
              { icon: Map, titulo: "Jornada do Cliente", desc: "5 etapas mapeadas com as emoções e obstáculos de cada momento.", cor: "#6ee7b7" },
              { icon: Globe, titulo: "Análise de Mercado", desc: "Concorrentes, oportunidades inexploradas e tendências relevantes.", cor: "#f06080" },
              { icon: Target, titulo: "Posicionamento Completo", desc: "Arquétipo, Big Idea, mecanismo único, inimigo comum e pilares editoriais.", cor: "#fbbf24" },
              { icon: BookOpen, titulo: "Mapa de Comunicação", desc: "300 insights: 30 dores, desejos, objeções, gatilhos, temas e muito mais.", cor: "#c8d92a" },
            ].map(({ icon: Icon, titulo, desc, cor }) => (
              <div key={titulo} className="p-4 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cor}18` }}>
                    <Icon size={16} style={{ color: cor }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-0.5" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{titulo}</div>
                    <div className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Aviso */}
          <div className="mb-8 p-4 rounded-xl flex gap-3" style={{ background: "rgba(200,217,42,0.08)", border: "1px solid rgba(200,217,42,0.2)" }}>
            <AlertCircle size={16} style={{ color: "#c8d92a" }} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
              São <strong style={{ color: "var(--foreground)" }}>5 seções com 21 perguntas</strong>. Responda com o máximo de detalhe possível. Quanto mais específica a resposta, mais preciso será o documento estratégico gerado pela IA. Leva cerca de 20 a 30 minutos.
            </p>
          </div>

          <button
            onClick={() => setFase("entrevista")}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            style={{ background: "#c8d92a", color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)", boxShadow: "0 0 32px rgba(200,217,42,0.3)" }}
          >
            <Sparkles size={20} />
            Iniciar diagnóstico estratégico
          </button>
        </div>
      </div>
    );
  }

  // ── FASE: ENTREVISTA ────────────────────────────────────────────────────

  if (fase === "entrevista") {
    const Icon = secaoInfo.icon;
    const isUltimaSecao = secaoAtual === SECOES.length - 1;

    return (
      <div className="min-h-full" style={{ background: "var(--background)" }}>
        <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">

          {/* Barra de progresso */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="section-label">Seção {secaoInfo.numero} de {SECOES.length}</p>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{Math.round(progresso)}% concluído</span>
            </div>
            <div className="flex gap-1.5">
              {SECOES.map((s, i) => (
                <div
                  key={s.id}
                  className="h-1.5 flex-1 rounded-full transition-all"
                  style={{ background: i <= secaoAtual ? secaoInfo.cor : "var(--accent)" }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {SECOES.map((s, i) => (
                <span key={s.id} className="text-[9px]" style={{ color: i === secaoAtual ? secaoInfo.cor : "var(--muted)", fontFamily: "var(--font-syne, inherit)", fontWeight: i === secaoAtual ? 700 : 400 }}>
                  {s.titulo.split(" ")[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Header da seção */}
          <div className="mb-8 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${secaoInfo.cor}18`, border: `1px solid ${secaoInfo.cor}30` }}>
              <Icon size={22} style={{ color: secaoInfo.cor }} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{secaoInfo.titulo}</h2>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{secaoInfo.subtitulo}</p>
            </div>
          </div>

          {/* Perguntas */}
          <div className="space-y-6">
            {secaoInfo.perguntas.map((p, i) => (
              <div key={p.campo}>
                <label className="block mb-2">
                  <span className="text-xs font-bold mr-2 tabular-nums" style={{ color: secaoInfo.cor, fontFamily: "var(--font-syne, inherit)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{p.pergunta}</span>
                </label>
                <textarea
                  value={respostas[p.campo] ?? ""}
                  onChange={(e) => atualizar(p.campo, e.target.value)}
                  rows={4}
                  placeholder={p.exemplo}
                  className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition resize-none"
                  style={{
                    background: "var(--card-bg)",
                    color: "var(--foreground)",
                    border: `1px solid ${respostas[p.campo] ? secaoInfo.cor + "60" : "var(--card-border)"}`,
                  }}
                  onFocus={e => (e.target.style.borderColor = secaoInfo.cor + "80")}
                  onBlur={e => (e.target.style.borderColor = respostas[p.campo] ? secaoInfo.cor + "60" : "var(--card-border)")}
                />
              </div>
            ))}
          </div>

          {/* Erro de geração */}
          {erroGeracao && (
            <div className="mt-6 p-4 rounded-xl flex gap-3" style={{ background: "rgba(240,96,128,0.1)", border: "1px solid rgba(240,96,128,0.3)" }}>
              <AlertCircle size={16} style={{ color: "#f06080" }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "#f06080" }}>Falha ao gerar o documento</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{erroGeracao}</p>
              </div>
            </div>
          )}

          {/* Navegação */}
          <div className="flex gap-3 mt-6">
            {secaoAtual > 0 && (
              <button
                onClick={secaoAnterior}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm transition-all"
                style={{ background: "var(--card-bg)", color: "var(--muted)", border: "1px solid var(--card-border)" }}
              >
                <ChevronLeft size={16} /> Voltar
              </button>
            )}

            {isUltimaSecao ? (
              <button
                onClick={gerarDocumento}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                style={{ background: "#c8d92a", color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)", boxShadow: "0 0 20px rgba(200,217,42,0.3)" }}
              >
                <Sparkles size={16} />
                Gerar documento estratégico
              </button>
            ) : (
              <button
                onClick={proximaSecao}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{ background: secaoInfo.cor + "18", color: secaoInfo.cor, border: `1px solid ${secaoInfo.cor}40` }}
              >
                Próxima seção <ChevronRight size={16} />
              </button>
            )}
          </div>

          {/* Salvar rascunho */}
          <button onClick={salvarRascunho} className="w-full mt-3 text-xs py-2 transition-colors" style={{ color: "var(--muted)" }}>
            Salvar rascunho
          </button>
        </div>
      </div>
    );
  }

  // ── FASE: GERANDO ────────────────────────────────────────────────────────

  if (fase === "gerando") {
    return (
      <div className="min-h-full grid-bg flex flex-col items-center justify-center px-4" style={{ background: "#0d2b1e" }}>
        <div className="text-center max-w-sm">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
            style={{ background: "linear-gradient(135deg, #c8d92a, #9b8fd4)", boxShadow: "0 0 48px rgba(200,217,42,0.4)" }}
          >
            <Sparkles size={36} style={{ color: "#0d2b1e" }} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
            Construindo inteligência
          </h2>
          <p className="text-sm mb-10" style={{ color: "#6a9a78" }}>
            A IA está analisando as suas respostas e gerando o documento estratégico completo. Isso leva cerca de 60–90 segundos.
          </p>

          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl mb-4" style={{ background: "#122a1d", border: "1px solid #1e4535" }}>
            <Loader2 size={16} className="animate-spin shrink-0" style={{ color: "#c8d92a" }} />
            <p className="text-sm text-left" style={{ color: "#b0c9a5" }}>
              {ESTADOS_GERACAO[estadoGeracaoIdx]}
            </p>
          </div>

          <div className="flex gap-1.5 justify-center">
            {ESTADOS_GERACAO.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: i === estadoGeracaoIdx ? "#c8d92a" : "#2d5a3d" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── FASE: COMPLETO ───────────────────────────────────────────────────────

  const empresa = parse<Record<string, unknown>>(estudo.secEmpresa, {});
  const persona = parse<Record<string, unknown>>(estudo.secPersona, {});
  const jornada = parse<Record<string, unknown>>(estudo.secJornada, {});
  const mercado = parse<Record<string, unknown>>(estudo.secMercado, {});
  const posicionamento = parse<Record<string, unknown>>(estudo.secPosicionamento, {});
  const mapa = parse<Record<string, string[]>>(estudo.secMapa, {});

  const TABS_DOC = [
    { label: "A Empresa", icon: Building2, cor: "#c8d92a" },
    { label: "A Persona", icon: User, cor: "#9b8fd4" },
    { label: "A Jornada", icon: Map, cor: "#6ee7b7" },
    { label: "O Mercado", icon: Globe, cor: "#f06080" },
    { label: "Posicionamento", icon: Target, cor: "#fbbf24" },
    { label: "Mapa de Comunicação", icon: BookOpen, cor: "#c8d92a" },
  ];

  const MAPA_CATEGORIAS = [
    { chave: "dores", label: "30 Dores", icon: Heart, cor: "#f06080" },
    { chave: "desejos", label: "30 Desejos", icon: TrendingUp, cor: "#c8d92a" },
    { chave: "objecoes", label: "30 Objeções", icon: Shield, cor: "#f06080" },
    { chave: "crencas_limitantes", label: "30 Crenças Limitantes", icon: AlertCircle, cor: "#fbbf24" },
    { chave: "gatilhos_mentais", label: "30 Gatilhos Mentais", icon: Zap, cor: "#9b8fd4" },
    { chave: "temas_conteudo", label: "30 Temas de Conteúdo", icon: MessageSquare, cor: "#c8d92a" },
    { chave: "perguntas_frequentes", label: "30 Perguntas Frequentes", icon: MessageSquare, cor: "#6ee7b7" },
    { chave: "mitos", label: "30 Mitos", icon: Eye, cor: "#fbbf24" },
    { chave: "erros", label: "30 Erros Comuns", icon: AlertCircle, cor: "#f06080" },
    { chave: "oportunidades_conteudo", label: "30 Oportunidades de Conteúdo", icon: Lightbulb, cor: "#c8d92a" },
  ];

  function ListaItens({ itens, cor }: { itens: string[]; cor: string }) {
    const [ver, setVer] = useState(10);
    if (!itens?.length) return <p className="text-xs" style={{ color: "var(--muted)" }}>Nenhum item gerado.</p>;
    return (
      <div className="space-y-1.5">
        {itens.slice(0, ver).map((item, i) => (
          <div key={i} className="group flex items-start gap-2.5 px-3 py-2 rounded-lg" style={{ background: "var(--accent)", border: "1px solid var(--card-border)" }}>
            <span className="text-[10px] font-bold shrink-0 tabular-nums mt-0.5" style={{ color: cor }}>{String(i + 1).padStart(2, "0")}</span>
            <span className="text-xs leading-relaxed flex-1" style={{ color: "var(--foreground)" }}>{item}</span>
            <CopiarBtn texto={item} />
          </div>
        ))}
        {ver < itens.length && (
          <button onClick={() => setVer((v) => v + 10)} className="w-full py-2 text-xs rounded-lg transition-colors" style={{ color: cor, background: `${cor}10`, border: `1px dashed ${cor}40` }}>
            Ver mais {Math.min(10, itens.length - ver)} itens
          </button>
        )}
      </div>
    );
  }

  function Campo({ label, valor }: { label: string; valor?: unknown }) {
    if (!valor) return null;
    return (
      <div className="mb-4">
        <p className="section-label mb-2">{label}</p>
        {Array.isArray(valor) ? (
          <div className="space-y-1.5">
            {(valor as string[]).map((v, i) => <Tag key={i} texto={v} />)}
          </div>
        ) : (
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{String(valor)}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="section-label mb-1">· Diagnóstico Estratégico</p>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>
              Documento Estratégico
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {String(persona.nome ?? "Sua persona")} · Gerado pela IA com base na entrevista completa
            </p>
          </div>
          <button
            onClick={() => { setFase("entrevista"); setSecaoAtual(0); }}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all shrink-0"
            style={{ background: "var(--card-bg)", color: "var(--muted)", border: "1px solid var(--card-border)" }}
          >
            <RotateCcw size={12} /> Refazer
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6">
          {TABS_DOC.map(({ label, icon: Icon, cor }, i) => (
            <button
              key={label}
              onClick={() => setTabDocumento(i)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all"
              style={tabDocumento === i
                ? { background: cor + "18", color: cor, border: `1px solid ${cor}50` }
                : { background: "var(--card-bg)", color: "var(--muted)", border: "1px solid var(--card-border)" }
              }
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: A EMPRESA ──────────────────────────────────────────── */}
        {tabDocumento === 0 && (
          <div className="space-y-2">
            <div className="p-5 rounded-2xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <p className="section-label mb-4">· 01 · A Empresa</p>
              <Campo label="Produtos & Serviços" valor={empresa.produtos} />
              <Campo label="Como Vende" valor={empresa.como_vende} />
              <div className="grid grid-cols-3 gap-3 mb-4">
                {([["Ticket Médio", empresa.ticket], ["Produto de Entrada", empresa.produto_entrada], ["Produto Premium", empresa.produto_premium]] as [string, unknown][]).map(([l, v]) => v ? (
                  <div key={l} className="p-3 rounded-xl text-center" style={{ background: "var(--accent)" }}>
                    <p className="text-[10px] mb-1 section-label">{l}</p>
                    <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{String(v)}</p>
                  </div>
                ) : null)}
              </div>
              <Campo label="Diferenciais Reais" valor={arr(empresa.diferenciais)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Campo label="Posicionamento Atual" valor={empresa.posicionamento_atual} />
                <Campo label="Posicionamento Desejado" valor={empresa.posicionamento_desejado} />
              </div>
              <Campo label="Valores" valor={arr(empresa.valores)} />
              <Campo label="Personalidade" valor={empresa.personalidade} />
              <div className="p-4 rounded-xl" style={{ background: "rgba(200,217,42,0.08)", border: "1px solid rgba(200,217,42,0.2)" }}>
                <p className="section-label mb-2">Promessa Central</p>
                <p className="text-sm font-semibold" style={{ color: "#c8d92a" }}>{String(empresa.promessa ?? "")}</p>
              </div>
              <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(155,143,212,0.08)", border: "1px solid rgba(155,143,212,0.2)" }}>
                <p className="section-label mb-2">Transformação Entregue</p>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>{String(empresa.transformacao ?? "")}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: A PERSONA ─────────────────────────────────────────── */}
        {tabDocumento === 1 && (
          <div className="p-5 rounded-2xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <p className="section-label mb-4">· 02 · A Persona</p>
            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: "rgba(155,143,212,0.1)", border: "1px solid rgba(155,143,212,0.2)" }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0" style={{ background: "#9b8fd4", color: "#0d2b1e" }}>
                {String(persona.nome ?? "P").charAt(0)}
              </div>
              <div>
                <h3 className="font-bold" style={{ color: "#9b8fd4", fontFamily: "var(--font-syne, inherit)" }}>{String(persona.nome ?? "")}</h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{String(persona.perfil ?? "").slice(0, 120)}</p>
              </div>
            </div>
            <Campo label="Perfil Completo" valor={persona.perfil} />
            <Campo label="Rotina" valor={persona.rotina} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Objetivos" valor={arr(persona.objetivos)} />
              <Campo label="Sonhos" valor={arr(persona.sonhos)} />
              <Campo label="Medos" valor={arr(persona.medos)} />
              <Campo label="Frustrações" valor={arr(persona.frustracoes)} />
              <Campo label="Dores Emocionais" valor={arr(persona.dores_emocionais)} />
              <Campo label="Dores Financeiras" valor={arr(persona.dores_financeiras)} />
              <Campo label="Dores Práticas" valor={arr(persona.dores_praticas)} />
              <Campo label="Desejos Conscientes" valor={arr(persona.desejos_conscientes)} />
              <Campo label="Desejos Inconscientes" valor={arr(persona.desejos_inconscientes)} />
              <Campo label="Gatilhos de Compra" valor={arr(persona.gatilhos_compra)} />
              <Campo label="Valores" valor={arr(persona.valores)} />
              <Campo label="O que Faz Confiar" valor={arr(persona.faz_confiar)} />
              <Campo label="O que Faz Desistir" valor={arr(persona.faz_desistir)} />
            </div>
            <Campo label="Linguagem" valor={persona.linguagem} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Palavras que Usa" valor={arr(persona.palavras_usa)} />
              <Campo label="Palavras que Odeia" valor={arr(persona.palavras_odeia)} />
              <Campo label="Influenciadores" valor={arr(persona.influenciadores)} />
              <Campo label="Conteúdo que Consome" valor={arr(persona.conteudo_consome)} />
              <Campo label="Pesquisa no Google" valor={arr(persona.pesquisa_google)} />
              <Campo label="Salva no Instagram" valor={arr(persona.salva_instagram)} />
            </div>
          </div>
        )}

        {/* ── TAB 3: JORNADA ───────────────────────────────────────────── */}
        {tabDocumento === 2 && (
          <div className="p-5 rounded-2xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <p className="section-label mb-4">· 03 · A Jornada do Cliente</p>
            {Array.isArray(jornada.etapas) && (
              <div className="space-y-3 mb-6">
                {(jornada.etapas as Array<Record<string, string>>).map((etapa, i) => {
                  const cores = ["#c8d92a", "#9b8fd4", "#fbbf24", "#6ee7b7", "#f06080"];
                  const cor = cores[i] ?? "#c8d92a";
                  return (
                    <div key={etapa.nome} className="p-4 rounded-xl relative overflow-hidden" style={{ background: "var(--accent)", borderLeft: `3px solid ${cor}` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold" style={{ color: cor, fontFamily: "var(--font-syne, inherit)" }}>ETAPA {String(i + 1).padStart(2, "0")}</span>
                        <span className="text-sm font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{etapa.nome}</span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: "var(--foreground)" }}>{etapa.descricao}</p>
                      <div className="flex gap-3 text-xs">
                        <span style={{ color: cor }}>Emoção: {etapa.emocao}</span>
                        <span style={{ color: "var(--muted)" }}>Ação: {etapa.acao}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Campo label="O que ela tenta sozinha" valor={jornada.tenta_sozinha} />
            <Campo label="Soluções Frustradas" valor={arr(jornada.solucoes_frustradas)} />
            <Campo label="Onde ela Trava" valor={jornada.onde_trava} />
            <div className="p-4 rounded-xl" style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)" }}>
              <p className="section-label mb-2">O que falta para comprar</p>
              <p className="text-sm" style={{ color: "var(--foreground)" }}>{String(jornada.o_que_falta ?? "")}</p>
            </div>
          </div>
        )}

        {/* ── TAB 4: MERCADO ───────────────────────────────────────────── */}
        {tabDocumento === 3 && (
          <div className="p-5 rounded-2xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <p className="section-label mb-4">· 04 · O Mercado</p>
            {Array.isArray(mercado.concorrentes) && (
              <div className="mb-6">
                <p className="section-label mb-3">Concorrentes</p>
                <div className="space-y-3">
                  {(mercado.concorrentes as Array<Record<string, string>>).map((c) => (
                    <div key={c.nome} className="p-4 rounded-xl" style={{ background: "var(--accent)", border: "1px solid var(--card-border)" }}>
                      <p className="text-sm font-bold mb-2" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{c.nome}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><span style={{ color: "var(--muted)" }}>Como comunica:</span><br /><span style={{ color: "var(--foreground)" }}>{c.como_comunica}</span></div>
                        <div><span style={{ color: "var(--muted)" }}>Promessa:</span><br /><span style={{ color: "var(--foreground)" }}>{c.promessa}</span></div>
                        <div><span style={{ color: "#f06080" }}>Fraqueza:</span><br /><span style={{ color: "var(--foreground)" }}>{c.fraqueza}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Campo label="Oportunidades" valor={arr(mercado.oportunidades)} />
            <Campo label="Padrões a Quebrar" valor={arr(mercado.padroes_quebrar)} />
            <Campo label="Tendências Relevantes" valor={arr(mercado.tendencias)} />
          </div>
        )}

        {/* ── TAB 5: POSICIONAMENTO ────────────────────────────────────── */}
        {tabDocumento === 4 && (
          <div className="p-5 rounded-2xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <p className="section-label mb-4">· 05 · Posicionamento</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl" style={{ background: "rgba(200,217,42,0.08)", border: "1px solid rgba(200,217,42,0.2)" }}>
                <p className="section-label mb-2">Arquétipo</p>
                <p className="text-sm font-bold" style={{ color: "#c8d92a", fontFamily: "var(--font-syne, inherit)" }}>{String(posicionamento.arquetipo ?? "")}</p>
              </div>
              <div className="p-4 rounded-xl" style={{ background: "rgba(155,143,212,0.08)", border: "1px solid rgba(155,143,212,0.2)" }}>
                <p className="section-label mb-2">Tom de Voz</p>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>{String(posicionamento.tom_voz ?? "")}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(200,217,42,0.1)", border: "1px solid rgba(200,217,42,0.3)" }}>
              <p className="section-label mb-2">Big Idea</p>
              <p className="text-base font-bold leading-snug" style={{ color: "#c8d92a", fontFamily: "var(--font-syne, inherit)" }}>{String(posicionamento.big_idea ?? "")}</p>
            </div>
            <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(240,96,128,0.08)", border: "1px solid rgba(240,96,128,0.2)" }}>
              <p className="section-label mb-2">Inimigo Comum</p>
              <p className="text-sm" style={{ color: "var(--foreground)" }}>{String(posicionamento.inimigo_comum ?? "")}</p>
            </div>
            <Campo label="Promessa Central" valor={posicionamento.promessa_central} />
            <Campo label="Mecanismo Único" valor={posicionamento.mecanismo_unico} />
            <Campo label="Diferencial Competitivo" valor={posicionamento.diferencial_competitivo} />
            <Campo label="Pilares Editoriais" valor={arr(posicionamento.pilares_editoriais)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Campo label="Crenças a Construir" valor={arr(posicionamento.crencas_construir)} />
              <Campo label="Crenças a Quebrar" valor={arr(posicionamento.crencas_quebrar)} />
            </div>
          </div>
        )}

        {/* ── TAB 6: MAPA DE COMUNICAÇÃO ──────────────────────────────── */}
        {tabDocumento === 5 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl flex gap-3" style={{ background: "rgba(200,217,42,0.08)", border: "1px solid rgba(200,217,42,0.2)" }}>
              <CheckCircle2 size={16} style={{ color: "#c8d92a" }} className="shrink-0 mt-0.5" />
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                <strong style={{ color: "var(--foreground)" }}>300 insights prontos para conteúdo.</strong> Cada item é específico para a It Case. Passe o mouse sobre qualquer item para copiar.
              </p>
            </div>
            {MAPA_CATEGORIAS.map(({ chave, label, icon: Icon, cor }) => {
              const itens = mapa[chave] ?? [];
              return (
                <div key={chave} className="rounded-2xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                  <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--card-border)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${cor}18` }}>
                      <Icon size={13} style={{ color: cor }} />
                    </div>
                    <span className="section-label">{label}</span>
                    <span className="ml-auto text-xs" style={{ color: "var(--muted)" }}>{itens.length} gerados</span>
                  </div>
                  <div className="p-4">
                    <ListaItens itens={itens} cor={cor} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botão de regenerar no final */}
        <div className="mt-8 pt-6" style={{ borderTop: "1px solid var(--card-border)" }}>
          <button
            onClick={() => { setFase("entrevista"); setSecaoAtual(0); }}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: "var(--muted)" }}
          >
            <RotateCcw size={14} /> Refazer a entrevista com novas respostas
          </button>
        </div>

      </div>
    </div>
  );
}
