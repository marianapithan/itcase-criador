import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA } from "@/lib/ai/gateway";
import { CONFIG } from "@/lib/config";

export const maxDuration = 300;
export const runtime = "nodejs";

const SISTEMA = "Você é um estrategista de marketing de elite especializado em varejo premium e branding. Retorne SOMENTE o objeto JSON pedido, sem markdown, sem explicação, sem texto fora do JSON.";

async function garantirTabela() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EstudoEstrategico" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
        "respostas" TEXT NOT NULL DEFAULT '{}',
        "secEmpresa" TEXT NOT NULL DEFAULT '',
        "secPersona" TEXT NOT NULL DEFAULT '',
        "secJornada" TEXT NOT NULL DEFAULT '',
        "secMercado" TEXT NOT NULL DEFAULT '',
        "secPosicionamento" TEXT NOT NULL DEFAULT '',
        "secMapa" TEXT NOT NULL DEFAULT '',
        "status" TEXT NOT NULL DEFAULT 'novo',
        "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch { /* tabela já existe */ }
}

function extrairJSON(texto: string): Record<string, unknown> | null {
  const limpo = texto.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(limpo); } catch { /* continua */ }
  const match = limpo.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* continua */ } }
  return null;
}

// ── FASE 1: Seções 1-5 (empresa, persona, jornada, mercado, posicionamento) ──

