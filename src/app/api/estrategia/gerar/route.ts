import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { generateObject, jsonSchema } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { chamarIA } from "@/lib/ai/gateway";
import { CONFIG } from "@/lib/config";

export const maxDuration = 300;
export const runtime = "nodejs";

// ── Schemas JSON para generateObject ─────────────────────────────────────────

const SCHEMA_EMPRESA_PERSONA = jsonSchema<{
  empresa: Record<string, unknown>;
  persona: Record<string, unknown>;
}>({
  type: "object",
  properties: {
    empresa: {
      type: "object",
      properties: {
        produtos:               { type: "string" },
        como_vende:             { type: "string" },
        ticket:                 { type: "string" },
        produto_entrada:        { type: "string" },
        produto_premium:        { type: "string" },
        diferenciais:           { type: "array", items: { type: "string" } },
        posicionamento_atual:   { type: "string" },
        posicionamento_desejado:{ type: "string" },
        valores:                { type: "array", items: { type: "string" } },
        personalidade:          { type: "string" },
        promessa:               { type: "string" },
        transformacao:          { type: "string" },
      },
      required: ["produtos", "promessa", "transformacao"],
    },
    persona: {
      type: "object",
      properties: {
        nome:                  { type: "string" },
        perfil:                { type: "string" },
        rotina:                { type: "string" },
        objetivos:             { type: "array", items: { type: "string" } },
        sonhos:                { type: "array", items: { type: "string" } },
        medos:                 { type: "array", items: { type: "string" } },
        frustracoes:           { type: "array", items: { type: "string" } },
        dores_emocionais:      { type: "array", items: { type: "string" } },
        dores_financeiras:     { type: "array", items: { type: "string" } },
        dores_praticas:        { type: "array", items: { type: "string" } },
        desejos_conscientes:   { type: "array", items: { type: "string" } },
        desejos_inconscientes: { type: "array", items: { type: "string" } },
        gatilhos_compra:       { type: "array", items: { type: "string" } },
        valores:               { type: "array", items: { type: "string" } },
        linguagem:             { type: "string" },
        palavras_usa:          { type: "array", items: { type: "string" } },
        palavras_odeia:        { type: "array", items: { type: "string" } },
        influenciadores:       { type: "array", items: { type: "string" } },
        conteudo_consome:      { type: "array", items: { type: "string" } },
        pesquisa_google:       { type: "array", items: { type: "string" } },
        salva_instagram:       { type: "array", items: { type: "string" } },
        faz_confiar:           { type: "array", items: { type: "string" } },
        faz_desistir:          { type: "array", items: { type: "string" } },
      },
      required: ["nome", "perfil"],
    },
  },
  required: ["empresa", "persona"],
});

const SCHEMA_JORNADA_MERCADO_POS = jsonSchema<{
  jornada: Record<string, unknown>;
  mercado: Record<string, unknown>;
  posicionamento: Record<string, unknown>;
}>({
  type: "object",
  properties: {
    jornada: {
      type: "object",
      properties: {
        etapas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nome:     { type: "string" },
              descricao:{ type: "string" },
              emocao:   { type: "string" },
              acao:     { type: "string" },
            },
          },
        },
        tenta_sozinha:       { type: "string" },
        solucoes_frustradas: { type: "array", items: { type: "string" } },
        onde_trava:          { type: "string" },
        o_que_falta:         { type: "string" },
      },
      required: ["etapas", "onde_trava"],
    },
    mercado: {
      type: "object",
      properties: {
        concorrentes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nome:         { type: "string" },
              como_comunica:{ type: "string" },
              promessa:     { type: "string" },
              fraqueza:     { type: "string" },
            },
          },
        },
        oportunidades:   { type: "array", items: { type: "string" } },
        padroes_quebrar: { type: "array", items: { type: "string" } },
        tendencias:      { type: "array", items: { type: "string" } },
      },
      required: ["concorrentes", "oportunidades"],
    },
    posicionamento: {
      type: "object",
      properties: {
        arquetipo:             { type: "string" },
        tom_voz:               { type: "string" },
        personalidade:         { type: "string" },
        pilares_editoriais:    { type: "array", items: { type: "string" } },
        promessa_central:      { type: "string" },
        big_idea:              { type: "string" },
        mecanismo_unico:       { type: "string" },
        diferencial_competitivo:{ type: "string" },
        crencas_construir:     { type: "array", items: { type: "string" } },
        crencas_quebrar:       { type: "array", items: { type: "string" } },
        inimigo_comum:         { type: "string" },
      },
      required: ["big_idea", "inimigo_comum"],
    },
  },
  required: ["jornada", "mercado", "posicionamento"],
});

