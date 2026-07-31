import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;
  const existe = await prisma.campanhaTrafego.findFirst({ where: { id, userId } });
  if (!existe) return new NextResponse(null, { status: 404 });

  await prisma.campanhaTrafego.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