async function gerarSecoes(R: Record<string, string>) {
  const empresa = CONFIG.nome;
  const prompt = `
Empresa: ${empresa}

RESPOSTAS DA ENTREVISTA ESTRATÉGICA:

[EMPRESA]
Produtos e serviços: ${R.empresa_produtos || ""}
Como vende: ${R.empresa_como_vende || ""}
Ticket médio e produtos: ${R.empresa_ticket || ""}
Diferenciais reais: ${R.empresa_diferenciais || ""}
Posicionamento atual vs desejado: ${R.empresa_posicionamento || ""}
Valores, personalidade, promessa, transformação: ${R.empresa_valores || ""}

[PERSONA]
Perfil demográfico: ${R.persona_perfil || ""}
Rotina e estilo de vida: ${R.persona_rotina || ""}
Objetivos, sonhos, medos, dores: ${R.persona_objetivos || ""}
O que faz confiar vs desistir: ${R.persona_confianca || ""}
Linguagem e comportamento digital: ${R.persona_linguagem || ""}
Influenciadores e hábitos de pesquisa: ${R.persona_influencia || ""}

[JORNADA]
Como percebe o problema: ${R.jornada_percebe || ""}
Soluções frustradas e onde trava: ${R.jornada_trava || ""}
Emoções em cada etapa: ${R.jornada_emocoes || ""}

[MERCADO]
Concorrentes e comunicação: ${R.mercado_concorrentes || ""}
Oportunidades e padrões a quebrar: ${R.mercado_oportunidades || ""}
Tendências relevantes: ${R.mercado_tendencias || ""}

[POSICIONAMENTO]
Personalidade da marca: ${R.pos_personalidade || ""}
Big Idea e mecanismo único: ${R.pos_big_idea || ""}
Inimigo comum e crenças: ${R.pos_crencas || ""}

Gere o documento estratégico completo em JSON:

{
  "empresa": {
    "produtos": "lista completa",
    "como_vende": "canais e processo",
    "ticket": "ticket médio",
    "produto_entrada": "produto mais acessível",
    "produto_premium": "produto mais caro",
    "diferenciais": ["diferencial 1", "diferencial 2", "diferencial 3", "diferencial 4", "diferencial 5"],
    "posicionamento_atual": "como está hoje",
    "posicionamento_desejado": "onde quer chegar",
    "valores": ["valor 1", "valor 2", "valor 3"],
    "personalidade": "como a marca se comporta",
    "promessa": "promessa central",
    "transformacao": "antes e depois do cliente"
  },
  "persona": {
    "nome": "nome da persona",
    "perfil": "resumo completo",
    "rotina": "dia a dia",
    "objetivos": ["obj 1", "obj 2", "obj 3"],
    "sonhos": ["sonho 1", "sonho 2"],
    "medos": ["medo 1", "medo 2", "medo 3"],
    "frustracoes": ["frustração 1", "frustração 2"],
    "dores_emocionais": ["dor 1", "dor 2"],
    "dores_financeiras": ["dor 1", "dor 2"],
    "dores_praticas": ["dor 1", "dor 2"],
    "desejos_conscientes": ["desejo 1", "desejo 2"],
    "desejos_inconscientes": ["desejo 1", "desejo 2"],
    "gatilhos_compra": ["gatilho 1", "gatilho 2", "gatilho 3"],
    "valores": ["valor 1", "valor 2"],
    "linguagem": "como fala e vocabulário",
    "palavras_usa": ["expressão 1", "expressão 2", "expressão 3"],
    "palavras_odeia": ["palavra 1", "palavra 2"],
    "influenciadores": ["quem 1", "quem 2"],
    "conteudo_consome": ["tipo 1", "tipo 2"],
    "pesquisa_google": ["busca 1", "busca 2", "busca 3"],
    "salva_instagram": ["tipo 1", "tipo 2"],
    "faz_confiar": ["fator 1", "fator 2", "fator 3"],
    "faz_desistir": ["fator 1", "fator 2"]
  },
  "jornada": {
    "etapas": [
      {"nome": "Consciência", "descricao": "...", "emocao": "...", "acao": "..."},
      {"nome": "Consideração", "descricao": "...", "emocao": "...", "acao": "..."},
      {"nome": "Decisão", "descricao": "...", "emocao": "...", "acao": "..."},
      {"nome": "Compra", "descricao": "...", "emocao": "...", "acao": "..."},
      {"nome": "Pos-compra", "descricao": "...", "emocao": "...", "acao": "..."}
    ],
    "tenta_sozinha": "o que faz antes de comprar",
    "solucoes_frustradas": ["frustração 1", "frustração 2"],
    "onde_trava": "ponto exato onde para",
    "o_que_falta": "o que precisa para decidir"
  },
  "mercado": {
    "concorrentes": [
      {"nome": "concorrente 1", "como_comunica": "...", "promessa": "...", "fraqueza": "..."},
      {"nome": "concorrente 2", "como_comunica": "...", "promessa": "...", "fraqueza": "..."}
    ],
    "oportunidades": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
    "padroes_quebrar": ["padrão 1", "padrão 2"],
    "tendencias": ["tendência 1", "tendência 2", "tendência 3"]
  },
  "posicionamento": {
    "arquetipo": "arquétipo principal",
    "tom_voz": "como a marca fala",
    "personalidade": "traços de personalidade",
    "pilares_editoriais": ["pilar 1", "pilar 2", "pilar 3", "pilar 4"],
    "promessa_central": "a promessa única",
    "big_idea": "a grande ideia",
    "mecanismo_unico": "o diferencial que só essa marca tem",
    "diferencial_competitivo": "vantagem principal",
    "crencas_construir": ["crença 1", "crença 2", "crença 3"],
    "crencas_quebrar": ["crença 1", "crença 2"],
    "inimigo_comum": "o inimigo compartilhado"
  }
}`.trim();

  return chamarIA({ funcionalidade: "estrategia-secoes", sistema: SISTEMA, prompt, maxTokens: 2500 });
}

// ── FASE 2: Mapa de comunicação (10 categorias × 15 itens = 150 insights) ───