// ── Obtém instância do modelo ativo ────────────────────────────────────────

async function obterModelo() {
  const configs = await prisma.configIA.findMany({
    where: { ativo: true },
    orderBy: { prioridade: "asc" },
  });

  if (configs.length === 0) throw new Error("Nenhum provedor de IA configurado em Configurações.");

  for (const c of configs) {
    if (c.provedor === "anthropic" && process.env.ANTHROPIC_API_KEY) {
      return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })(
        c.modeloPrincipal || "claude-sonnet-4-6"
      );
    }
    if (c.provedor === "gemini" && process.env.GEMINI_API_KEY) {
      return createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })(
        c.modeloPrincipal || "gemini-2.0-flash"
      );
    }
    if (c.provedor === "openai" && process.env.OPENAI_API_KEY) {
      return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(
        c.modeloPrincipal || "gpt-4o-mini"
      );
    }
  }

  throw new Error("Provedor ativo não tem chave configurada em Variáveis de Ambiente.");
}

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
  let s = texto.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  // Remove trailing commas (common AI mistake)
  s = s.replace(/,(\s*[}\]])/g, "$1");
  try { return JSON.parse(s); } catch { /* continua */ }
  const m = s.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0].replace(/,(\s*[}\]])/g, "$1")); } catch { /* continua */ }
  }
  return null;
}

// ── Handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const fase: number = body.fase ?? 1;
  const R = (body.respostas ?? {}) as Record<string, string>;

  // ── FASE 1: empresa + persona via generateObject ───────────────────────────
  if (fase === 1) {
    await garantirTabela();
    await prisma.estudoEstrategico.upsert({
      where: { id: "default" },
      update: { status: "gerando", respostas: JSON.stringify(R) },
      create: { id: "default", status: "gerando", respostas: JSON.stringify(R) },
    });

    let model;
    try {
      model = await obterModelo();
    } catch (e) {
      return NextResponse.json({ erro: String(e) }, { status: 500 });
    }

    const prompt1 = `
Empresa: ${CONFIG.nome} — varejo Apple, Londrina-PR

RESPOSTAS DA ENTREVISTA:
Produtos: ${R.empresa_produtos || ""}
Como vende: ${R.empresa_como_vende || ""}
Ticket e produtos: ${R.empresa_ticket || ""}
Diferenciais: ${R.empresa_diferenciais || ""}
Posicionamento: ${R.empresa_posicionamento || ""}
Valores e promessa: ${R.empresa_valores || ""}
Perfil da persona: ${R.persona_perfil || ""}
Rotina: ${R.persona_rotina || ""}
Objetivos/medos/dores: ${R.persona_objetivos || ""}
Confiança vs desistência: ${R.persona_confianca || ""}
Linguagem digital: ${R.persona_linguagem || ""}
Influenciadores: ${R.persona_influencia || ""}

Gere a análise estratégica de empresa e persona com base nas respostas acima.
Valores de string: máximo 20 palavras. Arrays: máximo 4 itens de até 10 palavras cada.`.trim();

    try {
      const { object } = await generateObject({
        model,
        schema: SCHEMA_EMPRESA_PERSONA,
        system: "Você é um estrategista de marketing especializado em varejo premium e branding. Seja direto e específico para este negócio.",
        prompt: prompt1,
        maxOutputTokens: 1500,
      });

      await prisma.estudoEstrategico.upsert({
        where: { id: "default" },
        update: {
          secEmpresa: JSON.stringify(object.empresa ?? {}),
          secPersona: JSON.stringify(object.persona ?? {}),
          status: "gerando",
        },
        create: {
          id: "default",
          respostas: JSON.stringify(R),
          secEmpresa: JSON.stringify(object.empresa ?? {}),
          secPersona: JSON.stringify(object.persona ?? {}),
          status: "gerando",
        },
      });

      return NextResponse.json({ ok: true, fase: 1 });
    } catch (e) {
      console.error("[estrategia-gerar fase1] generateObject falhou:", e);
      return NextResponse.json({ erro: `Falha na fase 1: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
    }
  }

  // ── FASE 2: jornada + mercado + posicionamento via generateObject ─────────
  if (fase === 2) {
    let model;
    try {
      model = await obterModelo();
    } catch (e) {
      return NextResponse.json({ erro: String(e) }, { status: 500 });
    }

    const prompt2 = `
Empresa: ${CONFIG.nome} — varejo Apple, Londrina-PR

RESPOSTAS DA ENTREVISTA:
Percepção do problema: ${R.jornada_percebe || ""}
Soluções frustradas: ${R.jornada_trava || ""}
Emoções na jornada: ${R.jornada_emocoes || ""}
Concorrentes: ${R.mercado_concorrentes || ""}
Oportunidades: ${R.mercado_oportunidades || ""}
Tendências: ${R.mercado_tendencias || ""}
Personalidade da marca: ${R.pos_personalidade || ""}
Big Idea: ${R.pos_big_idea || ""}
Crenças e inimigo: ${R.pos_crencas || ""}

Gere jornada do cliente (5 etapas), análise de mercado e posicionamento estratégico.
Valores de string: máximo 20 palavras. Arrays: máximo 4 itens.`.trim();

    try {
      const { object } = await generateObject({
        model,
        schema: SCHEMA_JORNADA_MERCADO_POS,
        system: "Você é um estrategista de marketing especializado em varejo premium e branding. Seja direto e específico para este negócio.",
        prompt: prompt2,
        maxOutputTokens: 1200,
      });

      await prisma.estudoEstrategico.upsert({
        where: { id: "default" },
        update: {
          secJornada: JSON.stringify(object.jornada ?? {}),
          secMercado: JSON.stringify(object.mercado ?? {}),
          secPosicionamento: JSON.stringify(object.posicionamento ?? {}),
          status: "gerando",
        },
        create: {
          id: "default",
          secJornada: JSON.stringify(object.jornada ?? {}),
          secMercado: JSON.stringify(object.mercado ?? {}),
          secPosicionamento: JSON.stringify(object.posicionamento ?? {}),
          status: "gerando",
        },
      });

      return NextResponse.json({ ok: true, fase: 2 });
    } catch (e) {
      console.error("[estrategia-gerar fase2] generateObject falhou:", e);
      return NextResponse.json({ erro: `Falha na fase 2: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
    }
  }

  // ── FASE 3: mapa via chamarIA (texto + parse) ─────────────────────────────
  if (fase === 3) {
    const estudo = await prisma.estudoEstrategico.findUnique({ where: { id: "default" } });

    let personaNome = "cliente ideal";
    let personaPerfil = "";
    try {
      const p = JSON.parse(estudo?.secPersona ?? "{}") as Record<string, unknown>;
      personaNome = String(p.nome ?? "cliente ideal");
      personaPerfil = String(p.perfil ?? "").slice(0, 120);
    } catch { /* ignora */ }

    const prompt3 = `Empresa: ${CONFIG.nome}. Persona: ${personaNome} — ${personaPerfil}

Retorne SOMENTE o JSON abaixo, sem nenhum texto fora, sem markdown:
{"dores":["item1","item2","item3","item4","item5","item6"],"desejos":["item1","item2","item3","item4","item5","item6"],"objecoes":["item1","item2","item3","item4","item5","item6"],"crencas_limitantes":["item1","item2","item3","item4","item5","item6"],"gatilhos_mentais":["item1","item2","item3","item4","item5","item6"],"temas_conteudo":["item1","item2","item3","item4","item5","item6"],"perguntas_frequentes":["item1","item2","item3","item4","item5","item6"],"mitos":["item1","item2","item3","item4","item5","item6"],"erros":["item1","item2","item3","item4","item5","item6"],"oportunidades_conteudo":["item1","item2","item3","item4","item5","item6"]}

Substitua item1..item6 por itens específicos e reais para o negócio. Máximo 12 palavras por item.`;

    const r3 = await chamarIA({
      funcionalidade: "estrategia-mapa",
      sistema: "Retorne SOMENTE o JSON pedido. Nenhum texto fora do JSON.",
      prompt: prompt3,
      maxTokens: 1000,
    });

    if (!r3.sucesso) {
      return NextResponse.json({ erro: `Mapa IA falhou: ${r3.erro}` }, { status: 500 });
    }

    const mapa = extrairJSON(r3.conteudo);
    if (!mapa) {
      console.error("[estrategia-gerar fase3] JSON inválido. Raw:", r3.conteudo.slice(0, 400));
      return NextResponse.json({ erro: "Erro no mapa de comunicação. Tente novamente." }, { status: 500 });
    }

    const atualizado = await prisma.estudoEstrategico.upsert({
      where: { id: "default" },
      update: { secMapa: JSON.stringify(mapa), status: "completo" },
      create: { id: "default", secMapa: JSON.stringify(mapa), status: "completo" },
    });

    return NextResponse.json(atualizado);
  }

  return NextResponse.json({ erro: "Fase inválida" }, { status: 400 });
}
