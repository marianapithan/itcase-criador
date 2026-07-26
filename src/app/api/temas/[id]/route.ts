import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const tema = await prisma.tema.update({
    where: { id },
    data: body,
    include: { microtemas: true },
  });
  return NextResponse.json(tema);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.tema.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
