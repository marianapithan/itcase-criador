import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ provedor: string }> }) {
  const { provedor } = await params;
  const body = await req.json();

  const config = await prisma.configIA.upsert({
    where: { provedor },
    create: { provedor, ...body },
    update: body,
  });

  return NextResponse.json(config);
}
