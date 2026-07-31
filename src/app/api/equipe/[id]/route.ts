import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  await prisma.membroEquipe.deleteMany({ where: { id, userId: sessao.userId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const { nome, cor } = await req.json();
  const membro = await prisma.membroEquipe.updateMany({
    where: { id, userId: sessao.userId },
    data: { ...(nome ? { nome } : {}), ...(cor ? { cor } : {}) },
  });
  return NextResponse.json(membro);
}
