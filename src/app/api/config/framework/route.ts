import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { FRAMEWORKS, type FrameworkId } from "@/lib/frameworks";

async function garantirTabela() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ConfigFramework" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
        "ativo" TEXT NOT NULL DEFAULT 'AIDA',
        "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch { /* tabela já existe */ }
}

export async function GET() {
  await garantirTabela();
  try {
    const config = await prisma.configFramework.findUnique({ where: { id: "default" } });
    return NextResponse.json({ ativo: config?.ativo ?? "AIDA" });
  } catch {
    return NextResponse.json({ ativo: "AIDA" });
  }
}

export async function POST(req: NextRequest) {
  await garantirTabela();
  const { ativo } = await req.json();

  if (!FRAMEWORKS[ativo as FrameworkId]) {
    return NextResponse.json({ erro: "Framework inválido" }, { status: 400 });
  }

  const config = await prisma.configFramework.upsert({
    where: { id: "default" },
    update: { ativo },
    create: { id: "default", ativo },
  });

  return NextResponse.json({ ativo: config.ativo });
}
