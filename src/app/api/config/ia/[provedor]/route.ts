import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ provedor: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { provedor } = await params;
  const body = await req.json();

  const config = await prisma.configIA.upsert({
    where: { userId_provedor: { userId, provedor } },
    create: { id: `${userId}_${provedor}`, userId, provedor, ...body },
    update: body,
  });

  return NextResponse.json(config);
}
