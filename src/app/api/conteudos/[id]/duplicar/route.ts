import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;
  const original = await prisma.conteudo.findFirst({ where: { id, userId } });
  if (!original) return new NextResponse(null, { status: 404 });

  const copia = await prisma.conteudo.create({
    data: {
      userId,
      titulo: `${original.titulo} (cópia)`,
      formato: original.formato,
      status: "GERADO_IA",
      roteiro: original.roteiro,
      legenda: original.legenda,
      objetivo: original.objetivo,
      etapaFunil: original.etapaFunil,
      temaId: original.temaId,
    },
  });

  return NextResponse.json(copia, { status: 201 });
}
