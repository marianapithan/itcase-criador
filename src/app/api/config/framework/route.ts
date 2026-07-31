import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { FRAMEWORKS, type FrameworkId } from "@/lib/frameworks";
import { garantirMigracoes } from "@/lib/db/migracoes";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  await garantirMigracoes();
  try {
    const config = await prisma.configFramework.findUnique({ where: { id: userId } });
    return NextResponse.json({ ativo: config?.ativo ?? "AIDA" });
  } catch {
    return NextResponse.json({ ativo: "AIDA" });
  }
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  await garantirMigracoes();
  const { ativo } = await req.json();

  if (!FRAMEWORKS[ativo as FrameworkId]) {
    return NextResponse.json({ erro: "Framework inválido" }, { status: 400 });
  }

  const config = await prisma.configFramework.upsert({
    where: { id: userId },
    update: { ativo },
    create: { id: userId, ativo },
  });

  return NextResponse.json({ ativo: config.ativo });
}
