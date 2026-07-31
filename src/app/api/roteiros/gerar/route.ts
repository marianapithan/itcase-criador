import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";
import { obterFrameworkAtivo } from "@/lib/ai/framework";
import { requireAuth } from "@/lib/auth-session";

const INSTRUCOES_FORMATO: Record<string, string> = {
  REELS: "Roteiro para Reels (vídeo curto): escreva APENAS o que será FALADO — gancho nos primeiros 3 segundos, desenvolvimento em blocos curtos, CTA final. Sem indicações de cena, câmera ou expressão.",
  CARROSSEL: "Roteiro para carrossel: Slide 1 = texto do gancho/capa, slides 2-7 = texto de cada slide (um insight por slide), último slide = texto do CTA. Escreva apenas o conteúdo textual de cada slide.",
  LIVE: "Roteiro para live: escreva o que será FALADO em cada momento — abertura (2min), apresentação (5min), blocos de conteúdo (3 blocos de 10min), perguntas (10min), fechamento com CTA (3min).",
  POST_ESTATICO: "Post estático: gancho (1 linha), desenvolvimento (3-5 linhas), CTA (1 linha). Tom direto.",
  STORIES: "Sequência de stories: escreva o texto/fala de 5-8 cards. Cada card = 1 ideia curta. Último card = CTA.",
  EMAIL: "E-mail marketing: assunto + preview text, abertura pessoal, corpo (3 parágrafos), CTA claro, PS estratégico.",
  LEGENDA: "Legenda para post: gancho forte (primeira linha), desenvolvimento (4-6 linhas), espaços visuais, hashtags ao final.",
};

function parsearResposta(texto: string): { roteiro: string; legenda: string; objetivo: string; etapaFunil: string; sugestoesProducao: string } {
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
        sugestoesProducao: typeof p.sugestoesProducao === "string" ? p.sugestoesProducao : "",
      };
    } catch {}
  }
  return { roteiro: texto, legenda: "", objetivo: "", etapaFunil: "TOPO", sugestoesProducao: "" };
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { titulo, formato, temaId, microtemaId, instrucao, conteudoId } = await req.json();

  let contextoTema = "";
  if (temaId) {
    const tema = await prisma.tema.findUnique({ where: { id: temaId }, include: { microtemas: true } });
    if (tema) {
      contextoTema = `\nTema: ${tema.titulo}\nDescrição: ${tema.descricao ?? ""}\nMicrotemas: ${tema.microtemas.map((m) => m.titulo).join(", ")}`;
    }
  }

  const instrucaoFormato = INSTRUCOES_FORMATO[formato] ?? "Crie um roteiro de conteúdo adequado ao formato.";
  const [frameworkPrompt, ctx] = await Promise.all([obterFrameworkAtivo(userId), contextoCerebro(userId)]);

  const sistema = `${ctx}

--- FRAMEWORK DE COPYWRITING ATIVO ---
${frameworkPrompt}`;

  const resultado = await chamarIA({
    funcionalidade: "gerar-roteiro",
    sistema,
    prompt: `Crie um roteiro de conteúdo.

Título: ${titulo}
Formato: ${formato}
${contextoTema}
${instrucao ? `Instrução extra: ${instrucao}` : ""}

Instrução de formato: ${instrucaoFormato}

REGRAS INVIOLÁVEIS PARA O ROTEIRO:
- Escreva APENAS o texto que será FALADO ou LIDO (o que sai da boca do apresentador ou o texto do post/slide).
- PROIBIDO: indicações de câmera ("olhe para a câmera"), de expressão ("sorrindo", "fazendo cara de surpresa"), de cena ("Cena 1:", "Câmera aproxima"), de postura ("levante a mão", "vire de lado").
- O roteiro é TEXTO PURO — como se fosse um teleprompter ou legenda completa do que será dito.
- Sugestões de produção (cortes, trilha, B-roll, transições, zoom) ficam APENAS no campo sugestoesProducao, NUNCA no roteiro.

Responda APENAS com um JSON válido no formato exato abaixo (sem texto fora do JSON, sem markdown):
{
  "roteiro": "apenas o texto que será falado/lido, sem qualquer didascália",
  "sugestoesProducao": "sugestões opcionais de produção: cortes, trilha, B-roll, zoom, transições, legendas, efeitos — numeradas e separadas por linha",
  "legenda": "legenda para Instagram com hashtags relevantes",
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
          sugestoesProducao: parsed.sugestoesProducao || null,
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
          userId,
          titulo,
          formato,
          roteiro: parsed.roteiro,
          sugestoesProducao: parsed.sugestoesProducao || null,
          legenda: parsed.legenda || null,
          objetivo: parsed.objetivo || null,
          etapaFunil: parsed.etapaFunil || "TOPO",
          temaId: temaId || undefined,
          microtemaId: microtemaId || undefined,
          status: "GERADO_IA",
          providerUsado: resultado.provedor,
          modeloUsado: resultado.modelo,
        },
      });

  return NextResponse.json(conteudo, { status: conteudoId ? 200 : 201 });
}
