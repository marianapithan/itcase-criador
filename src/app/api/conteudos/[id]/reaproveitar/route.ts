import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;
  const original = await prisma.conteudo.findFirst({ where: { id, userId } });
  if (!original) return NextResponse.json({ erro: "Conteúdo não encontrado" }, { status: 404 });

  const novo = await prisma.conteudo.create({
    data: {
      userId,
      titulo: `${original.titulo} (reaproveitado)`,
      descricao: original.descricao,
      formato: original.formato,
      canal: original.canal,
      objetivo: original.objetivo,
      cta: original.cta,
      temaId: original.temaId,
      microtemaId: original.microtemaId,
      origemId: original.id,
      status: "IDEIA",
    },
  });

  return NextResponse.json(novo, { status: 201 });
}
