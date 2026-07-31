import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";
import { obterFrameworkAtivo } from "@/lib/ai/framework";
import { requireAuth } from "@/lib/auth-session";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { prompt, quantidade = 7, temaId } = await req.json();

  let contextoTema = "";
  if (temaId) {
    const tema = await prisma.tema.findUnique({ where: { id: temaId }, include: { microtemas: true } });
    if (tema) {
      contextoTema = `\nTema: ${tema.titulo}\nDescrição: ${tema.descricao ?? ""}\nMicrotemas: ${tema.microtemas.map((m) => m.titulo).join(", ")}`;
    }
  }

  const frameworkPrompt = await obterFrameworkAtivo(userId);
  const ctx = await contextoCerebro(userId);
  const sistema = `${ctx}\n\n--- FRAMEWORK DE COPYWRITING ATIVO ---\n${frameworkPrompt}`;

  const resultado = await chamarIA({
    funcionalidade: "gerar-lote-ideias",
    sistema,
    prompt: `Gere ${quantidade} ideias de conteúdo diferentes.

Contexto: ${prompt}
${contextoTema}

Varie os formatos e as etapas do funil. Cada ideia deve ser prática, específica e ter um ângulo único.

Responda APENAS com um JSON válido, sem texto fora do JSON:
{
  "ideias": [
    {
      "titulo": "título da ideia de conteúdo (específico e atraente)",
      "formato": "REELS",
      "objetivo": "objetivo em uma frase",
      "etapaFunil": "TOPO"
    }
  ]
}

Gere exatamente ${quantidade} ideias. Formatos válidos: REELS, CARROSSEL, POST_ESTATICO, STORIES, LEGENDA, EMAIL, LIVE.
Etapas válidas: TOPO, MEIO, FUNDO.`,
    maxTokens: 2000,
  });

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 });
  }

  const texto = resultado.conteudo.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ erro: "Resposta inválida da IA" }, { status: 400 });
  }

  let ideias: { titulo: string; formato: string; objetivo: string; etapaFunil: string }[] = [];
  try {
    const parsed = JSON.parse(match[0]);
    ideias = Array.isArray(parsed.ideias) ? parsed.ideias : [];
  } catch {
    return NextResponse.json({ erro: "Erro ao processar resposta" }, { status: 400 });
  }

  const FORMATOS_VALIDOS = ["REELS", "CARROSSEL", "POST_ESTATICO", "STORIES", "LEGENDA", "EMAIL", "LIVE"];
  const ETAPAS_VALIDAS = ["TOPO", "MEIO", "FUNDO"];

  if (ideias.length === 0) {
    return NextResponse.json({ erro: "A IA não gerou nenhuma ideia. Tente novamente com um contexto diferente." }, { status: 400 });
  }

  const criados = await Promise.all(
    ideias.map((ideia) =>
      prisma.conteudo.create({
        data: {
          userId,
          titulo: ideia.titulo,
          formato: FORMATOS_VALIDOS.includes(ideia.formato) ? ideia.formato : "REELS",
          objetivo: ideia.objetivo || null,
          etapaFunil: ETAPAS_VALIDAS.includes(ideia.etapaFunil) ? ideia.etapaFunil : "TOPO",
          temaId: temaId || undefined,
          status: "IDEIA",
        },
      })
    )
  );

  return NextResponse.json({ criados: criados.length, conteudos: criados }, { status: 201 });
}
