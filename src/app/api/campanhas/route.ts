import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const campanhas = await prisma.campanhaTrafego.findMany({ orderBy: { dataInicio: "asc" } });
  return NextResponse.json(campanhas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const campanha = await prisma.campanhaTrafego.create({
    data: {
      nome: body.nome,
      dataInicio: new Date(body.dataInicio),
      dataFim: new Date(body.dataFim),
      objetivo: body.objetivo || null,
      observacoes: body.observacoes || null,
    },
  });
  return NextResponse.json(campanha, { status: 201 });
}
