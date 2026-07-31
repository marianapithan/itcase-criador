import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;
  const body = await req.json();

  const existe = await prisma.tema.findFirst({ where: { id, userId } });
  if (!existe) return new NextResponse(null, { status: 404 });

  const tema = await prisma.tema.update({
    where: { id },
    data: body,
    include: { microtemas: true },
  });
  return NextResponse.json(tema);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;
  const existe = await prisma.tema.findFirst({ where: { id, userId } });
  if (!existe) return new NextResponse(null, { status: 404 });

  await prisma.tema.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
