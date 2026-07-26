import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

// Cria um Conteudo (Ideia) a partir de uma Tendência e marca a tendência como CONVERTIDA
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const tendencia = await prisma.tendencia.findUnique({ where: { id } });
    if (!tendencia) return new NextResponse(null, { status: 404 });

    const conteudo = await prisma.conteudo.create({
      data: {
        titulo: tendencia.titulo,
        descricao: tendencia.descricao,
        formato: tendencia.formato ?? "REELS",
        status: body.status ?? "IDEIA",
        objetivo: tendencia.motivo ?? undefined,
        dataplanejada: body.dataplanejada ? new Date(body.dataplanejada) : undefined,
      },
    });

    await prisma.tendencia.update({ where: { id }, data: { status: "CONVERTIDA" } });

    return NextResponse.json({ conteudo });
  } catch (err) {
    return NextResponse.json({ erro: String(err) }, { status: 500 });
  }
}
