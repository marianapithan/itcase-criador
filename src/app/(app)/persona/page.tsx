"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Loader2, ChevronLeft, Sparkles, Building2, User, Map, Globe,
  Target, BookOpen, CheckCircle2, AlertCircle, Lightbulb, TrendingUp,
  MessageSquare, Heart, Shield, Zap, Eye, Copy, Check, RotateCcw,
  ArrowRight, Lock,
} from "lucide-react";

// ── Tipos ────────────────────────────────────────────────────────────────

type Respostas = Record<string, string>;
type ModuloId = "empresa" | "persona" | "jornada" | "mercado" | "posicionamento" | "mapa";
type StatusModulo = "vazio" | "preenchendo" | "gerado";
type View = "overview" | "form" | "resultado" | "gerando" | "analise-completa" | "gerando-completo";
type Pergunta = { campo: string; pergunta: string; exemplo: string };
type Modulo = {
  id: ModuloId; titulo: string; descCard: string; cor: string;
  icon: React.ElementType; perguntas: Pergunta[]; secKey: string;
};

// ── Configuração dos módulos ──────────────────────────────────────────────

const MODULOS: Modulo[] = [
  {
    id: "empresa", titulo: "Diagnóstico da Empresa", cor: "#c8d92a",
    descCard: "Produtos, diferenciais, posicionamento atual e desejado, promessa e transformação.",
    icon: Building2, secKey: "secEmpresa",
    perguntas: [
      { campo: "empresa_produtos", pergunta: "O que a empresa vende? Liste todos os produtos e serviços.", exemplo: "Ex: iPhones novos e seminovos (todos os modelos a partir do iPhone X), acessórios Apple originais, películas de vidro temperado, serviços de instalação, troca de bateria, desbloqueio." },
      { campo: "empresa_como_vende", pergunta: "Como funciona a venda? Onde e como o cliente chega até você?", exemplo: "Ex: Loja física no Shopping Catuaí com atendimento presencial. Também atendo pelo WhatsApp e Instagram Direct. A maioria dos clientes chega por indicação ou pelo Instagram." },
      { campo: "empresa_ticket", pergunta: "Qual o ticket médio? Qual o produto mais acessível (entrada) e o mais premium?", exemplo: "Ex: Ticket médio R$1.200. Produto de entrada: película + instalação (R$80). Produto premium: iPhone 15 Pro Max novo (R$8.000–10.000)." },
      { campo: "empresa_diferenciais", pergunta: "Quais são os diferenciais REAIS que nenhum concorrente tem?", exemplo: "Ex: Garantia de tela de 6 meses na película (única na região). iPhones seminovos com IMEI verificado. Atendimento consultivo. Suporte pós-venda real." },
      { campo: "empresa_posicionamento", pergunta: "Como a empresa se posiciona hoje? E onde quer estar em 12 meses?", exemplo: "Ex: Hoje somos conhecidos como loja de celulares Apple. Em 12 meses quero ser a referência em experiência Apple em Londrina." },
      { campo: "empresa_valores", pergunta: "Quais são os valores, a personalidade da marca, a promessa central e a transformação que entrega?", exemplo: "Ex: Valores: honestidade, cuidado, qualidade. Personalidade: amiga especialista. Promessa: você vai sair com o produto certo, sem arrependimento." },
    ],
  },
  {
    id: "persona", titulo: "Persona em Profundidade", cor: "#9b8fd4",
    descCard: "30+ atributos — demográfico, psicográfico, linguagem, gatilhos, medos e desejos.",
    icon: User, secKey: "secPersona",
    perguntas: [
      { campo: "persona_perfil", pergunta: "Quem é a cliente ideal? Descreva em detalhes: idade, sexo, estado civil, profissão, renda, cidade.", exemplo: "Ex: Mulher, 26–40 anos, casada, trabalha com carteira assinada ou tem negócio próprio pequeno. Tem 1 ou 2 filhos. Renda familiar 4–8 salários mínimos. Mora em Londrina." },
      { campo: "persona_rotina", pergunta: "Como é a rotina e o estilo de vida dela? O que ela faz no celular? O que ela consome?", exemplo: "Ex: Acorda às 6h, leva filho para escola, trabalha o dia inteiro, usa o celular para WhatsApp e Instagram. Vai ao shopping no fim de semana. Segue influencers de moda e família." },
      { campo: "persona_objetivos", pergunta: "Quais são os objetivos e sonhos dela? E quais são os medos, frustrações e dores (emocionais, financeiras e práticas)?", exemplo: "Ex: OBJETIVOS: crescer profissionalmente, dar vida boa aos filhos. MEDOS: ser enganada, pagar caro por algo que quebra. DORES: medo de julgamento, investir R$5k e se arrepender." },
      { campo: "persona_confianca", pergunta: "O que faz ela CONFIAR numa empresa? E o que faz ela DESISTIR de comprar?", exemplo: "Ex: CONFIA: loja física estabelecida, boas avaliações, garantia por escrito, transparência no preço. DESISTE: vendedor que pressiona, preço sem justificativa, demora no atendimento." },
      { campo: "persona_linguagem", pergunta: "Como ela se comunica? Que palavras usa? O que odeia ouvir? O que ela pesquisa, salva e comenta?", exemplo: "Ex: FALA: 'Tem como parcelar?', 'É garantido que é original?'. ODEIA: 'Aproveite!', 'Última unidade'. PESQUISA: 'iPhone seminovo vale a pena', 'It Case Londrina'." },
      { campo: "persona_influencia", pergunta: "Quem influencia a decisão de compra dela? Que conteúdo ela consome? Quais são os desejos conscientes e inconscientes?", exemplo: "Ex: INFLUENCIA: marido, amiga que comprou. CONSOME: YouTube de reviews, grupos de WhatsApp. DESEJO CONSCIENTE: um iPhone que funcione bem. INCONSCIENTE: sentir que chegou lá." },
    ],
  },
  {
    id: "jornada", titulo: "Jornada do Cliente", cor: "#6ee7b7",
    descCard: "5 etapas mapeadas com as emoções e obstáculos de cada momento da compra.",
    icon: Map, secKey: "secJornada",
    perguntas: [
      { campo: "jornada_percebe", pergunta: "Como ela percebe que precisa comprar? O que a faz começar a pesquisar?", exemplo: "Ex: O celular começa a travar ou a bateria dura pouco. Viu uma amiga com iPhone novo. Ganhou aumento e quer se presentear. Tela quebrou e decidiu comprar um novo de verdade." },
      { campo: "jornada_trava", pergunta: "O que ela tenta fazer sozinha antes de comprar? Quais soluções já tentou que frustraram ela? Em qual etapa ela trava?", exemplo: "Ex: Pesquisa no Google, compara no Mercado Livre, pergunta para amigos. FRUSTRAÇÃO: comprou online e veio produto ruim. TRAVA: quando vê o preço e não entende por que vale mais." },
      { campo: "jornada_emocoes", pergunta: "Que emoções predominam em cada etapa da jornada? O que falta para ela finalizar a compra?", exemplo: "Ex: PERCEBE: frustração. PESQUISA: curiosidade + ansiedade. DECIDE: medo de errar + excitação. PÓS-COMPRA: alívio. FALTA: ver garantia por escrito, sentir confiança no vendedor." },
    ],
  },
  {
    id: "mercado", titulo: "Análise de Mercado", cor: "#f06080",
    descCard: "Concorrentes, oportunidades inexploradas e tendências relevantes para o negócio.",
    icon: Globe, secKey: "secMercado",
    perguntas: [
      { campo: "mercado_concorrentes", pergunta: "Quem são os principais concorrentes? Como eles se comunicam? Quais promessas fazem e não cumprem?", exemplo: "Ex: Lojas do shopping (apelam para preço, não entregam garantia real). Mercado Livre (preço baixo, sem procedência). Operadoras (plano com aparelho, não explicam custo total)." },
      { campo: "mercado_oportunidades", pergunta: "Quais oportunidades você enxerga que ninguém está aproveitando? E quais padrões do mercado precisam ser quebrados?", exemplo: "Ex: OPORTUNIDADES: conteúdo educativo real, comunidade de clientes, experiência premium local. PADRÕES: acabar com pressão de venda, explicar procedência, focar em valor não preço." },
      { campo: "mercado_tendencias", pergunta: "Quais tendências de comportamento do consumidor fazem sentido para o seu negócio agora?", exemplo: "Ex: Cliente pesquisa muito antes de comprar. Alta desconfiança com lojas online. Valorização de marcas com propósito. Busca por comunidade e conexão além do produto." },
    ],
  },
  {
    id: "posicionamento", titulo: "Posicionamento Completo", cor: "#fbbf24",
    descCard: "Arquétipo, Big Idea, mecanismo único, inimigo comum e pilares editoriais.",
    icon: Target, secKey: "secPosicionamento",
    perguntas: [
      { campo: "pos_personalidade", pergunta: "Se a marca fosse uma pessoa real, quem ela seria? Como fala, como age, o que valoriza?", exemplo: "Ex: Seria a amiga especialista em Apple que você liga antes de comprar qualquer coisa tech. Fala de igual para igual, sem jargão. É direta, honesta, você confia nela antes de qualquer loja." },
      { campo: "pos_big_idea", pergunta: "Qual é a Big Idea da marca? O que ela representa além de vender iPhones? Qual o mecanismo único que só ela tem?", exemplo: "Ex: BIG IDEA: a conquista de ter o melhor sem precisar se arriscar. REPRESENTA: o lugar onde você não precisa ter medo de comprar. MECANISMO: garantia 6 meses + atendimento consultivo." },
      { campo: "pos_crencas", pergunta: "Qual é o inimigo comum? Quais crenças a cliente precisa construir? E quais crenças limitantes precisa superar?", exemplo: "Ex: INIMIGO: a insegurança que o mercado criou. CONSTRUIR: 'seminovo de qualidade existe'. SUPERAR: 'todo seminovo tem problema', 'é mais barato na internet'." },
    ],
  },
  {
    id: "mapa", titulo: "Mapa de Comunicação", cor: "#c8d92a",
    descCard: "Gerado automaticamente: 60+ insights com dores, desejos, objeções, gatilhos e temas.",
    icon: BookOpen, secKey: "secMapa",
    perguntas: [], // gerado automaticamente, sem formulário
  },
];

