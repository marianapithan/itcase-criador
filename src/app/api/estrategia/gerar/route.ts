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

const SCHEMA_EMPRESA = jsonSchema<{ empresa: Record<string, unknown> }>({
  type: "object",
  properties: {
    empresa: {
      type: "object",
      properties: {
        produtos:                { type: "string" },
        como_vende:              { type: "string" },
        ticket:                  { type: "string" },
        produto_entrada:         { type: "string" },
        produto_premium:         { type: "string" },
        diferenciais:            { type: "array", items: { type: "string" } },
        posicionamento_atual:    { type: "string" },
        posicionamento_desejado: { type: "string" },
        valores:                 { type: "array", items: { type: "string" } },
        personalidade:           { type: "string" },
        promessa:                { type: "string" },
        transformacao:           { type: "string" },
      },
      required: ["produtos", "como_vende", "ticket", "produto_entrada", "produto_premium",
                 "diferenciais", "posicionamento_atual", "posicionamento_desejado",
                 "valores", "personalidade", "promessa", "transformacao"],
    },
  },
  required: ["empresa"],
});

const SCHEMA_PERSONA = jsonSchema<{ persona: Record<string, unknown> }>({
  type: "object",
  properties: {
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
      required: ["nome", "perfil", "rotina", "objetivos", "sonhos", "medos",
                 "frustracoes", "dores_emocionais", "dores_financeiras", "dores_praticas",
                 "desejos_conscientes", "desejos_inconscientes", "gatilhos_compra",
                 "valores", "linguagem", "palavras_usa", "palavras_odeia",
                 "influenciadores", "conteudo_consome", "pesquisa_google",
                 "salva_instagram", "faz_confiar", "faz_desistir"],
    },
  },
  required: ["persona"],
});

const SCHEMA_JORNADA = jsonSchema<{ jornada: Record<string, unknown> }>({
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
              nome:      { type: "string" },
              descricao: { type: "string" },
              emocao:    { type: "string" },
              acao:      { type: "string" },
            },
            required: ["nome", "descricao", "emocao", "acao"],
          },
        },
        tenta_sozinha:       { type: "string" },
        solucoes_frustradas: { type: "array", items: { type: "string" } },
        onde_trava:          { type: "string" },
        o_que_falta:         { type: "string" },
      },
      required: ["etapas", "tenta_sozinha", "solucoes_frustradas", "onde_trava", "o_que_falta"],
    },
  },
  required: ["jornada"],
});

