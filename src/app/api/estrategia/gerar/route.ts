import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA } from "@/lib/ai/gateway";
import { CONFIG } from "@/lib/config";

export const maxDuration = 300;
export const runtime = "nodejs";

const SISTEMA =
  "Responda APENAS com o JSON solicitado. Sem markdown. Sem texto antes ou depois. Sem comentários. Valores de string: máximo 15 palavras.";

// ── Utilitários ───────────────────────────────────────────────────────────

function repararJSON(s: string): string {
  // Remove trailing comma antes de fechar
  s = s.replace(/,(\s*[}\]])/g, "$1");
  // Se o JSON está truncado no meio de uma string, fecha a string e o objeto
  if (!s.trimEnd().endsWith("}")) {
    // Conta chaves abertas vs fechadas
    let abertas = 0;
    let emString = false;
    let escaping = false;
    for (const ch of s) {
      if (escaping) { escaping = false; continue; }
      if (ch === "\\") { escaping = true; continue; }
      if (ch === '"') { emString = !emString; continue; }
      if (!emString) {
        if (ch === "{") abertas++;
        if (ch === "}") abertas--;
      }
    }
    // Se estava no meio de uma string, fecha ela primeiro
    if (emString) s += '"';
    // Remove trailing comma/colon incompleto
    s = s.replace(/[,:]?\s*$/, "");
    // Fecha os objetos que ficaram abertos
    for (let i = 0; i < abertas; i++) s += "}";
  }
  return s;
}

function extrairJSON(texto: string): Record<string, unknown> | null {
  let s = texto.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  // Tenta parse direto
  try { return JSON.parse(repararJSON(s)); } catch { /* continua */ }
  // Extrai o maior bloco de objeto
  const m = s.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(repararJSON(m[0])); } catch { /* continua */ }
  }
  // Última tentativa: extrai até o último campo válido e fecha
  const mParcial = s.match(/^\{[\s\S]+/);
  if (mParcial) {
    try { return JSON.parse(repararJSON(mParcial[0])); } catch { /* continua */ }
  }
  console.error("[extrairJSON] falhou:", s.slice(0, 300));
  return null;
}

function splitComma(v: unknown): string[] {
  if (Array.isArray(v)) return (v as unknown[]).map(String).filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(",").map(s => s.trim()).filter(Boolean);
  return [];
}

function parsePipe(v: unknown, keys: string[]): Record<string, string> {
  const raw = typeof v === "string" ? v.split("|").map(s => s.trim()) : [];
  return Object.fromEntries(keys.map((k, i) => [k, raw[i] || ""]));
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
        "secAnaliseCompleta" TEXT NOT NULL DEFAULT '',
        "status" TEXT NOT NULL DEFAULT 'novo',
        "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch { /* tabela já existe */ }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "EstudoEstrategico" ADD COLUMN "secAnaliseCompleta" TEXT NOT NULL DEFAULT ''`
    );
  } catch { /* coluna já existe */ }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "EstudoEstrategico" ADD COLUMN "secCriadora" TEXT NOT NULL DEFAULT ''`
    );
  } catch { /* coluna já existe */ }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Objecao" ADD COLUMN "contexto" TEXT`
    );
  } catch { /* coluna já existe */ }
}

// ── Parsers de seção ──────────────────────────────────────────────────────

function parsearEmpresa(obj: Record<string, unknown>): Record<string, unknown> {
  return {
    produtos:                String(obj.produtos || ""),
    como_vende:              String(obj.como_vende || ""),
    ticket:                  String(obj.ticket || ""),
    produto_entrada:         String(obj.produto_entrada || ""),
    produto_premium:         String(obj.produto_premium || ""),
    diferenciais:            splitComma(obj.diferenciais),
    posicionamento_atual:    String(obj.posicionamento_atual || ""),
    posicionamento_desejado: String(obj.posicionamento_desejado || ""),
    valores:                 splitComma(obj.valores),
    personalidade:           String(obj.personalidade || ""),
    promessa:                String(obj.promessa || ""),
    transformacao:           String(obj.transformacao || ""),
  };
}

