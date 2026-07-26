import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tema = await prisma.tema.findUnique({ where: { id } });
  if (!tema) return NextResponse.json({ erro: "Tema não encontrado" }, { status: 404 });

  const resultado = await chamarIA({
    funcionalidade: "gerar-microtemas",
    sistema: contextoCerebro(),
    prompt: `Para o tema "${tema.titulo}" (${tema.descricao ?? ""}), crie 4 microtemas específicos de conteúdo para redes sociais da It Case.

Retorne APENAS um JSON válido (sem markdown):
[
  {"titulo": "...", "descricao": "..."},
  ...
]`,
  });

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 });
  }

  try {
    const raw = resultado.conteudo.replace(/```json|```/g, "").trim();
    const micros: { titulo: string; descricao: string }[] = JSON.parse(raw);

    const criados = await Promise.all(
      micros.map((m) =>
        prisma.microtema.create({
          data: { titulo: m.titulo, descricao: m.descricao, temaId: id, status: "IDEIA" },
        })
      )
    );

    return NextResponse.json(criados, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Erro ao processar resposta da IA." }, { status: 500 });
  }
}