const SCHEMA_MERCADO_POS = jsonSchema<{
  mercado: Record<string, unknown>;
  posicionamento: Record<string, unknown>;
}>({
  type: "object",
  properties: {
    mercado: {
      type: "object",
      properties: {
        concorrentes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nome:          { type: "string" },
              como_comunica: { type: "string" },
              promessa:      { type: "string" },
              fraqueza:      { type: "string" },
            },
            required: ["nome", "como_comunica", "promessa", "fraqueza"],
          },
        },
        oportunidades:   { type: "array", items: { type: "string" } },
        padroes_quebrar: { type: "array", items: { type: "string" } },
        tendencias:      { type: "array", items: { type: "string" } },
      },
      required: ["concorrentes", "oportunidades", "padroes_quebrar", "tendencias"],
    },
    posicionamento: {
      type: "object",
      properties: {
        arquetipo:              { type: "string" },
        tom_voz:                { type: "string" },
        personalidade:          { type: "string" },
        pilares_editoriais:     { type: "array", items: { type: "string" } },
        promessa_central:       { type: "string" },
        big_idea:               { type: "string" },
        mecanismo_unico:        { type: "string" },
        diferencial_competitivo:{ type: "string" },
        crencas_construir:      { type: "array", items: { type: "string" } },
        crencas_quebrar:        { type: "array", items: { type: "string" } },
        inimigo_comum:          { type: "string" },
      },
      required: ["arquetipo", "tom_voz", "personalidade", "pilares_editoriais",
                 "promessa_central", "big_idea", "mecanismo_unico",
                 "diferencial_competitivo", "crencas_construir", "crencas_quebrar",
                 "inimigo_comum"],
    },
  },
  required: ["mercado", "posicionamento"],
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

  const SISTEMA_OBJ = "Você é um estrategista de marketing especializado em varejo premium. Seja direto e específico para este negócio. Máximo 20 palavras por string, 4 itens por array.";

  // ── FASE 1a: empresa (12 campos, todos required) ───────────────────────────
  // ── FASE 1b: persona (23 campos, todos required) ──────────────────────────
  if (fase === 1) {
    await garantirTabela();
    await prisma.estudoEstrategico.upsert({
      where: { id: "default" },
      update: { status: "gerando", respostas: JSON.stringify(R) },
      create: { id: "default", status: "gerando", respostas: JSON.stringify(R) },
    });

    let model;
    try { model = await obterModelo(); }
    catch (e) { return NextResponse.json({ erro: String(e) }, { status: 500 }); }

    const baseEmpresa = `Empresa: ${CONFIG.nome} — varejo Apple, Londrina-PR\nProdutos: ${R.empresa_produtos || ""}\nComo vende: ${R.empresa_como_vende || ""}\nTicket: ${R.empresa_ticket || ""}\nDiferenciais: ${R.empresa_diferenciais || ""}\nPosicionamento: ${R.empresa_posicionamento || ""}\nValores/promessa: ${R.empresa_valores || ""}`;

    const basePersona = `Empresa: ${CONFIG.nome} — varejo Apple, Londrina-PR\nPerfil: ${R.persona_perfil || ""}\nRotina: ${R.persona_rotina || ""}\nObjetivos/medos/dores: ${R.persona_objetivos || ""}\nConfiança vs desistência: ${R.persona_confianca || ""}\nLinguagem: ${R.persona_linguagem || ""}\nInfluenciadores: ${R.persona_influencia || ""}`;

    try {
      const [{ object: obj1 }, { object: obj2 }] = await Promise.all([
        generateObject({ model, schema: SCHEMA_EMPRESA, system: SISTEMA_OBJ, prompt: baseEmpresa + "\n\nGere a análise estratégica da empresa.", maxOutputTokens: 600 }),
        generateObject({ model, schema: SCHEMA_PERSONA, system: SISTEMA_OBJ, prompt: basePersona + "\n\nGere a análise completa da persona com nome fictício realista.", maxOutputTokens: 900 }),
      ]);

      await prisma.estudoEstrategico.upsert({
        where: { id: "default" },
        update: { secEmpresa: JSON.stringify(obj1.empresa), secPersona: JSON.stringify(obj2.persona), status: "gerando" },
        create: { id: "default", respostas: JSON.stringify(R), secEmpresa: JSON.stringify(obj1.empresa), secPersona: JSON.stringify(obj2.persona), status: "gerando" },
      });

      return NextResponse.json({ ok: true, fase: 1 });
    } catch (e) {
      console.error("[estrategia-gerar fase1]", e);
      return NextResponse.json({ erro: `Falha na fase 1: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 });
    }
  }

  // ── FASE 2a: jornada | FASE 2b: mercado + posicionamento ─────────────────
  if (fase === 2) {
    let model;
    try { model = await obterModelo(); }
    catch (e) { return NextResponse.json({ erro: String(e) }, { status: 500 }); }

    const baseJornada = `Empresa: ${CONFIG.nome}\nPercepção do problema: ${R.jornada_percebe || ""}\nSoluções frustradas: ${R.jornada_trava || ""}\nEmoções: ${R.jornada_emocoes || ""}`;
    const baseMercadoPos = `Empresa: ${CONFIG.nome}\nConcorrentes: ${R.mercado_concorrentes || ""}\nOportunidades: ${R.mercado_oportunidades || ""}\nTendências: ${R.mercado_tendencias || ""}\nPersonalidade: ${R.pos_personalidade || ""}\nBig Idea: ${R.pos_big_idea || ""}\nCrenças/inimigo: ${R.pos_crencas || ""}`;

    try {
      const [{ object: obj3 }, { object: obj4 }] = await Promise.all([
        generateObject({ model, schema: SCHEMA_JORNADA, system: SISTEMA_OBJ, prompt: baseJornada + "\n\nGere a jornada do cliente em 5 etapas.", maxOutputTokens: 600 }),
        generateObject({ model, schema: SCHEMA_MERCADO_POS, system: SISTEMA_OBJ, prompt: baseMercadoPos + "\n\nGere análise de mercado e posicionamento estratégico.", maxOutputTokens: 700 }),
      ]);

      await prisma.estudoEstrategico.upsert({
        where: { id: "default" },
        update: { secJornada: JSON.stringify(obj3.jornada), secMercado: JSON.stringify(obj4.mercado), secPosicionamento: JSON.stringify(obj4.posicionamento), status: "gerando" },
        create: { id: "default", secJornada: JSON.stringify(obj3.jornada), secMercado: JSON.stringify(obj4.mercado), secPosicionamento: JSON.stringify(obj4.posicionamento), status: "gerando" },
      });

      return NextResponse.json({ ok: true, fase: 2 });
    } catch (e) {
      console.error("[estrategia-gerar fase2]", e);
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
