import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;

  const tema = await prisma.tema.findFirst({ where: { id, userId } });
  if (!tema) return NextResponse.json({ erro: "Tema não encontrado" }, { status: 404 });

  const { titulo, descricao } = await req.json();
  const micro = await prisma.microtema.create({
    data: { titulo, descricao, temaId: id, status: "IDEIA" },
  });
  return NextResponse.json(micro, { status: 201 });
}
