import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { garantirMigracoes } from "@/lib/db/migracoes";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  await garantirMigracoes();

  const user = await prisma.user.findUnique({ where: { id: sessao.userId } });
  return NextResponse.json({ concluido: user?.onboardingConcluido ?? false });
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  await garantirMigracoes();

  const { perfilTipo, segmento, faseDigital } = await req.json();

  await prisma.user.update({
    where: { id: sessao.userId },
    data: { perfilTipo, segmento, faseDigital, onboardingConcluido: true },
  });

  return NextResponse.json({ ok: true });
}
