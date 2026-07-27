import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA } from "@/lib/ai/gateway";
import { CONFIG } from "@/lib/config";

export const maxDuration = 120;
export const runtime = "nodejs";

const SISTEMA = "Você é um estrategista de marketing de elite especializado em varejo premium e branding. Retorne SOMENTE o objeto JSON pedido, sem markdown, sem explicação, sem texto fora do JSON.";

function extrairJSON(texto: string): Record<string, unknown> | null {
  const limpo = texto.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(limpo); } catch { /* continua */ }
  const match = limpo.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* continua */ } }
  return null;
}

export async function POST(req: NextRequest) {
  const { respostas } = await req.json();

  // Atualizar status para gerando
  await prisma.estudoEstrategico.update({
    where: { id: "default" },
    data: { status: "gerando" },
  });

  const empresa = CONFIG.nome;
  const R = respostas as Record<string, string>;

  // ── CHAMADA 1: Seções 1-5 ──────────────────────────────────────────────
  const prompt1 = `
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
Como percebe o problema e o que tenta sozinha: ${R.jornada_percebe || ""}
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

Baseado nessas respostas, gere um documento estratégico completo em JSON:

{
  "empresa": {
    "produtos": "lista completa de produtos e serviços",
    "como_vende": "canais e processo de venda",
    "ticket": "ticket médio",
    "produto_entrada": "produto mais acessível",
    "produto_premium": "produto mais caro/completo",
    "diferenciais": ["diferencial 1", "diferencial 2", "diferencial 3", "diferencial 4", "diferencial 5"],
    "posicionamento_atual": "como está posicionada hoje",
    "posicionamento_desejado": "onde quer chegar",
    "objetivos": "objetivos de negócio",
    "valores": ["valor 1", "valor 2", "valor 3", "valor 4"],
    "personalidade": "como a marca se comporta",
    "promessa": "promessa central da marca",
    "transformacao": "antes e depois do cliente"
  },
  "persona": {
    "nome": "nome da persona",
    "perfil": "resumo demográfico e psicográfico completo",
    "rotina": "como é o dia a dia",
    "objetivos": ["objetivo 1", "objetivo 2", "objetivo 3", "objetivo 4"],
    "sonhos": ["sonho 1", "sonho 2", "sonho 3"],
    "medos": ["medo 1", "medo 2", "medo 3", "medo 4"],
    "frustracoes": ["frustração 1", "frustração 2", "frustração 3"],
    "dores_emocionais": ["dor emocional 1", "dor emocional 2", "dor emocional 3"],
    "dores_financeiras": ["dor financeira 1", "dor financeira 2", "dor financeira 3"],
    "dores_praticas": ["dor prática 1", "dor prática 2", "dor prática 3"],
    "desejos_conscientes": ["desejo 1", "desejo 2", "desejo 3"],
    "desejos_inconscientes": ["desejo 1", "desejo 2", "desejo 3"],
    "gatilhos_compra": ["gatilho 1", "gatilho 2", "gatilho 3", "gatilho 4"],
    "valores": ["valor 1", "valor 2", "valor 3"],
    "linguagem": "como fala, tom e vocabulário",
    "palavras_usa": ["expressão 1", "expressão 2", "expressão 3", "expressão 4", "expressão 5"],
    "palavras_odeia": ["palavra 1", "palavra 2", "palavra 3", "palavra 4"],
    "influenciadores": ["quem influencia 1", "quem influencia 2", "quem influencia 3"],
    "conteudo_consome": ["tipo de conteúdo 1", "tipo 2", "tipo 3"],
    "pesquisa_google": ["busca 1", "busca 2", "busca 3", "busca 4"],
    "salva_instagram": ["tipo de post 1", "tipo 2", "tipo 3"],
    "faz_confiar": ["fator confiança 1", "fator 2", "fator 3", "fator 4"],
    "faz_desistir": ["fator desistência 1", "fator 2", "fator 3", "fator 4"]
  },
  "jornada": {
    "etapas": [
      {"nome": "Consciência", "descricao": "...", "emocao": "...", "acao": "..."},
      {"nome": "Consideração", "descricao": "...", "emocao": "...", "acao": "..."},
      {"nome": "Decisão", "descricao": "...", "emocao": "...", "acao": "..."},
      {"nome": "Compra", "descricao": "...", "emocao": "...", "acao": "..."},
      {"nome": "Pós-compra", "descricao": "...", "emocao": "...", "acao": "..."}
    ],
    "tenta_sozinha": "o que ela faz antes de comprar",
    "solucoes_frustradas": ["frustração 1", "frustração 2", "frustração 3"],
    "onde_trava": "o ponto exato onde ela para",
    "o_que_falta": "o que ela precisa para tomar a decisão"
  },
  "mercado": {
    "concorrentes": [
      {"nome": "concorrente 1", "como_comunica": "...", "promessa": "...", "fraqueza": "..."},
      {"nome": "concorrente 2", "como_comunica": "...", "promessa": "...", "fraqueza": "..."},
      {"nome": "concorrente 3", "como_comunica": "...", "promessa": "...", "fraqueza": "..."}
    ],
    "oportunidades": ["oportunidade 1", "oportunidade 2", "oportunidade 3", "oportunidade 4", "oportunidade 5"],
    "padroes_quebrar": ["padrão 1", "padrão 2", "padrão 3", "padrão 4"],
    "tendencias": ["tendência 1", "tendência 2", "tendência 3", "tendência 4"]
  },
  "posicionamento": {
    "arquetipo": "arquétipo principal e secundário",
    "tom_voz": "como a marca fala",
    "personalidade": "traços de personalidade",
    "pilares_editoriais": ["pilar 1", "pilar 2", "pilar 3", "pilar 4", "pilar 5"],
    "promessa_central": "a promessa que nenhum concorrente faz",
    "big_idea": "a grande ideia por trás de tudo",
    "mecanismo_unico": "o diferencial que só essa marca tem",
    "diferencial_competitivo": "vantagem competitiva principal",
    "crencas_construir": ["crença a construir 1", "crença 2", "crença 3", "crença 4"],
    "crencas_quebrar": ["crença a quebrar 1", "crença 2", "crença 3", "crença 4"],
    "inimigo_comum": "o inimigo compartilhado entre marca e cliente"
  }
}`;

  const r1 = await chamarIA({
    funcionalidade: "estrategia-secoes",
    sistema: SISTEMA,
    prompt: prompt1,
    maxTokens: 3500,
  });

  let secoes: Record<string, unknown> = {};
  if (r1.sucesso) {
    const parsed = extrairJSON(r1.conteudo);
    if (parsed) secoes = parsed;
  }

  // ── CHAMADA 2: Mapa de Comunicação (30 itens × 10 categorias) ──────────
  const prompt2 = `
Empresa: ${empresa}
Persona: ${(secoes.persona as Record<string, unknown>)?.nome ?? "cliente ideal"} — ${R.persona_perfil?.slice(0, 200) ?? ""}
Setor: varejo Apple, Londrina-PR

Com base nessa empresa e persona, gere um mapa de comunicação completo e específico.
Cada item deve ser CONCRETO, específico para uma loja Apple local, pronto para virar conteúdo.

{
  "dores": ["dor específica 1", ...30 itens],
  "desejos": ["desejo específico 1", ...30 itens],
  "objecoes": ["objeção específica 1", ...30 itens],
  "crencas_limitantes": ["crença limitante 1", ...30 itens],
  "gatilhos_mentais": ["nome do gatilho: como aplicar 1", ...30 itens],
  "temas_conteudo": ["tema concreto de post/reels/carrossel 1", ...30 itens],
  "perguntas_frequentes": ["pergunta real que o cliente faz 1", ...30 itens],
  "mitos": ["mito que o mercado alimenta 1", ...30 itens],
  "erros": ["erro comum do cliente ou da comunicação 1", ...30 itens],
  "oportunidades_conteudo": ["oportunidade de conteúdo inexplorada 1", ...30 itens]
}`;

  const r2 = await chamarIA({
    funcionalidade: "estrategia-mapa",
    sistema: SISTEMA,
    prompt: prompt2,
    maxTokens: 4000,
  });

  let mapa: Record<string, unknown> = {};
  if (r2.sucesso) {
    const parsed = extrairJSON(r2.conteudo);
    if (parsed) mapa = parsed;
  }

  // Salvar no banco
  const atualizado = await prisma.estudoEstrategico.update({
    where: { id: "default" },
    data: {
      secEmpresa: JSON.stringify(secoes.empresa ?? {}),
      secPersona: JSON.stringify(secoes.persona ?? {}),
      secJornada: JSON.stringify(secoes.jornada ?? {}),
      secMercado: JSON.stringify(secoes.mercado ?? {}),
      secPosicionamento: JSON.stringify(secoes.posicionamento ?? {}),
      secMapa: JSON.stringify(mapa),
      status: "completo",
    },
  });

  return NextResponse.json(atualizado);
}
