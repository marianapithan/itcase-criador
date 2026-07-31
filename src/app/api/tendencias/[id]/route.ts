import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  try {
    const { id } = await params;
    const body = await req.json();

    const existe = await prisma.tendencia.findFirst({ where: { id, userId } });
    if (!existe) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.titulo !== undefined) data.titulo = body.titulo;
    const tendencia = await prisma.tendencia.update({ where: { id }, data });
    return NextResponse.json(tendencia);
  } catch (err) {
    return NextResponse.json({ erro: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  try {
    const { id } = await params;
    const existe = await prisma.tendencia.findFirst({ where: { id, userId } });
    if (!existe) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

    await prisma.tendencia.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ erro: String(err) }, { status: 500 });
  }
}
