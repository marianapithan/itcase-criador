import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA } from "@/lib/ai/gateway";
import { CONFIG } from "@/lib/config";

export const maxDuration = 300;
export const runtime = "nodejs";

const SISTEMA =
  "Você é um estrategista de marketing especializado em varejo premium. " +
  "Retorne SOMENTE o JSON pedido, sem markdown, sem texto fora do JSON. " +
  "Valores de string: máximo 20 palavras. Arrays: máximo 4 itens de 8 palavras cada. " +
  "Seja direto e específico para o negócio descrito.";

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

// ── FASE 1: Empresa + Persona (~700 tokens saída) ─────────────────────────

async function gerarEmpresaPersona(R: Record<string, string>) {
  const prompt = `
Empresa: ${CONFIG.nome}
Setor: varejo Apple, Londrina-PR

RESPOSTAS:
Produtos: ${R.empresa_produtos || ""}
Como vende: ${R.empresa_como_vende || ""}
Ticket e produtos: ${R.empresa_ticket || ""}
Diferenciais: ${R.empresa_diferenciais || ""}
Posicionamento: ${R.empresa_posicionamento || ""}
Valores e promessa: ${R.empresa_valores || ""}
Perfil da persona: ${R.persona_perfil || ""}
Rotina da persona: ${R.persona_rotina || ""}
Objetivos/medos/dores: ${R.persona_objetivos || ""}
Confiança vs desistência: ${R.persona_confianca || ""}
Linguagem digital: ${R.persona_linguagem || ""}
Influenciadores: ${R.persona_influencia || ""}

Gere JSON com empresa e persona. Arrays: até 4 itens. Strings: até 20 palavras.

{"empresa":{"produtos":"...","como_vende":"...","ticket":"...","produto_entrada":"...","produto_premium":"...","diferenciais":["...","...","...","..."],"posicionamento_atual":"...","posicionamento_desejado":"...","valores":["...","...","..."],"personalidade":"...","promessa":"...","transformacao":"..."},"persona":{"nome":"...","perfil":"...","rotina":"...","objetivos":["...","...","..."],"sonhos":["...","..."],"medos":["...","...","..."],"frustracoes":["...","..."],"dores_emocionais":["...","..."],"dores_financeiras":["...","..."],"dores_praticas":["...","..."],"desejos_conscientes":["...","..."],"desejos_inconscientes":["...","..."],"gatilhos_compra":["...","...","..."],"valores":["...","..."],"linguagem":"...","palavras_usa":["...","...","..."],"palavras_odeia":["...","..."],"influenciadores":["...","..."],"conteudo_consome":["...","..."],"pesquisa_google":["...","...","..."],"salva_instagram":["...","..."],"faz_confiar":["...","...","..."],"faz_desistir":["...","..."]}}`.trim();

  return chamarIA({ funcionalidade: "estrategia-empresa-persona", sistema: SISTEMA, prompt, maxTokens: 1200 });
}

// ── FASE 2: Jornada + Mercado + Posicionamento (~600 tokens saída) ────────

async function gerarJornadaMercadoPos(R: Record<string, string>) {
  const prompt = `
Empresa: ${CONFIG.nome}
Setor: varejo Apple, Londrina-PR

RESPOSTAS:
Percepção do problema: ${R.jornada_percebe || ""}
Soluções frustradas: ${R.jornada_trava || ""}
Emoções na jornada: ${R.jornada_emocoes || ""}
Concorrentes: ${R.mercado_concorrentes || ""}
Oportunidades: ${R.mercado_oportunidades || ""}
Tendências: ${R.mercado_tendencias || ""}
Personalidade da marca: ${R.pos_personalidade || ""}
Big Idea: ${R.pos_big_idea || ""}
Crenças e inimigo: ${R.pos_crencas || ""}

Gere JSON com jornada, mercado e posicionamento. Arrays: até 4 itens. Strings: até 20 palavras.

{"jornada":{"etapas":[{"nome":"Consciência","descricao":"...","emocao":"...","acao":"..."},{"nome":"Consideração","descricao":"...","emocao":"...","acao":"..."},{"nome":"Decisão","descricao":"...","emocao":"...","acao":"..."},{"nome":"Compra","descricao":"...","emocao":"...","acao":"..."},{"nome":"Pos-compra","descricao":"...","emocao":"...","acao":"..."}],"tenta_sozinha":"...","solucoes_frustradas":["...","..."],"onde_trava":"...","o_que_falta":"..."},"mercado":{"concorrentes":[{"nome":"...","como_comunica":"...","promessa":"...","fraqueza":"..."},{"nome":"...","como_comunica":"...","promessa":"...","fraqueza":"..."}],"oportunidades":["...","...","..."],"padroes_quebrar":["...","..."],"tendencias":["...","...","..."]},"posicionamento":{"arquetipo":"...","tom_voz":"...","personalidade":"...","pilares_editoriais":["...","...","...","..."],"promessa_central":"...","big_idea":"...","mecanismo_unico":"...","diferencial_competitivo":"...","crencas_construir":["...","...","..."],"crencas_quebrar":["...","..."],"inimigo_comum":"..."}}`.trim();

  return chamarIA({ funcionalidade: "estrategia-jornada-mercado", sistema: SISTEMA, prompt, maxTokens: 1000 });
}

