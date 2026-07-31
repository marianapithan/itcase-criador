import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const campanhas = await prisma.campanhaTrafego.findMany({ where: { userId }, orderBy: { dataInicio: "asc" } });
  return NextResponse.json(campanhas);
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const body = await req.json();
  const campanha = await prisma.campanhaTrafego.create({
    data: {
      userId,
      nome: body.nome,
      dataInicio: new Date(body.dataInicio),
      dataFim: new Date(body.dataFim),
      objetivo: body.objetivo || null,
      observacoes: body.observacoes || null,
    },
  });
  return NextResponse.json(campanha, { status: 201 });
}
