import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";
import { garantirMigracoes } from "@/lib/db/migracoes";

const CORES_PALETTE = [
  "#EF4444", "#8B5CF6", "#10B981", "#3B82F6", "#F59E0B",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#14B8A6",
  "#6366F1", "#D946EF",
];

export async function GET(req: NextRequest) {
  await garantirMigracoes();
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const membros = await prisma.membroEquipe.findMany({
    where: { userId: sessao.userId },
    orderBy: { criadoEm: "asc" },
  });
  return NextResponse.json(membros);
}

export async function POST(req: NextRequest) {
  await garantirMigracoes();
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });

  const { nome } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ erro: "Nome obrigatório" }, { status: 400 });

  const count = await prisma.membroEquipe.count({ where: { userId: sessao.userId } });
  const cor = CORES_PALETTE[count % CORES_PALETTE.length];

  const membro = await prisma.membroEquipe.create({
    data: { userId: sessao.userId, nome: nome.trim(), cor },
  });
  return NextResponse.json(membro);
}