// ── FASE 3: Mapa de comunicação (~1000 tokens saída) ──────────────────────

async function gerarMapa(personaNome: string, personaPerfil: string) {
  const prompt = `
Empresa: ${CONFIG.nome}
Persona: ${personaNome} — ${personaPerfil.slice(0, 120)}

Gere mapa de comunicação específico. 6 itens por categoria. Itens diretos, até 12 palavras.

{"dores":["...","...","...","...","...","..."],"desejos":["...","...","...","...","...","..."],"objecoes":["...","...","...","...","...","..."],"crencas_limitantes":["...","...","...","...","...","..."],"gatilhos_mentais":["...","...","...","...","...","..."],"temas_conteudo":["...","...","...","...","...","..."],"perguntas_frequentes":["...","...","...","...","...","..."],"mitos":["...","...","...","...","...","..."],"erros":["...","...","...","...","...","..."],"oportunidades_conteudo":["...","...","...","...","...","..."]}`.trim();

  return chamarIA({ funcionalidade: "estrategia-mapa", sistema: SISTEMA, prompt, maxTokens: 1000 });
}

// ── Handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const fase: number = body.fase ?? 1;
  const R = (body.respostas ?? {}) as Record<string, string>;

  // ── FASE 1: empresa + persona ─────────────────────────────────────────────
  if (fase === 1) {
    await garantirTabela();
    await prisma.estudoEstrategico.upsert({
      where: { id: "default" },
      update: { status: "gerando", respostas: JSON.stringify(R) },
      create: { id: "default", status: "gerando", respostas: JSON.stringify(R) },
    });

    const r1 = await gerarEmpresaPersona(R);
    if (!r1.sucesso) {
      return NextResponse.json({ erro: `IA indisponível: ${r1.erro}` }, { status: 500 });
    }

    const sec1 = extrairJSON(r1.conteudo);
    if (!sec1) {
      return NextResponse.json(
        { erro: "JSON inválido na fase 1. Tente novamente.", _debug: r1.conteudo.slice(0, 300) },
        { status: 500 }
      );
    }

    await prisma.estudoEstrategico.upsert({
      where: { id: "default" },
      update: {
        secEmpresa: JSON.stringify(sec1.empresa ?? {}),
        secPersona: JSON.stringify(sec1.persona ?? {}),
        status: "gerando",
      },
      create: {
        id: "default",
        respostas: JSON.stringify(R),
        secEmpresa: JSON.stringify(sec1.empresa ?? {}),
        secPersona: JSON.stringify(sec1.persona ?? {}),
        status: "gerando",
      },
    });

    return NextResponse.json({ ok: true, fase: 1 });
  }

  // ── FASE 2: jornada + mercado + posicionamento ────────────────────────────
  if (fase === 2) {
    const r2 = await gerarJornadaMercadoPos(R);
    if (!r2.sucesso) {
      return NextResponse.json({ erro: `IA indisponível: ${r2.erro}` }, { status: 500 });
    }

    const sec2 = extrairJSON(r2.conteudo);
    if (!sec2) {
      return NextResponse.json(
        { erro: "JSON inválido na fase 2. Tente novamente.", _debug: r2.conteudo.slice(0, 300) },
        { status: 500 }
      );
    }

    await prisma.estudoEstrategico.upsert({
      where: { id: "default" },
      update: {
        secJornada: JSON.stringify(sec2.jornada ?? {}),
        secMercado: JSON.stringify(sec2.mercado ?? {}),
        secPosicionamento: JSON.stringify(sec2.posicionamento ?? {}),
        status: "gerando",
      },
      create: {
        id: "default",
        secJornada: JSON.stringify(sec2.jornada ?? {}),
        secMercado: JSON.stringify(sec2.mercado ?? {}),
        secPosicionamento: JSON.stringify(sec2.posicionamento ?? {}),
        status: "gerando",
      },
    });

    return NextResponse.json({ ok: true, fase: 2 });
  }

  // ── FASE 3: mapa de comunicação ───────────────────────────────────────────
  if (fase === 3) {
    const estudo = await prisma.estudoEstrategico.findUnique({ where: { id: "default" } });

    let personaNome = "cliente ideal";
    let personaPerfil = "";
    try {
      const p = JSON.parse(estudo?.secPersona ?? "{}") as Record<string, unknown>;
      personaNome = String(p.nome ?? "cliente ideal");
      personaPerfil = String(p.perfil ?? "");
    } catch { /* ignora */ }

    const r3 = await gerarMapa(personaNome, personaPerfil);
    if (!r3.sucesso) {
      return NextResponse.json({ erro: `IA indisponível: ${r3.erro}` }, { status: 500 });
    }

    const mapa = extrairJSON(r3.conteudo);
    if (!mapa) {
      return NextResponse.json(
        { erro: "JSON inválido na fase 3. Tente novamente.", _debug: r3.conteudo.slice(0, 300) },
        { status: 500 }
      );
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
