import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const temas = await prisma.tema.findMany({
    where: { userId },
    orderBy: { criadoEm: "desc" },
    include: { microtemas: { orderBy: { criadoEm: "asc" } } },
  });
  return NextResponse.json(temas);
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const body = await req.json();
  const tema = await prisma.tema.create({
    data: {
      userId,
      titulo: body.titulo,
      descricao: body.descricao,
      status: body.status ?? "IDEIA",
      estrategiaId: body.estrategiaId,
    },
    include: { microtemas: true },
  });
  return NextResponse.json(tema, { status: 201 });
}
