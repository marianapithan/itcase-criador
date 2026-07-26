import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const original = await prisma.conteudo.findUnique({ where: { id } });
  if (!original) return NextResponse.json({ erro: "Conteúdo não encontrado" }, { status: 404 });

  const novo = await prisma.conteudo.create({
    data: {
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
