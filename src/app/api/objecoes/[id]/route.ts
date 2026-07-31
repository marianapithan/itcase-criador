import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;
  const body = await req.json();

  const existe = await prisma.objecao.findFirst({ where: { id, userId } });
  if (!existe) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  const objecao = await prisma.objecao.update({ where: { id }, data: body });
  return NextResponse.json(objecao);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;
  const existe = await prisma.objecao.findFirst({ where: { id, userId } });
  if (!existe) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  await prisma.objecao.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
