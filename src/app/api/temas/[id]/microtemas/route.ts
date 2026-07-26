import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { titulo, descricao } = await req.json();
  const micro = await prisma.microtema.create({
    data: { titulo, descricao, temaId: id, status: "IDEIA" },
  });
  return NextResponse.json(micro, { status: 201 });
}