function parsearPersona(obj: Record<string, unknown>): Record<string, unknown> {
  return {
    nome:                  String(obj.nome || ""),
    perfil:                String(obj.perfil || ""),
    rotina:                String(obj.rotina || ""),
    objetivos:             splitComma(obj.objetivos),
    sonhos:                splitComma(obj.sonhos),
    medos:                 splitComma(obj.medos),
    frustracoes:           splitComma(obj.frustracoes),
    dores_emocionais:      splitComma(obj.dores_emocionais),
    dores_financeiras:     splitComma(obj.dores_financeiras),
    dores_praticas:        splitComma(obj.dores_praticas),
    desejos_conscientes:   splitComma(obj.desejos_conscientes),
    desejos_inconscientes: splitComma(obj.desejos_inconscientes),
    gatilhos_compra:       splitComma(obj.gatilhos_compra),
    valores:               splitComma(obj.valores),
    linguagem:             String(obj.linguagem || ""),
    palavras_usa:          splitComma(obj.palavras_usa),
    palavras_odeia:        splitComma(obj.palavras_odeia),
    influenciadores:       splitComma(obj.influenciadores),
    conteudo_consome:      splitComma(obj.conteudo_consome),
    pesquisa_google:       splitComma(obj.pesquisa_google),
    salva_instagram:       splitComma(obj.salva_instagram),
    faz_confiar:           splitComma(obj.faz_confiar),
    faz_desistir:          splitComma(obj.faz_desistir),
  };
}

function parsearJornada(obj: Record<string, unknown>): Record<string, unknown> {
  const nomes = ["Consciência", "Consideração", "Decisão", "Compra", "Pós-compra"];
  const etapas = [1, 2, 3, 4, 5].map((n, i) => ({
    nome: nomes[i],
    ...parsePipe(obj[`etapa_${n}`], ["descricao", "emocao", "acao"]),
  }));
  return {
    etapas,
    tenta_sozinha:       String(obj.tenta_sozinha || ""),
    solucoes_frustradas: splitComma(obj.solucoes_frustradas),
    onde_trava:          String(obj.onde_trava || ""),
    o_que_falta:         String(obj.o_que_falta || ""),
  };
}

function parsearMercado(obj: Record<string, unknown>): Record<string, unknown> {
  const concorrentes = [1, 2, 3].map(n => {
    const raw = obj[`concorrente_${n}`];
    if (!raw) return null;
    return parsePipe(raw, ["nome", "como_comunica", "promessa", "fraqueza"]);
  }).filter(Boolean);
  return {
    concorrentes,
    oportunidades:   splitComma(obj.oportunidades),
    padroes_quebrar: splitComma(obj.padroes_quebrar),
    tendencias:      splitComma(obj.tendencias),
  };
}

function parsearCriadora(obj: Record<string, unknown>): Record<string, unknown> {
  return {
    assinatura_abertura:   String(obj.assinatura_abertura || ""),
    frases_assinatura:     splitComma(obj.frases_assinatura),
    transicoes_edicao:     String(obj.transicoes_edicao || ""),
    formatos_favoritos:    splitComma(obj.formatos_favoritos),
    ganchos_abertura:      splitComma(obj.ganchos_abertura),
    estilo_visual:         String(obj.estilo_visual || ""),
    elementos_recorrentes: splitComma(obj.elementos_recorrentes),
    voz_na_camera:         String(obj.voz_na_camera || ""),
  };
}

function parsearPosicionamento(obj: Record<string, unknown>): Record<string, unknown> {
  return {
    arquetipo:               String(obj.arquetipo || ""),
    tom_voz:                 String(obj.tom_voz || ""),
    personalidade:           String(obj.personalidade || ""),
    pilares_editoriais:      splitComma(obj.pilares_editoriais),
    promessa_central:        String(obj.promessa_central || ""),
    big_idea:                String(obj.big_idea || ""),
    mecanismo_unico:         String(obj.mecanismo_unico || ""),
    diferencial_competitivo: String(obj.diferencial_competitivo || ""),
    crencas_construir:       splitComma(obj.crencas_construir),
    crencas_quebrar:         splitComma(obj.crencas_quebrar),
    inimigo_comum:           String(obj.inimigo_comum || ""),
  };
}

// ── Geradores por módulo ──────────────────────────────────────────────────

