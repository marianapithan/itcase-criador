import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.titulo !== undefined) data.titulo = body.titulo;
    const tendencia = await prisma.tendencia.update({ where: { id }, data });
    return NextResponse.json(tendencia);
  } catch (err) {
    return NextResponse.json({ erro: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.tendencia.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ erro: String(err) }, { status: 500 });
  }
}
