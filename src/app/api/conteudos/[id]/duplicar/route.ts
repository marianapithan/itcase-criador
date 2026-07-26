import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const original = await prisma.conteudo.findUnique({ where: { id } });
  if (!original) return new NextResponse(null, { status: 404 });

  const copia = await prisma.conteudo.create({
    data: {
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
