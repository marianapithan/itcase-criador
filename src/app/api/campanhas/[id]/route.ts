import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.campanhaTrafego.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
