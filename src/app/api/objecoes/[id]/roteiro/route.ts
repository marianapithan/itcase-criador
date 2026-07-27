import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA } from "@/lib/ai/gateway";

export const maxDuration = 60;
export const runtime = "nodejs";

const SISTEMA_JSON =
  "Voce e um copywriter especialista em AIDA para loja Apple no Brasil. " +
  "RETORNE SOMENTE O OBJETO JSON PEDIDO. Sem explicacao, sem markdown, sem texto fora do JSON.";

const MAX_TOKENS: Record<string, number> = {
  reels: 850, carrossel: 1000, stories: 1000,
  post: 850, email: 1000, script: 900, faq: 700,
};

const FORMATO_LABEL: Record<string, string> = {
  reels: "Reels (15-30s)", carrossel: "Carrossel feed",
  stories: "Sequência de Stories", post: "Post estático",
  email: "E-mail de vendas", script: "Script WhatsApp", faq: "FAQ",
};

// Instrucoes AIDA por formato — cada campo recebe seu papel na estrutura
const INSTRUCOES_AIDA: Record<string, string> = {
  reels: `
AIDA no Reels:
- "gancho" = ATENCAO: frase falada nos primeiros 3s que PARA o scroll. Direta, impactante, sobre a dor/objecao.
- "cenas[0]" = INTERESSE: mostra a realidade do cliente — o momento em que ele sente a dor da objecao.
- "cenas[1]" = DESEJO: apresenta a solucao/diferencial da It Case que elimina essa dor.
- "cenas[2]" = DESEJO/PROVA: reforco com dado concreto, garantia ou depoimento.
- "quebraObjecao" = o momento exato no video em que a objecao e virada (ex: "E quem acha caro nao sabe que...").
- "prova" = evidencia concreta: garantia de 6 meses, IMEI verificado, tela garantida, etc.
- "cta" = ACAO: convite especifico (ex: "Vem conhecer pessoalmente no Shopping Catuai").
- "legenda" = AIDA em texto: gancho na primeira linha, contexto, solucao, CTA. 3-5 linhas.`,

  carrossel: `
AIDA no Carrossel:
- "capa" = ATENCAO: headline que para o scroll. Frase que gera curiosidade ou nomeia a dor.
- "slides[0]" = INTERESSE: aprofunda o problema — faz o leitor se identificar com a objecao.
- "slides[1]" = INTERESSE: segundo angulo do problema ou consequencia de ignorar.
- "slides[2]" = DESEJO: apresenta a solucao da It Case de forma concreta.
- "slides[3]" = DESEJO/PROVA: prova, garantia, diferencial especifico.
- "encerramento" = ACAO: slide final com CTA claro e convite a agir agora.
- "cta" = CTA curto para o botao/legenda.
- "legenda" = AIDA comprimida em 3-4 linhas com CTA.`,

  stories: `
AIDA nos Stories (sequencia de 5):
- stories[0] tipo "texto" = ATENCAO: afirmacao ou pergunta provocativa sobre a objecao. Faz o cliente parar.
- stories[1] tipo "enquete" = INTERESSE: pergunta que faz o cliente se identificar com a dor/objecao.
- stories[2] tipo "texto" = DESEJO: revela a solucao/diferencial que elimina a objecao.
- stories[3] tipo "caixaPerguntas" = DESEJO: convida a tirar duvidas, aprofunda o engajamento.
- stories[4] tipo "cta" = ACAO: convite direto e especifico (visitar loja, mandar mensagem, etc).`,

  post: `
AIDA no Post estatico:
- "titulo" = ATENCAO: headline que para o scroll. Pode ser uma pergunta, dado ou afirmacao forte.
- "corpo" = AIDA em texto corrido:
    Paragrafo 1 (A): ancora na dor/objecao — faz o leitor se reconhecer.
    Paragrafo 2-3 (I+D): aprofunda o problema e apresenta a solucao com especificidade.
    Paragrafo 4 (D): reforco de prova, garantia ou diferencial concreto.
    Paragrafo 5 (A): CTA embutido no texto, convite natural.
- "cta" = CTA em destaque separado.
- "legenda" = versao compacta do corpo para o Instagram (3-5 linhas + hashtags inline).`,

  email: `
AIDA no E-mail:
- "assunto" = ATENCAO: linha de assunto que gera abertura (max 45 caracteres). Pode ser pergunta ou dado curioso.
- "preview" = INTERESSE: linha de preview que complementa o assunto e aumenta a abertura.
- "corpo" = AIDA completo:
    Abertura (A): gancho emocional ou dado que ancora na objecao do cliente.
    Desenvolvimento (I): aprofunda o problema — faz o leitor se identificar.
    Virada (D): apresenta a solucao da It Case, especifica e concreta.
    Prova (D): garantia, diferencial ou resultado real.
    CTA (A): convite claro para o proximo passo (visitar loja, responder email, etc).
- "ps" = P.S. estrategico: reforco do CTA com angulo diferente ou senso de urgencia real.`,

  script: `
AIDA no Script de WhatsApp (conversa real, fala por fala):
- "abertura" = ATENCAO: como iniciar a conversa de forma acolhedora, sem "posso ajudar?". Nomeia o contexto.
- "desenvolvimento[0]" = INTERESSE: frase que identifica a dor/objecao sem ser invasivo.
- "desenvolvimento[1]" = INTERESSE->DESEJO: aprofunda com uma pergunta ou dado que abre espaco para a solucao.
- "desenvolvimento[2]" = DESEJO: apresenta o diferencial da It Case de forma conversacional.
- "quebraObjecao" = o momento exato em que a objecao e respondida diretamente. Fala especifica, sem rodeios.
- "fechamento" = ACAO: como propor o proximo passo concreto (agendar visita, enviar opcoes, etc).`,

  faq: `
AIDA na FAQ:
- "pergunta" = A objecao reformulada como pergunta natural de cliente (como ele buscaria no Google).
- "resposta" = AIDA comprimida:
    Frase 1 (A+I): reconhece a duvida com empatia, valida o sentimento do cliente.
    Frase 2-3 (D): explica a solucao/diferencial de forma especifica, com prova concreta.
    Frase final (A): convite natural ao proximo passo.
- "dica" = orientacao interna para quem vai responder: tom, o que reforcar, o que evitar.`,
};