async function gerarEmpresa(R: Record<string, string>) {
  const prompt = `Empresa ${CONFIG.nome} — varejo Apple Londrina.
Entrevista: produtos="${R.empresa_produtos || ""}" | como vende="${R.empresa_como_vende || ""}" | ticket="${R.empresa_ticket || ""}" | diferenciais="${R.empresa_diferenciais || ""}" | posicionamento="${R.empresa_posicionamento || ""}" | valores="${R.empresa_valores || ""}"

Retorne SOMENTE este JSON (arrays como texto separado por vírgula):
{"produtos":"...","como_vende":"...","ticket":"...","produto_entrada":"...","produto_premium":"...","diferenciais":"item1, item2, item3","posicionamento_atual":"...","posicionamento_desejado":"...","valores":"val1, val2, val3","personalidade":"...","promessa":"...","transformacao":"..."}`;

  const r = await chamarIA({ funcionalidade: "estrategia-empresa", sistema: SISTEMA, prompt, maxTokens: 700 });
  if (!r.sucesso) return NextResponse.json({ erro: `IA empresa: ${r.erro}` }, { status: 500 });

  const raw = extrairJSON(r.conteudo);
  if (!raw) return NextResponse.json({ erro: "JSON empresa inválido. Tente novamente." }, { status: 500 });

  const secEmpresa = JSON.stringify(parsearEmpresa(raw));
  await prisma.estudoEstrategico.upsert({
    where: { id: "default" },
    update: { secEmpresa, respostas: JSON.stringify(R) },
    create: { id: "default", secEmpresa, respostas: JSON.stringify(R) },
  });
  return NextResponse.json({ ok: true, secEmpresa });
}

async function gerarPersona(R: Record<string, string>) {
  const prompt = `Empresa ${CONFIG.nome} — varejo Apple Londrina.
Entrevista: perfil="${R.persona_perfil || ""}" | rotina="${R.persona_rotina || ""}" | objetivos="${R.persona_objetivos || ""}" | confiança="${R.persona_confianca || ""}" | linguagem="${R.persona_linguagem || ""}" | influência="${R.persona_influencia || ""}"

Retorne SOMENTE este JSON (arrays como texto separado por vírgula):
{"nome":"[nome feminino real]","perfil":"...","rotina":"...","objetivos":"obj1, obj2, obj3","sonhos":"s1, s2","medos":"m1, m2, m3","frustracoes":"f1, f2","dores_emocionais":"d1, d2","dores_financeiras":"d1, d2","dores_praticas":"d1, d2","desejos_conscientes":"d1, d2","desejos_inconscientes":"d1, d2","gatilhos_compra":"g1, g2, g3","valores":"v1, v2","linguagem":"...","palavras_usa":"p1, p2, p3","palavras_odeia":"p1, p2","influenciadores":"i1, i2","conteudo_consome":"c1, c2","pesquisa_google":"b1, b2, b3","salva_instagram":"t1, t2","faz_confiar":"f1, f2, f3","faz_desistir":"f1, f2"}`;

  const r = await chamarIA({ funcionalidade: "estrategia-persona", sistema: SISTEMA, prompt, maxTokens: 1400 });
  if (!r.sucesso) return NextResponse.json({ erro: `IA persona: ${r.erro}` }, { status: 500 });

  const raw = extrairJSON(r.conteudo);
  if (!raw) return NextResponse.json({ erro: "JSON persona inválido. Tente novamente." }, { status: 500 });

  const secPersona = JSON.stringify(parsearPersona(raw));
  await prisma.estudoEstrategico.upsert({
    where: { id: "default" },
    update: { secPersona, respostas: JSON.stringify(R) },
    create: { id: "default", secPersona, respostas: JSON.stringify(R) },
  });
  return NextResponse.json({ ok: true, secPersona });
}