// ── Utilitários ───────────────────────────────────────────────────────────

function parse<T = unknown>(s: string, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return (v as unknown[]).map(String).filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}

function statusModulo(id: ModuloId, estudo: Record<string, string>, respostas: Respostas): StatusModulo {
  const m = MODULOS.find(m => m.id === id)!;
  if (estudo[m.secKey]) return "gerado";
  const prefixos: Record<ModuloId, string[]> = {
    empresa: ["empresa_"],
    persona: ["persona_"],
    jornada: ["jornada_"],
    mercado: ["mercado_"],
    posicionamento: ["pos_"],
    mapa: [],
  };
  const temResposta = prefixos[id].some(p => Object.keys(respostas).some(k => k.startsWith(p) && respostas[k]?.trim()));
  return temResposta ? "preenchendo" : "vazio";
}

// ── Componentes auxiliares ────────────────────────────────────────────────

function CopiarBtn({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1500); }}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
      style={{ color: "var(--muted)" }}
    >
      {copiado ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function Tag({ texto }: { texto: string }) {
  return (
    <div className="group flex items-center justify-between gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--accent)", border: "1px solid var(--card-border)" }}>
      <span className="text-xs" style={{ color: "var(--foreground)" }}>{texto}</span>
      <CopiarBtn texto={texto} />
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor?: unknown }) {
  if (!valor || (Array.isArray(valor) && (valor as unknown[]).length === 0)) return null;
  return (
    <div className="mb-4">
      <p className="section-label mb-2">{label}</p>
      {Array.isArray(valor) ? (
        <div className="space-y-1.5">{(valor as string[]).map((v, i) => <Tag key={i} texto={v} />)}</div>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{String(valor)}</p>
      )}
    </div>
  );
}

