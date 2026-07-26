import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const temas = await prisma.tema.findMany({
    orderBy: { criadoEm: "desc" },
    include: { microtemas: { orderBy: { criadoEm: "asc" } } },
  });
  return NextResponse.json(temas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const tema = await prisma.tema.create({
    data: {
      titulo: body.titulo,
      descricao: body.descricao,
      status: body.status ?? "IDEIA",
      estrategiaId: body.estrategiaId,
    },
    include: { microtemas: true },
  });
  return NextResponse.json(tema, { status: 201 });
}