async function gerarJornada(R: Record<string, string>) {
  const prompt = `Empresa ${CONFIG.nome}. Entrevista: percebe="${R.jornada_percebe || ""}" | trava="${R.jornada_trava || ""}" | emoções="${R.jornada_emocoes || ""}"

Retorne SOMENTE este JSON. Cada etapa_N: "descricao|emocao|acao":
{"etapa_1":"descricao|emocao|acao","etapa_2":"descricao|emocao|acao","etapa_3":"descricao|emocao|acao","etapa_4":"descricao|emocao|acao","etapa_5":"descricao|emocao|acao","tenta_sozinha":"...","solucoes_frustradas":"s1, s2","onde_trava":"...","o_que_falta":"..."}`;

  const r = await chamarIA({ funcionalidade: "estrategia-jornada", sistema: SISTEMA, prompt, maxTokens: 600 });
  if (!r.sucesso) return NextResponse.json({ erro: `IA jornada: ${r.erro}` }, { status: 500 });

  const raw = extrairJSON(r.conteudo);
  if (!raw) return NextResponse.json({ erro: "JSON jornada inválido. Tente novamente." }, { status: 500 });

  const secJornada = JSON.stringify(parsearJornada(raw));
  await prisma.estudoEstrategico.upsert({
    where: { id: "default" },
    update: { secJornada, respostas: JSON.stringify(R) },
    create: { id: "default", secJornada, respostas: JSON.stringify(R) },
  });
  return NextResponse.json({ ok: true, secJornada });
}

async function gerarMercado(R: Record<string, string>) {
  const prompt = `Empresa ${CONFIG.nome}. Entrevista: concorrentes="${R.mercado_concorrentes || ""}" | oportunidades="${R.mercado_oportunidades || ""}" | tendências="${R.mercado_tendencias || ""}"

Retorne SOMENTE este JSON. Cada concorrente_N: "nome|como_comunica|promessa|fraqueza":
{"concorrente_1":"nome|como_comunica|promessa|fraqueza","concorrente_2":"nome|como_comunica|promessa|fraqueza","concorrente_3":"nome|como_comunica|promessa|fraqueza","oportunidades":"op1, op2, op3","padroes_quebrar":"p1, p2","tendencias":"t1, t2, t3"}`;

  const r = await chamarIA({ funcionalidade: "estrategia-mercado", sistema: SISTEMA, prompt, maxTokens: 600 });
  if (!r.sucesso) return NextResponse.json({ erro: `IA mercado: ${r.erro}` }, { status: 500 });

  const raw = extrairJSON(r.conteudo);
  if (!raw) return NextResponse.json({ erro: "JSON mercado inválido. Tente novamente." }, { status: 500 });

  const secMercado = JSON.stringify(parsearMercado(raw));
  await prisma.estudoEstrategico.upsert({
    where: { id: "default" },
    update: { secMercado, respostas: JSON.stringify(R) },
    create: { id: "default", secMercado, respostas: JSON.stringify(R) },
  });
  return NextResponse.json({ ok: true, secMercado });
}

async function gerarPosicionamento(R: Record<string, string>) {
  const prompt = `Empresa ${CONFIG.nome}. Entrevista: personalidade="${R.pos_personalidade || ""}" | big_idea="${R.pos_big_idea || ""}" | crenças="${R.pos_crencas || ""}"

Retorne SOMENTE este JSON (arrays como texto separado por vírgula):
{"arquetipo":"...","tom_voz":"...","personalidade":"...","pilares_editoriais":"p1, p2, p3, p4","promessa_central":"...","big_idea":"...","mecanismo_unico":"...","diferencial_competitivo":"...","crencas_construir":"c1, c2, c3","crencas_quebrar":"c1, c2","inimigo_comum":"..."}`;

  const r = await chamarIA({ funcionalidade: "estrategia-posicionamento", sistema: SISTEMA, prompt, maxTokens: 700 });
  if (!r.sucesso) return NextResponse.json({ erro: `IA posicionamento: ${r.erro}` }, { status: 500 });

  const raw = extrairJSON(r.conteudo);
  if (!raw) return NextResponse.json({ erro: "JSON posicionamento inválido. Tente novamente." }, { status: 500 });

  const secPosicionamento = JSON.stringify(parsearPosicionamento(raw));
  await prisma.estudoEstrategico.upsert({
    where: { id: "default" },
    update: { secPosicionamento, respostas: JSON.stringify(R) },
    create: { id: "default", secPosicionamento, respostas: JSON.stringify(R) },
  });
  return NextResponse.json({ ok: true, secPosicionamento });
}