function ListaItens({ itens, cor }: { itens: string[]; cor: string }) {
  const [ver, setVer] = useState(6);
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
        <button onClick={() => setVer(v => v + 6)} className="w-full py-2 text-xs rounded-lg transition-colors" style={{ color: cor, background: `${cor}10`, border: `1px dashed ${cor}40` }}>
          Ver mais {Math.min(6, itens.length - ver)} itens
        </button>
      )}
    </div>
  );
}

function BadgeStatus({ status, cor }: { status: StatusModulo; cor: string }) {
  if (status === "gerado") return (
    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(110,231,183,0.15)", color: "#6ee7b7" }}>
      <CheckCircle2 size={10} /> Análise gerada
    </span>
  );
  if (status === "preenchendo") return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${cor}15`, color: cor }}>
      Em preenchimento
    </span>
  );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--accent)", color: "var(--muted)" }}>
      Não iniciado
    </span>
  );
}

// ── Renderizadores de resultado por módulo ────────────────────────────────

function ResultadoEmpresa({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="space-y-4">
      <Campo label="Produtos & Serviços" valor={data.produtos} />
      <Campo label="Como Vende" valor={data.como_vende} />
      <div className="grid grid-cols-3 gap-3">
        {([["Ticket Médio", data.ticket], ["Entrada", data.produto_entrada], ["Premium", data.produto_premium]] as [string, unknown][]).map(([l, v]) => v ? (
          <div key={l} className="p-3 rounded-xl text-center" style={{ background: "var(--accent)" }}>
            <p className="text-[10px] mb-1 section-label">{l}</p>
            <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{String(v)}</p>
          </div>
        ) : null)}
      </div>
      <Campo label="Diferenciais Reais" valor={arr(data.diferenciais)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Posicionamento Atual" valor={data.posicionamento_atual} />
        <Campo label="Posicionamento Desejado" valor={data.posicionamento_desejado} />
      </div>
      <Campo label="Valores" valor={arr(data.valores)} />
      <Campo label="Personalidade" valor={data.personalidade} />
      <div className="p-4 rounded-xl" style={{ background: "rgba(200,217,42,0.08)", border: "1px solid rgba(200,217,42,0.2)" }}>
        <p className="section-label mb-1">Promessa Central</p>
        <p className="text-sm font-semibold" style={{ color: "#c8d92a" }}>{String(data.promessa ?? "")}</p>
      </div>
      <div className="p-4 rounded-xl" style={{ background: "rgba(155,143,212,0.08)", border: "1px solid rgba(155,143,212,0.2)" }}>
        <p className="section-label mb-1">Transformação Entregue</p>
        <p className="text-sm" style={{ color: "var(--foreground)" }}>{String(data.transformacao ?? "")}</p>
      </div>
    </div>
  );
}

function ResultadoPersona({ data }: { data: Record<string, unknown> }) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl" style={{ background: "rgba(155,143,212,0.1)", border: "1px solid rgba(155,143,212,0.2)" }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0" style={{ background: "#9b8fd4", color: "#0d2b1e" }}>
          {String(data.nome ?? "P").charAt(0)}
        </div>
        <div>
          <h3 className="font-bold" style={{ color: "#9b8fd4", fontFamily: "var(--font-syne, inherit)" }}>{String(data.nome ?? "")}</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{String(data.perfil ?? "").slice(0, 120)}</p>
        </div>
      </div>
      <Campo label="Rotina" valor={data.rotina} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Objetivos" valor={arr(data.objetivos)} />
        <Campo label="Sonhos" valor={arr(data.sonhos)} />
        <Campo label="Medos" valor={arr(data.medos)} />
        <Campo label="Frustrações" valor={arr(data.frustracoes)} />
        <Campo label="Dores Emocionais" valor={arr(data.dores_emocionais)} />
        <Campo label="Dores Financeiras" valor={arr(data.dores_financeiras)} />
        <Campo label="Dores Práticas" valor={arr(data.dores_praticas)} />
        <Campo label="Desejos Conscientes" valor={arr(data.desejos_conscientes)} />
        <Campo label="Desejos Inconscientes" valor={arr(data.desejos_inconscientes)} />
        <Campo label="Gatilhos de Compra" valor={arr(data.gatilhos_compra)} />
        <Campo label="O que Faz Confiar" valor={arr(data.faz_confiar)} />
        <Campo label="O que Faz Desistir" valor={arr(data.faz_desistir)} />
        <Campo label="Palavras que Usa" valor={arr(data.palavras_usa)} />
        <Campo label="Palavras que Odeia" valor={arr(data.palavras_odeia)} />
        <Campo label="Influenciadores" valor={arr(data.influenciadores)} />
        <Campo label="Conteúdo que Consome" valor={arr(data.conteudo_consome)} />
        <Campo label="Pesquisa no Google" valor={arr(data.pesquisa_google)} />
        <Campo label="Salva no Instagram" valor={arr(data.salva_instagram)} />
      </div>
    </div>
  );
}

function ResultadoJornada({ data }: { data: Record<string, unknown> }) {
  const cores = ["#c8d92a", "#9b8fd4", "#fbbf24", "#6ee7b7", "#f06080"];
  return (
    <div>
      {Array.isArray(data.etapas) && (
        <div className="space-y-3 mb-6">
          {(data.etapas as Array<Record<string, string>>).map((etapa, i) => (
            <div key={etapa.nome} className="p-4 rounded-xl" style={{ background: "var(--accent)", borderLeft: `3px solid ${cores[i] ?? "#c8d92a"}` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold" style={{ color: cores[i], fontFamily: "var(--font-syne, inherit)" }}>ETAPA {String(i + 1).padStart(2, "0")}</span>
                <span className="text-sm font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{etapa.nome}</span>
              </div>
              <p className="text-xs mb-2" style={{ color: "var(--foreground)" }}>{etapa.descricao}</p>
              <div className="flex gap-4 text-xs">
                <span style={{ color: cores[i] }}>Emoção: {etapa.emocao}</span>
                <span style={{ color: "var(--muted)" }}>Ação: {etapa.acao}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Campo label="O que ela tenta sozinha" valor={data.tenta_sozinha} />
      <Campo label="Soluções que Frustraram" valor={arr(data.solucoes_frustradas)} />
      <Campo label="Onde ela Trava" valor={data.onde_trava} />
      <div className="p-4 rounded-xl" style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)" }}>
        <p className="section-label mb-1">O que falta para comprar</p>
        <p className="text-sm" style={{ color: "var(--foreground)" }}>{String(data.o_que_falta ?? "")}</p>
      </div>
    </div>
  );
}

function ResultadoMercado({ data }: { data: Record<string, unknown> }) {
  return (
    <div>
      {Array.isArray(data.concorrentes) && (
        <div className="mb-6">
          <p className="section-label mb-3">Concorrentes</p>
          <div className="space-y-3">
            {(data.concorrentes as Array<Record<string, string>>).map((c, i) => c?.nome ? (
              <div key={i} className="p-4 rounded-xl" style={{ background: "var(--accent)", border: "1px solid var(--card-border)" }}>
                <p className="text-sm font-bold mb-2" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{c.nome}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span style={{ color: "var(--muted)" }}>Como comunica</span><br /><span style={{ color: "var(--foreground)" }}>{c.como_comunica}</span></div>
                  <div><span style={{ color: "var(--muted)" }}>Promessa</span><br /><span style={{ color: "var(--foreground)" }}>{c.promessa}</span></div>
                  <div><span style={{ color: "#f06080" }}>Fraqueza</span><br /><span style={{ color: "var(--foreground)" }}>{c.fraqueza}</span></div>
                </div>
              </div>
            ) : null)}
          </div>
        </div>
      )}
      <Campo label="Oportunidades" valor={arr(data.oportunidades)} />
      <Campo label="Padrões a Quebrar" valor={arr(data.padroes_quebrar)} />
      <Campo label="Tendências" valor={arr(data.tendencias)} />
    </div>
  );
}

function ResultadoPosicionamento({ data }: { data: Record<string, unknown> }) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-xl" style={{ background: "rgba(200,217,42,0.08)", border: "1px solid rgba(200,217,42,0.2)" }}>
          <p className="section-label mb-1">Arquétipo</p>
          <p className="text-sm font-bold" style={{ color: "#c8d92a", fontFamily: "var(--font-syne, inherit)" }}>{String(data.arquetipo ?? "")}</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "rgba(155,143,212,0.08)", border: "1px solid rgba(155,143,212,0.2)" }}>
          <p className="section-label mb-1">Tom de Voz</p>
          <p className="text-sm" style={{ color: "var(--foreground)" }}>{String(data.tom_voz ?? "")}</p>
        </div>
      </div>
      <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(200,217,42,0.1)", border: "1px solid rgba(200,217,42,0.3)" }}>
        <p className="section-label mb-1">Big Idea</p>
        <p className="text-base font-bold leading-snug" style={{ color: "#c8d92a", fontFamily: "var(--font-syne, inherit)" }}>{String(data.big_idea ?? "")}</p>
      </div>
      <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(240,96,128,0.08)", border: "1px solid rgba(240,96,128,0.2)" }}>
        <p className="section-label mb-1">Inimigo Comum</p>
        <p className="text-sm" style={{ color: "var(--foreground)" }}>{String(data.inimigo_comum ?? "")}</p>
      </div>
      <Campo label="Promessa Central" valor={data.promessa_central} />
      <Campo label="Mecanismo Único" valor={data.mecanismo_unico} />
      <Campo label="Diferencial Competitivo" valor={data.diferencial_competitivo} />
      <Campo label="Pilares Editoriais" valor={arr(data.pilares_editoriais)} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Campo label="Crenças a Construir" valor={arr(data.crencas_construir)} />
        <Campo label="Crenças a Quebrar" valor={arr(data.crencas_quebrar)} />
      </div>
    </div>
  );
}

function ResultadoMapa({ data }: { data: Record<string, string[]> }) {
  const categorias = [
    { chave: "dores", label: "Dores", icon: Heart, cor: "#f06080" },
    { chave: "desejos", label: "Desejos", icon: TrendingUp, cor: "#c8d92a" },
    { chave: "objecoes", label: "Objeções", icon: Shield, cor: "#f06080" },
    { chave: "crencas_limitantes", label: "Crenças Limitantes", icon: AlertCircle, cor: "#fbbf24" },
    { chave: "gatilhos_mentais", label: "Gatilhos Mentais", icon: Zap, cor: "#9b8fd4" },
    { chave: "temas_conteudo", label: "Temas de Conteúdo", icon: MessageSquare, cor: "#c8d92a" },
    { chave: "perguntas_frequentes", label: "Perguntas Frequentes", icon: MessageSquare, cor: "#6ee7b7" },
    { chave: "mitos", label: "Mitos", icon: Eye, cor: "#fbbf24" },
    { chave: "erros", label: "Erros Comuns", icon: AlertCircle, cor: "#f06080" },
    { chave: "oportunidades_conteudo", label: "Oportunidades de Conteúdo", icon: Lightbulb, cor: "#c8d92a" },
  ];
  return (
    <div className="space-y-6">
      {categorias.map(({ chave, label, icon: Icon, cor }) => {
        const itens = arr(data[chave]);
        return (
          <div key={chave}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${cor}18` }}>
                <Icon size={12} style={{ color: cor }} />
              </div>
              <p className="text-xs font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{label}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${cor}18`, color: cor }}>{itens.length}</span>
            </div>
            <ListaItens itens={itens} cor={cor} />
          </div>
        );
      })}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────

