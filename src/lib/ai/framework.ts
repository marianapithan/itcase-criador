import { prisma } from "@/lib/db/client";
import { FRAMEWORKS, type FrameworkId } from "@/lib/frameworks";

async function garantirTabelaFramework() {
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

export async function obterFrameworkAtivo(userId = "admin-default"): Promise<string> {
  await garantirTabelaFramework();
  try {
    const config = await prisma.configFramework.findUnique({ where: { id: userId } });
    const id = (config?.ativo ?? "AIDA") as FrameworkId;
    const fw = FRAMEWORKS[id] ?? FRAMEWORKS["AIDA"];
    return fw.promptMestre;
  } catch {
    return FRAMEWORKS["AIDA"].promptMestre;
  }
}

export async function obterFrameworkAtivoId(userId = "admin-default"): Promise<FrameworkId> {
  await garantirTabelaFramework();
  try {
    const config = await prisma.configFramework.findUnique({ where: { id: userId } });
    return (config?.ativo ?? "AIDA") as FrameworkId;
  } catch {
    return "AIDA";
  }
}