async function gerarCriadora(R: Record<string, string>) {
  const prompt = `Criadora de conteúdo — ${CONFIG.nome}.
Entrevista: abertura="${R.criadora_abertura || ""}" | frases="${R.criadora_frases || ""}" | transicoes="${R.criadora_transicoes || ""}" | formatos="${R.criadora_formatos || ""}" | ganchos="${R.criadora_ganchos || ""}" | visual="${R.criadora_visual || ""}"

Retorne SOMENTE este JSON (arrays como texto separado por vírgula):
{"assinatura_abertura":"como ela abre os vídeos em 1 frase","frases_assinatura":"frase1, frase2, frase3","transicoes_edicao":"padrão de edição e transição","formatos_favoritos":"formato1, formato2, formato3","ganchos_abertura":"gancho1, gancho2, gancho3","estilo_visual":"descrição do estilo visual","elementos_recorrentes":"elemento1, elemento2, elemento3","voz_na_camera":"como ela se comporta na câmera"}`;

  const r = await chamarIA({ funcionalidade: "estrategia-criadora", sistema: SISTEMA, prompt, maxTokens: 700 });
  if (!r.sucesso) return NextResponse.json({ erro: `IA criadora: ${r.erro}` }, { status: 500 });

  const raw = extrairJSON(r.conteudo);
  if (!raw) return NextResponse.json({ erro: "JSON criadora inválido. Tente novamente." }, { status: 500 });

  const secCriadora = JSON.stringify(parsearCriadora(raw));
  await prisma.estudoEstrategico.upsert({
    where: { id: "default" },
    update: { secCriadora, respostas: JSON.stringify(R) },
    create: { id: "default", secCriadora, respostas: JSON.stringify(R) },
  });
  return NextResponse.json({ ok: true, secCriadora });
}

async function gerarMapa() {
  const estudo = await prisma.estudoEstrategico.findUnique({ where: { id: "default" } });
  let personaNome = "cliente ideal";
  let personaPerfil = "";
  try {
    const p = JSON.parse(estudo?.secPersona ?? "{}") as Record<string, unknown>;
    personaNome = String(p.nome ?? "cliente ideal");
    personaPerfil = String(p.perfil ?? "").slice(0, 100);
  } catch { /* ignora */ }

  const prompt = `Empresa: ${CONFIG.nome}. Persona: ${personaNome} — ${personaPerfil}.

Retorne SOMENTE este JSON (arrays de strings, 6 itens cada, máx 12 palavras por item):
{"dores":["...","...","...","...","...","..."],"desejos":["...","...","...","...","...","..."],"objecoes":["...","...","...","...","...","..."],"crencas_limitantes":["...","...","...","...","...","..."],"gatilhos_mentais":["...","...","...","...","...","..."],"temas_conteudo":["...","...","...","...","...","..."],"perguntas_frequentes":["...","...","...","...","...","..."],"mitos":["...","...","...","...","...","..."],"erros":["...","...","...","...","...","..."],"oportunidades_conteudo":["...","...","...","...","...","..."]}`;

  const r = await chamarIA({ funcionalidade: "estrategia-mapa", sistema: SISTEMA, prompt, maxTokens: 900 });
  if (!r.sucesso) return NextResponse.json({ erro: `IA mapa: ${r.erro}` }, { status: 500 });

  const mapa = extrairJSON(r.conteudo);
  if (!mapa) return NextResponse.json({ erro: "JSON mapa inválido. Tente novamente." }, { status: 500 });

  const secMapa = JSON.stringify(mapa);
  await prisma.estudoEstrategico.upsert({
    where: { id: "default" },
    update: { secMapa },
    create: { id: "default", secMapa },
  });
  return NextResponse.json({ ok: true, secMapa });
}