export default function PersonaPage() {
  const [view, setView] = useState<View>("overview");
  const [moduloAtivo, setModuloAtivo] = useState<ModuloId | null>(null);
  const [estudo, setEstudo] = useState<Record<string, string>>({});
  const [respostas, setRespostas] = useState<Respostas>({});
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/estrategia");
      if (!res.ok) return;
      const data = await res.json() as Record<string, string>;
      setEstudo(data);
      setRespostas(parse<Respostas>(data.respostas, {}));
    } catch { /* ignora */ } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const modulo = MODULOS.find(m => m.id === moduloAtivo);
  const status = (id: ModuloId) => statusModulo(id, estudo, respostas);
  const todosGerados = MODULOS.every(m => status(m.id) === "gerado");
  const temAnaliseCompleta = !!(estudo.secAnaliseCompleta && estudo.secAnaliseCompleta !== "");

  function atualizarResposta(campo: string, valor: string) {
    setRespostas(r => ({ ...r, [campo]: valor }));
  }

  async function salvarRespostas() {
    await fetch("/api/estrategia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respostas }),
    });
  }

  async function gerarModulo(id: ModuloId) {
    setErro(null);
    setGerando(true);
    setView("gerando");

    try {
      await salvarRespostas();

      const res = await fetch("/api/estrategia/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modulo: id, respostas }),
      });

      const data = await res.json() as Record<string, string>;
      if (!res.ok) throw new Error((data as { erro?: string }).erro ?? `Erro ${res.status}`);

      // Atualiza estudo local com o novo dado gerado
      setEstudo(prev => ({ ...prev, ...data }));
      setView("resultado");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido. Tente novamente.");
      setView("form");
    } finally {
      setGerando(false);
    }
  }

  async function gerarCompleto() {
    setErro(null);
    setView("gerando-completo");

    try {
      const res = await fetch("/api/estrategia/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modulo: "completo" }),
      });
      const data = await res.json() as Record<string, string>;
      if (!res.ok) throw new Error((data as { erro?: string }).erro ?? `Erro ${res.status}`);
      setEstudo(prev => ({ ...prev, ...data }));
      setView("analise-completa");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido. Tente novamente.");
      setView("overview");
    }
  }

  // ── Loading inicial ────────────────────────────────────────────────────

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--lime)" }} />
      </div>
    );
  }

  // ── GERANDO (módulo individual) ────────────────────────────────────────

  if (view === "gerando" && gerando) {
    return (
      <div className="min-h-full grid-bg flex flex-col items-center justify-center px-4" style={{ background: "#0d2b1e" }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8" style={{ background: "linear-gradient(135deg, #c8d92a, #9b8fd4)", boxShadow: "0 0 48px rgba(200,217,42,0.4)" }}>
            <Sparkles size={36} style={{ color: "#0d2b1e" }} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
            Gerando análise
          </h2>
          <p className="text-sm" style={{ color: "#6a9a78" }}>
            A IA está processando as suas respostas e gerando a análise do módulo <strong style={{ color: "#c8d92a" }}>{modulo?.titulo}</strong>. Aguarde alguns segundos.
          </p>
          <div className="mt-8 flex items-center gap-3 px-5 py-4 rounded-2xl" style={{ background: "#122a1d", border: "1px solid #1e4535" }}>
            <Loader2 size={16} className="animate-spin shrink-0" style={{ color: "#c8d92a" }} />
            <p className="text-sm text-left" style={{ color: "#b0c9a5" }}>Analisando suas respostas…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── GERANDO (análise completa) ─────────────────────────────────────────

  if (view === "gerando-completo") {
    return (
      <div className="min-h-full grid-bg flex flex-col items-center justify-center px-4" style={{ background: "#0d2b1e" }}>
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8" style={{ background: "linear-gradient(135deg, #c8d92a, #f06080)", boxShadow: "0 0 48px rgba(200,217,42,0.4)" }}>
            <Sparkles size={36} style={{ color: "#0d2b1e" }} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
            Gerando análise estratégica
          </h2>
          <p className="text-sm" style={{ color: "#6a9a78" }}>
            A IA está cruzando todos os módulos e construindo o diagnóstico estratégico completo.
          </p>
          <div className="mt-8 flex items-center gap-3 px-5 py-4 rounded-2xl" style={{ background: "#122a1d", border: "1px solid #1e4535" }}>
            <Loader2 size={16} className="animate-spin shrink-0" style={{ color: "#c8d92a" }} />
            <p className="text-sm text-left" style={{ color: "#b0c9a5" }}>Cruzando dados de todos os módulos…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── FORMULÁRIO DO MÓDULO ───────────────────────────────────────────────

  if (view === "form" && modulo) {
    const Icon = modulo.icon;
    const st = status(modulo.id);

    // Mapa não tem formulário
    if (modulo.perguntas.length === 0) {
      const mapaDesbloqueado = status("persona") === "gerado" || status("empresa") === "gerado";
      return (
        <div className="min-h-full" style={{ background: "var(--background)" }}>
          <div className="max-w-2xl mx-auto px-4 py-6">
            <button onClick={() => setView("overview")} className="flex items-center gap-1.5 text-xs mb-6 transition-colors" style={{ color: "var(--muted)" }}>
              <ChevronLeft size={14} /> Voltar aos módulos
            </button>
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${modulo.cor}18`, border: `1px solid ${modulo.cor}30` }}>
                <Icon size={22} style={{ color: modulo.cor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{modulo.titulo}</h2>
                <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{modulo.descCard}</p>
              </div>
            </div>
            {mapaDesbloqueado ? (
              <div>
                <div className="p-5 rounded-2xl mb-6 text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                  <BookOpen size={32} className="mx-auto mb-3" style={{ color: modulo.cor }} />
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    O Mapa de Comunicação é gerado automaticamente a partir dos dados dos módulos já analisados. Não há formulário para preencher.
                  </p>
                </div>
                <button
                  onClick={() => gerarModulo("mapa")}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                  style={{ background: modulo.cor, color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)", boxShadow: `0 0 24px ${modulo.cor}40` }}
                >
                  <Sparkles size={18} /> Gerar mapa automaticamente
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-2xl text-center" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <Lock size={24} className="mx-auto mb-3" style={{ color: "var(--muted)" }} />
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>Complete outros módulos primeiro</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Gere a análise de pelo menos <strong>Diagnóstico da Empresa</strong> ou <strong>Persona em Profundidade</strong> antes de gerar o Mapa de Comunicação.
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-full" style={{ background: "var(--background)" }}>
        <div className="max-w-2xl mx-auto px-4 py-6">

          <button onClick={() => setView("overview")} className="flex items-center gap-1.5 text-xs mb-6 transition-colors" style={{ color: "var(--muted)" }}>
            <ChevronLeft size={14} /> Voltar aos módulos
          </button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${modulo.cor}18`, border: `1px solid ${modulo.cor}30` }}>
              <Icon size={22} style={{ color: modulo.cor }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{modulo.titulo}</h2>
                <BadgeStatus status={st} cor={modulo.cor} />
              </div>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{modulo.descCard}</p>
            </div>
          </div>

          {st === "gerado" && (
            <div className="mb-6 p-4 rounded-xl flex items-center gap-3 cursor-pointer" style={{ background: "rgba(110,231,183,0.08)", border: "1px solid rgba(110,231,183,0.2)" }} onClick={() => setView("resultado")}>
              <CheckCircle2 size={16} style={{ color: "#6ee7b7" }} className="shrink-0" />
              <p className="text-xs" style={{ color: "#6ee7b7" }}>Análise já gerada. <strong>Clique aqui para ver</strong> — ou edite as respostas abaixo e gere novamente.</p>
            </div>
          )}

          {/* Perguntas */}
          <div className="space-y-6">
            {modulo.perguntas.map((p, i) => (
              <div key={p.campo}>
                <label className="block mb-2">
                  <span className="text-xs font-bold mr-2 tabular-nums" style={{ color: modulo.cor, fontFamily: "var(--font-syne, inherit)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{p.pergunta}</span>
                </label>
                <textarea
                  value={respostas[p.campo] ?? ""}
                  onChange={e => atualizarResposta(p.campo, e.target.value)}
                  rows={4}
                  placeholder={p.exemplo}
                  className="w-full text-sm rounded-xl px-4 py-3 focus:outline-none transition resize-none"
                  style={{
                    background: "var(--card-bg)", color: "var(--foreground)",
                    border: `1px solid ${respostas[p.campo] ? modulo.cor + "60" : "var(--card-border)"}`,
                  }}
                  onFocus={e => (e.target.style.borderColor = modulo.cor + "80")}
                  onBlur={e => (e.target.style.borderColor = respostas[p.campo] ? modulo.cor + "60" : "var(--card-border)")}
                />
              </div>
            ))}
          </div>

          {/* Erro */}
          {erro && (
            <div className="mt-6 p-4 rounded-xl flex gap-3" style={{ background: "rgba(240,96,128,0.1)", border: "1px solid rgba(240,96,128,0.3)" }}>
              <AlertCircle size={16} style={{ color: "#f06080" }} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold mb-0.5" style={{ color: "#f06080" }}>Falha ao gerar análise</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{erro}</p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => gerarModulo(modulo.id)}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
              style={{ background: modulo.cor, color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)", boxShadow: `0 0 24px ${modulo.cor}40` }}
            >
              <Sparkles size={18} />
              {st === "gerado" ? "Regerar análise com novas respostas" : "Salvar e gerar análise"}
            </button>
            <button
              onClick={salvarRespostas}
              className="w-full py-3 text-xs transition-colors"
              style={{ color: "var(--muted)" }}
            >
              Salvar rascunho sem gerar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTADO DO MÓDULO ────────────────────────────────────────────────

  if (view === "resultado" && modulo) {
    const Icon = modulo.icon;
    const secData = parse<Record<string, unknown>>(estudo[modulo.secKey] ?? "", {});

    return (
      <div className="min-h-full" style={{ background: "var(--background)" }}>
        <div className="max-w-3xl mx-auto px-4 py-6">

          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setView("overview")} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: "var(--muted)" }}>
              <ChevronLeft size={14} /> Voltar aos módulos
            </button>
            {modulo.perguntas.length > 0 && (
              <button
                onClick={() => setView("form")}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all"
                style={{ background: "var(--card-bg)", color: "var(--muted)", border: "1px solid var(--card-border)" }}
              >
                <RotateCcw size={12} /> Editar respostas
              </button>
            )}
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8 p-5 rounded-2xl" style={{ background: `${modulo.cor}10`, border: `1px solid ${modulo.cor}30` }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${modulo.cor}20` }}>
              <Icon size={22} style={{ color: modulo.cor }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{modulo.titulo}</h2>
                <CheckCircle2 size={16} style={{ color: "#6ee7b7" }} />
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Análise gerada pela IA com base nas suas respostas</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            {modulo.id === "empresa"        && <ResultadoEmpresa data={secData} />}
            {modulo.id === "persona"        && <ResultadoPersona data={secData} />}
            {modulo.id === "jornada"        && <ResultadoJornada data={secData} />}
            {modulo.id === "mercado"        && <ResultadoMercado data={secData} />}
            {modulo.id === "posicionamento" && <ResultadoPosicionamento data={secData} />}
            {modulo.id === "mapa"           && <ResultadoMapa data={secData as Record<string, string[]>} />}
          </div>

          <div className="mt-6 flex gap-3">
            {modulo.perguntas.length > 0 && (
              <button
                onClick={() => gerarModulo(modulo.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{ background: `${modulo.cor}18`, color: modulo.cor, border: `1px solid ${modulo.cor}40` }}
              >
                <RotateCcw size={12} /> Regerar análise
              </button>
            )}
            <button
              onClick={() => setView("overview")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs transition-all"
              style={{ background: "var(--card-bg)", color: "var(--muted)", border: "1px solid var(--card-border)" }}
            >
              Ver todos os módulos <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ANÁLISE COMPLETA ───────────────────────────────────────────────────

  if (view === "analise-completa") {
    const analise = parse<Record<string, string>>(estudo.secAnaliseCompleta ?? "", {});
    const secoes = [
      { chave: "diagnostico_atual", label: "Diagnóstico Atual", cor: "#c8d92a", icon: Building2 },
      { chave: "conexao_persona_oferta", label: "Conexão Persona × Oferta", cor: "#9b8fd4", icon: User },
      { chave: "lacunas_jornada", label: "Lacunas na Jornada", cor: "#6ee7b7", icon: Map },
      { chave: "coerencia_posicionamento", label: "Coerência do Posicionamento", cor: "#fbbf24", icon: Target },
      { chave: "oportunidades_estrategicas", label: "Oportunidades Estratégicas", cor: "#c8d92a", icon: Lightbulb },
      { chave: "incoerencias", label: "Incoerências Identificadas", cor: "#f06080", icon: AlertCircle },
      { chave: "recomendacoes_conteudo", label: "Recomendações: Conteúdo", cor: "#9b8fd4", icon: MessageSquare },
      { chave: "recomendacoes_marketing", label: "Recomendações: Marketing", cor: "#6ee7b7", icon: TrendingUp },
      { chave: "recomendacoes_vendas", label: "Recomendações: Vendas", cor: "#fbbf24", icon: Zap },
      { chave: "proximos_passos", label: "Próximos Passos (30 dias)", cor: "#c8d92a", icon: CheckCircle2 },
    ];

    return (
      <div className="min-h-full" style={{ background: "var(--background)" }}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setView("overview")} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: "var(--muted)" }}>
              <ChevronLeft size={14} /> Voltar aos módulos
            </button>
            <button
              onClick={gerarCompleto}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all"
              style={{ background: "var(--card-bg)", color: "var(--muted)", border: "1px solid var(--card-border)" }}
            >
              <RotateCcw size={12} /> Regerar
            </button>
          </div>

          <div className="mb-8 p-5 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(200,217,42,0.1), rgba(155,143,212,0.1))", border: "1px solid rgba(200,217,42,0.2)" }}>
            <p className="section-label mb-1">· Análise Estratégica Completa</p>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>
              Visão Estratégica do Negócio
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Síntese gerada pela IA a partir do cruzamento de todos os módulos</p>
          </div>

          <div className="space-y-4">
            {secoes.map(({ chave, label, cor, icon: Icon }) => analise[chave] ? (
              <div key={chave} className="p-5 rounded-2xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderLeft: `3px solid ${cor}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${cor}18` }}>
                    <Icon size={12} style={{ color: cor }} />
                  </div>
                  <p className="text-xs font-bold" style={{ color: cor, fontFamily: "var(--font-syne, inherit)" }}>{label}</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>{analise[chave]}</p>
              </div>
            ) : null)}
          </div>
        </div>
      </div>
    );
  }

  // ── OVERVIEW (página principal com 6 módulos) ──────────────────────────

  const qtdGerados = MODULOS.filter(m => status(m.id) === "gerado").length;

  return (
    <div className="min-h-full" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <p className="section-label mb-2">· Diagnóstico Estratégico</p>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>
            Estudo de Persona & Produto
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            Preencha cada módulo no seu ritmo. A IA gera a análise logo que você conclui cada etapa — sem precisar esperar o questionário inteiro.
          </p>
          {qtdGerados > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--accent)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(qtdGerados / MODULOS.length) * 100}%`, background: "#6ee7b7" }} />
              </div>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{qtdGerados}/{MODULOS.length} módulos</span>
            </div>
          )}
        </div>

        {/* Grid de módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {MODULOS.map(m => {
            const Icon = m.icon;
            const st = status(m.id);
            return (
              <button
                key={m.id}
                onClick={() => {
                  setModuloAtivo(m.id);
                  setErro(null);
                  setView(st === "gerado" ? "resultado" : "form");
                }}
                className="p-5 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "var(--card-bg)",
                  border: st === "gerado"
                    ? "1px solid rgba(110,231,183,0.4)"
                    : `1px solid var(--card-border)`,
                  boxShadow: st === "gerado" ? "0 0 20px rgba(110,231,183,0.08)" : "none",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all" style={{
                    background: st === "gerado" ? `${m.cor}20` : "var(--accent)",
                    border: st === "gerado" ? `1px solid ${m.cor}40` : "1px solid var(--card-border)",
                  }}>
                    <Icon size={18} style={{ color: st === "gerado" ? m.cor : "var(--muted)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{m.titulo}</p>
                      <BadgeStatus status={st} cor={m.cor} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{m.descCard}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: st === "gerado" ? "#6ee7b7" : m.cor }}>
                      {st === "gerado" ? (
                        <><Eye size={11} /> Ver análise</>
                      ) : st === "preenchendo" ? (
                        <><ArrowRight size={11} /> Continuar preenchendo</>
                      ) : (
                        <><ArrowRight size={11} /> {m.perguntas.length === 0 ? "Gerar automaticamente" : "Responder"}</>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Análise estratégica completa */}
        <div className="p-5 rounded-2xl" style={{ background: todosGerados ? "rgba(200,217,42,0.08)" : "var(--card-bg)", border: todosGerados ? "1px solid rgba(200,217,42,0.3)" : "1px solid var(--card-border)" }}>
          {todosGerados ? (
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(200,217,42,0.2)", border: "1px solid rgba(200,217,42,0.3)" }}>
                  <Sparkles size={18} style={{ color: "#c8d92a" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>Todos os módulos concluídos!</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Gere agora a visão estratégica completa — a IA vai cruzar todos os módulos e identificar oportunidades, incoerências e recomendações práticas.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={gerarCompleto}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ background: "#c8d92a", color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)", boxShadow: "0 0 24px rgba(200,217,42,0.3)" }}
                >
                  <Sparkles size={16} /> Gerar análise estratégica completa
                </button>
                {temAnaliseCompleta && (
                  <button
                    onClick={() => setView("analise-completa")}
                    className="px-4 py-3.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: "var(--card-bg)", color: "var(--foreground)", border: "1px solid var(--card-border)" }}
                  >
                    Ver análise
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent)", border: "1px solid var(--card-border)" }}>
                <Lock size={18} style={{ color: "var(--muted)" }} />
              </div>
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>Análise Estratégica Completa</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Disponível quando todos os {MODULOS.length} módulos forem gerados. Faltam <strong style={{ color: "var(--foreground)" }}>{MODULOS.length - qtdGerados} módulo{MODULOS.length - qtdGerados !== 1 ? "s" : ""}</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {erro && (
          <div className="mt-4 p-4 rounded-xl flex gap-3" style={{ background: "rgba(240,96,128,0.1)", border: "1px solid rgba(240,96,128,0.3)" }}>
            <AlertCircle size={16} style={{ color: "#f06080" }} className="shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: "var(--muted)" }}>{erro}</p>
          </div>
        )}
      </div>
    </div>
  );
}
