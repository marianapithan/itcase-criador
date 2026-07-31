import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const configs = await prisma.configIA.findMany({ where: { userId }, orderBy: { prioridade: "asc" } });

  // Garante que todos os 3 provedores existam com prioridades corretas
  const defaults = [
    { provedor: "anthropic", prioridade: 1, ativo: true  },
    { provedor: "openai",    prioridade: 2, ativo: false },
    { provedor: "gemini",    prioridade: 3, ativo: false },
  ];
  for (const d of defaults) {
    if (!configs.find(c => c.provedor === d.provedor)) {
      await prisma.configIA.create({
        data: { id: `${userId}_${d.provedor}`, userId, provedor: d.provedor, ativo: d.ativo, prioridade: d.prioridade },
      });
    }
  }

  // Corrige registros onde todos ficaram com prioridade 1 (bug de migração anterior)
  const todos = await prisma.configIA.findMany({ where: { userId } });
  const todosUm = todos.every(c => c.prioridade === 1);
  if (todosUm && todos.length >= 2) {
    for (const d of defaults) {
      await prisma.configIA.updateMany({ where: { userId, provedor: d.provedor }, data: { prioridade: d.prioridade } });
    }
  }

  const atualizado = await prisma.configIA.findMany({ where: { userId }, orderBy: { prioridade: "asc" } });
  return NextResponse.json(atualizado);
}