const ESTRUTURAS: Record<string, string> = {
  reels:    `{"gancho":"","cenas":["","",""],"quebraObjecao":"","prova":"","cta":"","legenda":"","hashtags":["","",""]}`,
  carrossel:`{"capa":"","slides":["","","",""],"encerramento":"","cta":"","legenda":"","hashtags":["","",""]}`,
  stories:  `{"stories":[{"tipo":"texto","conteudo":""},{"tipo":"enquete","pergunta":"","opcoes":["",""]},{"tipo":"texto","conteudo":""},{"tipo":"caixaPerguntas","instrucao":""},{"tipo":"cta","conteudo":""}]}`,
  post:     `{"titulo":"","corpo":"","cta":"","legenda":"","hashtags":["","",""]}`,
  email:    `{"assunto":"","preview":"","corpo":"","ps":""}`,
  script:   `{"abertura":"","desenvolvimento":["","",""],"quebraObjecao":"","fechamento":""}`,
  faq:      `{"pergunta":"","resposta":"","dica":""}`,
};

function extrairJSON(texto: string): Record<string, unknown> | null {
  const limpo = texto.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(limpo); } catch { /* continua */ }
  const match = limpo.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch { /* continua */ }
  }
  return null;
}

function construirPrompt(
  objecaoTexto: string,
  raiz: string,
  formato: string,
  formatoLabel: string,
): string {
  const instrucoes = INSTRUCOES_AIDA[formato] || "";
  const estrutura = ESTRUTURAS[formato] || ESTRUTURAS.reels;

  return [
    `NEGOCIO: It Case — loja Apple, Shopping Catuai, Londrina-PR.`,
    `Tom: confianca, acolhimento, proximidade.`,
    `Proibido: "capinha", "posso ajudar?", "aproveite agora", "compre agora", "preco imbativel".`,
    ``,
    `OBJECAO A QUEBRAR: "${objecaoTexto}"`,
    `RAIZ DA OBJECAO: ${raiz}`,
    ``,
    `FORMATO: ${formatoLabel}`,
    instrucoes.trim(),
    ``,
    `Regras de conteudo:`,
    `- Quebre a objecao ANTES que o cliente a verbalize — prevencao, nao cura.`,
    `- Use AIDA em cada campo conforme as instrucoes acima.`,
    `- Seja especifico sobre a It Case (garantia 6 meses, IMEI verificado, loja Shopping Catuai, etc).`,
    `- Tom natural, como uma pessoa real falaria — sem frases de robô.`,
    ``,
    `Preencha o JSON abaixo com conteudo real (nao deixe nenhum campo vazio):`,
    estrutura,
  ].join("\n");
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { formato }: { formato: string } = await req.json();

  const objecao = await prisma.objecao.findUnique({ where: { id } });
  if (!objecao) return NextResponse.json({ erro: "Objeção não encontrada" }, { status: 404 });

  const raiz = objecao.raiz || "cliente indeciso ou com duvida nao revelada";
  const formatoLabel = FORMATO_LABEL[formato] || formato;
  const maxTokens = MAX_TOKENS[formato] || 900;

  const prompt = construirPrompt(objecao.texto, raiz, formato, formatoLabel);

  // — Primeira tentativa
  const r1 = await chamarIA({
    funcionalidade: "objecoes-roteiro",
    sistema: SISTEMA_JSON,
    prompt,
    maxTokens,
  });

  if (r1.sucesso) {
    const roteiro = extrairJSON(r1.conteudo);
    if (roteiro) {
      return NextResponse.json({ roteiro, formato, formatoLabel, objecao: objecao.texto });
    }
  }

  // — Segunda tentativa: prompt minimalista focado só em retornar JSON
  const estrutura = ESTRUTURAS[formato] || ESTRUTURAS.reels;
  const promptRetry = [
    `Preencha este JSON com um ${formatoLabel} seguindo AIDA para quebrar a objecao "${objecao.texto}" (loja Apple, Brasil):`,
    estrutura,
  ].join("\n");

  const r2 = await chamarIA({
    funcionalidade: "objecoes-roteiro-retry",
    sistema: "Retorne apenas JSON valido. Nenhum texto fora do JSON.",
    prompt: promptRetry,
    maxTokens,
  });

  if (r2.sucesso) {
    const roteiro = extrairJSON(r2.conteudo);
    if (roteiro) {
      return NextResponse.json({ roteiro, formato, formatoLabel, objecao: objecao.texto });
    }
  }

  const raw1 = r1.conteudo?.slice(0, 300) || r1.erro || "sem resposta";
  const raw2 = r2.conteudo?.slice(0, 300) || r2.erro || "sem resposta";
  return NextResponse.json(
    { erro: "A IA não retornou JSON após 2 tentativas.", detalhe: `T1: "${raw1}" | T2: "${raw2}"` },
    { status: 400 }
  );
}
