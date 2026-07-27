import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const objecoes = await prisma.objecao.findMany({
    orderBy: [{ prioridade: "asc" }, { criadoEm: "asc" }],
  });
  return NextResponse.json(objecoes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const objecao = await prisma.objecao.create({
    data: {
      texto: body.texto,
      frequencia: body.frequencia || null,
      etapaVenda: body.etapaVenda || null,
      consegueContornar: body.consegueContornar || null,
      clienteCompraDepois: body.clienteCompraDepois || null,
      respostaAtual: body.respostaAtual || null,
    },
  });
  return NextResponse.json(objecao, { status: 201 });
}
