import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { garantirMigracoes } from "@/lib/db/migracoes";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  await garantirMigracoes();
  try {
    const estudo = await prisma.estudoEstrategico.findUnique({ where: { id: userId } });
    if (!estudo) return NextResponse.json({ status: "novo" });
    return NextResponse.json(estudo);
  } catch {
    return NextResponse.json({ status: "novo" });
  }
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  await garantirMigracoes();
  const body = await req.json();
  const { respostas } = body as { respostas: Record<string, string> };

  // Mescla com respostas existentes para não perder dados de outros módulos
  let existentes: Record<string, string> = {};
  try {
    const atual = await prisma.estudoEstrategico.findUnique({ where: { id: userId } });
    if (atual?.respostas) existentes = JSON.parse(atual.respostas) as Record<string, string>;
  } catch { /* ignora */ }

  const merged = { ...existentes, ...respostas };

  const estudo = await prisma.estudoEstrategico.upsert({
    where: { id: userId },
    update: { respostas: JSON.stringify(merged) },
    create: { id: userId, respostas: JSON.stringify(merged) },
  });

  return NextResponse.json(estudo);
}
