import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const configs = await prisma.configIA.findMany({ orderBy: { prioridade: "asc" } });

  // Garante que todos os 3 provedores existam
  const provedores = ["anthropic", "gemini", "openai"];
  for (const p of provedores) {
    if (!configs.find((c) => c.provedor === p)) {
      await prisma.configIA.create({ data: { provedor: p, ativo: false, prioridade: provedores.indexOf(p) + 1 } });
    }
  }

  const atualizado = await prisma.configIA.findMany({ orderBy: { prioridade: "asc" } });
  return NextResponse.json(atualizado);
}
