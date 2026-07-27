import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const objecao = await prisma.objecao.update({ where: { id }, data: body });
  return NextResponse.json(objecao);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.objecao.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