async function gerarMapa(personaNome: string, personaPerfil: string) {
  const empresa = CONFIG.nome;
  const prompt = `
Empresa: ${empresa}
Persona: ${personaNome} — ${personaPerfil.slice(0, 150)}
Setor: varejo Apple, Londrina-PR

Gere um mapa de comunicação específico e concreto. Cada item deve ser pronto para virar conteúdo.
Gere EXATAMENTE 8 itens em cada categoria. Seja direto, sem texto extra.

{
  "dores": ["dor específica 1", "dor 2", "dor 3", "dor 4", "dor 5", "dor 6", "dor 7", "dor 8"],
  "desejos": ["desejo 1",...8 itens],
  "objecoes": ["objeção 1",...8 itens],
  "crencas_limitantes": ["crença 1",...8 itens],
  "gatilhos_mentais": ["gatilho: como aplicar",...8 itens],
  "temas_conteudo": ["tema concreto 1",...8 itens],
  "perguntas_frequentes": ["pergunta real 1",...8 itens],
  "mitos": ["mito do cliente 1",...8 itens],
  "erros": ["erro comum 1",...8 itens],
  "oportunidades_conteudo": ["oportunidade 1",...8 itens]
}`.trim();

  return chamarIA({ funcionalidade: "estrategia-mapa", sistema: SISTEMA, prompt, maxTokens: 1600 });
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const fase: number = body.fase ?? 1;
  const R = (body.respostas ?? {}) as Record<string, string>;

  // ── FASE 1 ────────────────────────────────────────────────────────────────
  if (fase === 1) {
    // Garante tabela e salva rascunho antes do call de IA
    await garantirTabela();
    await prisma.estudoEstrategico.upsert({
      where: { id: "default" },
      update: { status: "gerando", respostas: JSON.stringify(R) },
      create: { id: "default", status: "gerando", respostas: JSON.stringify(R) },
    });

    const r1 = await gerarSecoes(R);
    if (!r1.sucesso) {
      return NextResponse.json({ erro: `Falha na IA: ${r1.erro}` }, { status: 500 });
    }

    const secoes = extrairJSON(r1.conteudo);
    if (!secoes) {
      return NextResponse.json(
        { erro: `A IA retornou um JSON inválido ou incompleto. Tente novamente — pode ser instabilidade da API.` },
        { status: 500 }
      );
    }

    await prisma.estudoEstrategico.upsert({
      where: { id: "default" },
      update: {
        secEmpresa: JSON.stringify(secoes.empresa ?? {}),
        secPersona: JSON.stringify(secoes.persona ?? {}),
        secJornada: JSON.stringify(secoes.jornada ?? {}),
        secMercado: JSON.stringify(secoes.mercado ?? {}),
        secPosicionamento: JSON.stringify(secoes.posicionamento ?? {}),
        status: "parcial",
      },
      create: {
        id: "default",
        respostas: JSON.stringify(R),
        secEmpresa: JSON.stringify(secoes.empresa ?? {}),
        secPersona: JSON.stringify(secoes.persona ?? {}),
        secJornada: JSON.stringify(secoes.jornada ?? {}),
        secMercado: JSON.stringify(secoes.mercado ?? {}),
        secPosicionamento: JSON.stringify(secoes.posicionamento ?? {}),
        status: "parcial",
      },
    });

    return NextResponse.json({ ok: true, fase: 1 });
  }

  // ── FASE 2 ────────────────────────────────────────────────────────────────
  // Tabela já garantida pelo Phase 1 — pula DDL
  if (fase === 2) {
    const estudo = await prisma.estudoEstrategico.findUnique({ where: { id: "default" } });

    let personaNome = "cliente ideal";
    let personaPerfil = "";
    try {
      const p = JSON.parse(estudo?.secPersona ?? "{}") as Record<string, unknown>;
      personaNome = String(p.nome ?? "cliente ideal");
      personaPerfil = String(p.perfil ?? "");
    } catch { /* ignora */ }

    const r2 = await gerarMapa(personaNome, personaPerfil);
    if (!r2.sucesso) {
      return NextResponse.json({ erro: `Falha no mapa: ${r2.erro}` }, { status: 500 });
    }

    const mapa = extrairJSON(r2.conteudo) ?? {};

    const atualizado = await prisma.estudoEstrategico.upsert({
      where: { id: "default" },
      update: { secMapa: JSON.stringify(mapa), status: "completo" },
      create: { id: "default", secMapa: JSON.stringify(mapa), status: "completo" },
    });

    return NextResponse.json(atualizado);
  }

  return NextResponse.json({ erro: "Fase inválida" }, { status: 400 });
}
