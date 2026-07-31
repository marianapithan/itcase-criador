import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const objecoes = await prisma.objecao.findMany({
    where: { userId },
    orderBy: [{ prioridade: "asc" }, { criadoEm: "asc" }],
  });
  return NextResponse.json(objecoes);
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const body = await req.json();
  const objecao = await prisma.objecao.create({
    data: {
      userId,
      texto: body.texto,
      contexto: body.contexto || null,
      frequencia: body.frequencia || null,
      etapaVenda: body.etapaVenda || null,
      consegueContornar: body.consegueContornar || null,
      clienteCompraDepois: body.clienteCompraDepois || null,
      respostaAtual: body.respostaAtual || null,
    },
  });
  return NextResponse.json(objecao, { status: 201 });
}
