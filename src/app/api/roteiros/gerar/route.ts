import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";

const INSTRUCOES_FORMATO: Record<string, string> = {
  REELS: "Roteiro para Reels (vídeo curto): gancho nos primeiros 3 segundos, narrativa em blocos, legenda com CTA. Formato: Gancho | Desenvolvimento (3-5 blocos curtos) | CTA.",
  CARROSSEL: "Roteiro para carrossel: Slide 1 = gancho/capa, slides 2-7 = um insight por slide, último slide = CTA. Liste cada slide claramente.",
  LIVE: "Roteiro para live: abertura (2min), aquecimento/apresentação (5min), blocos de conteúdo (3 blocos de 10min), seção de perguntas (10min), fechamento com CTA (3min).",
  POST_ESTATICO: "Post estático: gancho (1 linha), desenvolvimento (3-5 linhas), CTA (1 linha). Tom direto e visual.",
  STORIES: "Sequência de stories: 5-8 cards, cada um com 1 ideia, ritmo rápido, último card com CTA ou link.",
  EMAIL: "E-mail marketing: assunto + preview text, abertura pessoal, corpo (3 parágrafos), CTA claro, PS estratégico.",
  LEGENDA: "Legenda para post: gancho forte (primeira linha), desenvolvimento (4-6 linhas), espaços visuais, hashtags ao final.",
};

function parsearResposta(texto: string): { roteiro: string; legenda: string; objetivo: string; etapaFunil: string } {
  const clean = texto.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const p = JSON.parse(match[0]);
      return {
        roteiro: typeof p.roteiro === "string" ? p.roteiro : texto,
        legenda: typeof p.legenda === "string" ? p.legenda : "",
        objetivo: typeof p.objetivo === "string" ? p.objetivo : "",
        etapaFunil: typeof p.etapaFunil === "string" ? p.etapaFunil : "TOPO",
      };
    } catch {}
  }
  return { roteiro: texto, legenda: "", objetivo: "", etapaFunil: "TOPO" };
}

export async function POST(req: NextRequest) {
  const { titulo, formato, temaId, instrucao, frameworkNome, frameworkPrompt, conteudoId } = await req.json();

  let contextoTema = "";
  if (temaId) {
    const tema = await prisma.tema.findUnique({ where: { id: temaId }, include: { microtemas: true } });
    if (tema) {
      contextoTema = `\nTema: ${tema.titulo}\nDescrição: ${tema.descricao ?? ""}\nMicrotemas: ${tema.microtemas.map((m) => m.titulo).join(", ")}`;
    }
  }

  const instrucaoFormato = INSTRUCOES_FORMATO[formato] ?? "Crie um roteiro de conteúdo adequado ao formato.";

  const instrucaoFramework = frameworkPrompt
    ? `\nMODELO DE CONTEÚDO OBRIGATÓRIO (${frameworkNome ?? ""}): ${frameworkPrompt}`
    : "";

  const resultado = await chamarIA({
    funcionalidade: "gerar-roteiro",
    sistema: contextoCerebro(),
    prompt: `Crie um roteiro completo de conteúdo para a It Case.

Título: ${titulo}
Formato: ${formato}
${contextoTema}
${instrucao ? `Instrução extra: ${instrucao}` : ""}
${instrucaoFramework}

Instrução de formato: ${instrucaoFormato}

Responda APENAS com um JSON válido no formato exato abaixo (sem texto fora do JSON, sem markdown):
{
  "roteiro": "roteiro completo aqui (pronto para usar, sem explicações)",
  "legenda": "legenda para Instagram com emojis e hashtags relevantes",
  "objetivo": "objetivo deste conteúdo em uma frase curta",
  "etapaFunil": "TOPO"
}

Para etapaFunil use EXATAMENTE: TOPO (consciência/alcance), MEIO (engajamento/educação) ou FUNDO (conversão/venda).`,
    maxTokens: 3000,
  });

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 });
  }

  const parsed = parsearResposta(resultado.conteudo);

  const conteudo = conteudoId
    ? await prisma.conteudo.update({
        where: { id: conteudoId },
        data: {
          roteiro: parsed.roteiro,
          legenda: parsed.legenda || null,
          objetivo: parsed.objetivo || null,
          etapaFunil: parsed.etapaFunil || "TOPO",
          status: "GERADO_IA",
          providerUsado: resultado.provedor,
          modeloUsado: resultado.modelo,
        },
      })
    : await prisma.conteudo.create({
        data: {
          titulo,
          formato,
          roteiro: parsed.roteiro,
          legenda: parsed.legenda || null,
          objetivo: parsed.objetivo || null,
          etapaFunil: parsed.etapaFunil || "TOPO",
          temaId: temaId || undefined,
          status: "GERADO_IA",
          providerUsado: resultado.provedor,
          modeloUsado: resultado.modelo,
        },
      });

  return NextResponse.json(conteudo, { status: conteudoId ? 200 : 201 });
}
