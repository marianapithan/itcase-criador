import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

async function garantirTabela() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EstudoEstrategico" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
        "respostas" TEXT NOT NULL DEFAULT '{}',
        "secEmpresa" TEXT NOT NULL DEFAULT '',
        "secPersona" TEXT NOT NULL DEFAULT '',
        "secJornada" TEXT NOT NULL DEFAULT '',
        "secMercado" TEXT NOT NULL DEFAULT '',
        "secPosicionamento" TEXT NOT NULL DEFAULT '',
        "secMapa" TEXT NOT NULL DEFAULT '',
        "secAnaliseCompleta" TEXT NOT NULL DEFAULT '',
        "status" TEXT NOT NULL DEFAULT 'novo',
        "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch { /* tabela já existe */ }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "EstudoEstrategico" ADD COLUMN "secAnaliseCompleta" TEXT NOT NULL DEFAULT ''`
    );
  } catch { /* coluna já existe */ }
}

export async function GET() {
  await garantirTabela();
  try {
    const estudo = await prisma.estudoEstrategico.findUnique({ where: { id: "default" } });
    if (!estudo) return NextResponse.json({ status: "novo" });
    return NextResponse.json(estudo);
  } catch {
    return NextResponse.json({ status: "novo" });
  }
}

export async function POST(req: NextRequest) {
  await garantirTabela();
  const body = await req.json();
  const { respostas } = body as { respostas: Record<string, string> };

  // Mescla com respostas existentes para não perder dados de outros módulos
  let existentes: Record<string, string> = {};
  try {
    const atual = await prisma.estudoEstrategico.findUnique({ where: { id: "default" } });
    if (atual?.respostas) existentes = JSON.parse(atual.respostas) as Record<string, string>;
  } catch { /* ignora */ }

  const merged = { ...existentes, ...respostas };

  const estudo = await prisma.estudoEstrategico.upsert({
    where: { id: "default" },
    update: { respostas: JSON.stringify(merged) },
    create: { id: "default", respostas: JSON.stringify(merged) },
  });

  return NextResponse.json(estudo);
}