async function gerarCompleto() {
  const estudo = await prisma.estudoEstrategico.findUnique({ where: { id: "default" } });
  if (!estudo) return NextResponse.json({ erro: "Nenhum módulo gerado ainda." }, { status: 400 });

  const empresa    = estudo.secEmpresa        ? JSON.parse(estudo.secEmpresa)        as Record<string, unknown> : null;
  const persona    = estudo.secPersona        ? JSON.parse(estudo.secPersona)        as Record<string, unknown> : null;
  const jornada    = estudo.secJornada        ? JSON.parse(estudo.secJornada)        as Record<string, unknown> : null;
  const mercado    = estudo.secMercado        ? JSON.parse(estudo.secMercado)        as Record<string, unknown> : null;
  const pos        = estudo.secPosicionamento ? JSON.parse(estudo.secPosicionamento) as Record<string, unknown> : null;
  const mapa       = estudo.secMapa           ? JSON.parse(estudo.secMapa)           as Record<string, unknown> : null;

  const contexto = JSON.stringify({
    empresa: empresa ? {
      produtos: empresa.produtos, promessa: empresa.promessa, diferenciais: empresa.diferenciais,
      posicionamento_desejado: empresa.posicionamento_desejado, transformacao: empresa.transformacao,
    } : null,
    persona: persona ? {
      nome: persona.nome, perfil: persona.perfil, medos: persona.medos,
      desejos_conscientes: persona.desejos_conscientes, gatilhos_compra: persona.gatilhos_compra,
      faz_confiar: persona.faz_confiar, faz_desistir: persona.faz_desistir,
    } : null,
    jornada: jornada ? {
      onde_trava: jornada.onde_trava, o_que_falta: jornada.o_que_falta,
      solucoes_frustradas: jornada.solucoes_frustradas,
    } : null,
    mercado: mercado ? {
      concorrentes: mercado.concorrentes, oportunidades: mercado.oportunidades,
      padroes_quebrar: mercado.padroes_quebrar,
    } : null,
    posicionamento: pos ? {
      big_idea: pos.big_idea, inimigo_comum: pos.inimigo_comum,
      pilares_editoriais: pos.pilares_editoriais, crencas_construir: pos.crencas_construir,
    } : null,
    mapa: mapa ? {
      dores:    (mapa.dores    as string[] | undefined)?.slice(0, 3),
      objecoes: (mapa.objecoes as string[] | undefined)?.slice(0, 3),
    } : null,
  });

  const prompt = `Analise estrategicamente esta empresa e retorne SOMENTE este JSON. Máximo 50 palavras por campo de texto:

DADOS: ${contexto}

{"diagnostico_atual":"cenário atual conciso da empresa","conexao_persona_oferta":"como a oferta se conecta (ou não) com a persona","lacunas_jornada":"pontos cegos ou oportunidades na jornada de compra","coerencia_posicionamento":"se o posicionamento está alinhado com persona e mercado","oportunidades_estrategicas":"maiores oportunidades identificadas pelo cruzamento dos dados","incoerencias":"inconsistências ou contradições encontradas entre os módulos","recomendacoes_conteudo":"direcionamentos específicos para conteúdo com base nos dados","recomendacoes_marketing":"ações táticas de marketing recomendadas","recomendacoes_vendas":"ajustes no processo de venda baseados na jornada","proximos_passos":"3 ações prioritárias para os próximos 30 dias"}`;

  const r = await chamarIA({ funcionalidade: "estrategia-completo", sistema: SISTEMA, prompt, maxTokens: 800 });
  if (!r.sucesso) return NextResponse.json({ erro: `IA análise completa: ${r.erro}` }, { status: 500 });

  const analise = extrairJSON(r.conteudo);
  if (!analise) return NextResponse.json({ erro: "JSON análise completa inválido. Tente novamente." }, { status: 500 });

  const secAnaliseCompleta = JSON.stringify(analise);
  await prisma.estudoEstrategico.upsert({
    where: { id: "default" },
    update: { secAnaliseCompleta },
    create: { id: "default", secAnaliseCompleta },
  });
  return NextResponse.json({ ok: true, secAnaliseCompleta });
}

// ── Handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const modulo = body.modulo as string;
  const R = (body.respostas ?? {}) as Record<string, string>;

  await garantirTabela();

  if (modulo === "empresa")        return gerarEmpresa(R);
  if (modulo === "persona")        return gerarPersona(R);
  if (modulo === "jornada")        return gerarJornada(R);
  if (modulo === "mercado")        return gerarMercado(R);
  if (modulo === "posicionamento") return gerarPosicionamento(R);
  if (modulo === "criadora")       return gerarCriadora(R);
  if (modulo === "mapa")           return gerarMapa();
  if (modulo === "completo")       return gerarCompleto();

  return NextResponse.json({ erro: "Módulo inválido" }, { status: 400 });
}
