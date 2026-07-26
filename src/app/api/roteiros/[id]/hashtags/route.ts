import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conteudo = await prisma.conteudo.findUnique({ where: { id } });
  if (!conteudo) return new NextResponse(null, { status: 404 });

  const cerebro = await contextoCerebro();
  const prompt = `Gere entre 15 e 20 hashtags relevantes para o seguinte conteúdo de Instagram.

Contexto do negócio: ${cerebro}

Título: ${conteudo.titulo}
Formato: ${conteudo.formato}
${conteudo.legenda ? `Legenda: ${conteudo.legenda}` : ""}
${conteudo.objetivo ? `Objetivo: ${conteudo.objetivo}` : ""}

Regras:
- Mix de hashtags grandes (>500k posts), médias (50k-500k) e pequenas (<50k) para alcance equilibrado
- Inclua hashtags locais de Londrina/Paraná quando relevante
- Inclua hashtags do nicho Apple/iPhone/tecnologia/acessórios
- Retorne SOMENTE as hashtags separadas por espaço, sem numeração, sem explicação
- Todas começando com #`;

  const resp = await chamarIA({ prompt, funcionalidade: "hashtags", maxTokens: 300 });
  if (!resp.sucesso) return NextResponse.json({ erro: resp.erro }, { status: 500 });

  const hashtags = resp.conteudo.trim();
  return NextResponse.json({ hashtags });
}
