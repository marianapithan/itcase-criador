import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";
import { requireAuth } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { prompt } = await req.json();

  const resultado = await chamarIA({
    funcionalidade: "gerar-temas",
    sistema: await contextoCerebro(userId),
    prompt: `Crie 5 temas de conteúdo para redes sociais da It Case com base nesta instrução: "${prompt}"

Retorne APENAS um JSON válido com este formato (sem markdown, sem explicação):
[
  {"titulo": "...", "descricao": "..."},
  {"titulo": "...", "descricao": "..."},
  ...
]

Cada tema deve ter título curto (máx 60 caracteres) e descrição de 1-2 frases.`,
  });

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 });
  }

  try {
    const raw = resultado.conteudo.replace(/```json|```/g, "").trim();
    const temas: { titulo: string; descricao: string }[] = JSON.parse(raw);

    const criados = await Promise.all(
      temas.map((t) =>
        prisma.tema.create({
          data: { userId, titulo: t.titulo, descricao: t.descricao, status: "IDEIA" },
          include: { microtemas: true },
        })
      )
    );

    return NextResponse.json(criados, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Erro ao processar resposta da IA. Tente novamente." }, { status: 500 });
  }
}
