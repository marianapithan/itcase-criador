import { prisma } from "@/lib/db/client";

let migracoesFeitasNaInstancia = false;

export async function garantirMigracoes() {
  if (migracoesFeitasNaInstancia) return;

  // ── Tabela User ─────────────────────────────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "nome" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "senhaHash" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'user',
        "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch { /* já existe */ }
  try {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`);
  } catch {}

  // ── Tabela ConfigGeral ───────────────────────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ConfigGeral" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
        "nomeNegocio" TEXT NOT NULL DEFAULT '',
        "instagram" TEXT NOT NULL DEFAULT '',
        "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "atualizadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch { /* já existe */ }
  try { await prisma.$executeRawUnsafe(`ALTER TABLE "ConfigGeral" ADD COLUMN "instagram" TEXT NOT NULL DEFAULT ''`); } catch {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE "ConfigGeral" ADD COLUMN "metaPublicados" INTEGER NOT NULL DEFAULT 0`); } catch {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE "ConfigGeral" ADD COLUMN "metaSeguidores" INTEGER NOT NULL DEFAULT 0`); } catch {}
  try { await prisma.$executeRawUnsafe(`ALTER TABLE "ConfigGeral" ADD COLUMN "metaReceita" INTEGER NOT NULL DEFAULT 0`); } catch {}

  // ── Colunas userId nas tabelas de coleção ────────────────────────────────────
  const tabelasColecao = ["Tema", "Conteudo", "Objecao", "Tendencia", "CampanhaTrafego", "LogIA"];
  for (const t of tabelasColecao) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${t}" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'admin-default'`);
    } catch { /* coluna já existe */ }
  }

  // ── userId na ConfigIA ───────────────────────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "ConfigIA" ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'admin-default'`);
  } catch {}
  // Garante que os registros antigos de ConfigIA usam id com prefixo userId
  try {
    // Migra registros antigos que não têm "_" no id (id antigo = cuid sem prefixo)
    await prisma.$executeRawUnsafe(`
      UPDATE "ConfigIA" SET "id" = 'admin-default_' || "provedor"
      WHERE "userId" = 'admin-default' AND "id" NOT LIKE 'admin-default_%'
    `);
  } catch {}

  // ── Demais colunas da EstudoEstrategico ─────────────────────────────────────
  const colsEstudo: [string, string][] = [
    ["secAnaliseCompleta", "TEXT NOT NULL DEFAULT ''"],
    ["secCriadora",        "TEXT NOT NULL DEFAULT ''"],
    ["secObjetivos",       "TEXT NOT NULL DEFAULT ''"],
    ["secComunicacao",     "TEXT NOT NULL DEFAULT ''"],
  ];
  for (const [col, tipo] of colsEstudo) {
    try { await prisma.$executeRawUnsafe(`ALTER TABLE "EstudoEstrategico" ADD COLUMN "${col}" ${tipo}`); } catch {}
  }

  // ── Colunas adicionais do Conteudo ──────────────────────────────────────────
  const colsConteudo: [string, string][] = [
    ["legenda",            "TEXT"],
    ["etapaFunil",         "TEXT"],
    ["responsavel",        "TEXT"],
    ["gravado",            "BOOLEAN NOT NULL DEFAULT false"],
    ["editado",            "BOOLEAN NOT NULL DEFAULT false"],
    ["agendadoRede",       "BOOLEAN NOT NULL DEFAULT false"],
    ["concluido",          "BOOLEAN NOT NULL DEFAULT false"],
    ["roteiroAnterior",    "TEXT"],
    ["legendaAnterior",    "TEXT"],
    ["trafegoAtivo",       "BOOLEAN NOT NULL DEFAULT false"],
    ["trafegoStatus",      "TEXT"],
    ["trafegoInicio",      "DATETIME"],
    ["trafegoFim",         "DATETIME"],
    ["trafegoObjetivo",    "TEXT"],
    ["trafegoObs",         "TEXT"],
    ["metricaAlcance",     "INTEGER"],
    ["metricaImpressoes",  "INTEGER"],
    ["metricaCurtidas",    "INTEGER"],
    ["metricaComentarios", "INTEGER"],
    ["metricaSalvamentos", "INTEGER"],
    ["hashtags",           "TEXT"],
    ["sugestoesProducao",  "TEXT"],
  ];
  for (const [col, tipo] of colsConteudo) {
    try { await prisma.$executeRawUnsafe(`ALTER TABLE "Conteudo" ADD COLUMN "${col}" ${tipo}`); } catch {}
  }

  // ── Colunas adicionais da Objecao ───────────────────────────────────────────
  const colsObjecao: [string, string][] = [
    ["contexto",               "TEXT"],
    ["clienteConheciaProduto", "TEXT"],
    ["objetivoCliente",        "TEXT"],
    ["crencaGerou",            "TEXT"],
  ];
  for (const [col, tipo] of colsObjecao) {
    try { await prisma.$executeRawUnsafe(`ALTER TABLE "Objecao" ADD COLUMN "${col}" ${tipo}`); } catch {}
  }

  // ── Tabela ResetSenha ────────────────────────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ResetSenha" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expiresAt" DATETIME NOT NULL,
        "usado" BOOLEAN NOT NULL DEFAULT false,
        "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch {}
  try {
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ResetSenha_token_key" ON "ResetSenha"("token")`);
  } catch {}

  // ── Colunas de onboarding e perfil no User ──────────────────────────────────
  const colsUser: [string, string][] = [
    ["onboardingConcluido", "BOOLEAN NOT NULL DEFAULT false"],
    ["perfilTipo",          "TEXT"],
    ["segmento",            "TEXT"],
    ["faseDigital",         "TEXT"],
    ["nomeEmpresa",         "TEXT"],
    ["instagramHandle",     "TEXT"],
    ["tiktokHandle",        "TEXT"],
    ["dataNascimento",      "TEXT"],
    ["whatsapp",            "TEXT"],
  ];
  for (const [col, tipo] of colsUser) {
    try { await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "${col}" ${tipo}`); } catch {}
  }

  // ── Pré-popula ConfigGeral do admin com "It Case" ───────────────────────────
  try {
    await prisma.$executeRawUnsafe(`
      INSERT OR IGNORE INTO "ConfigGeral" ("id", "nomeNegocio", "instagram", "criadoEm", "atualizadoEm")
      VALUES ('admin-default', 'It Case', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    // Se já existia com id="default", garante o admin-default também
    await prisma.$executeRawUnsafe(`
      INSERT OR IGNORE INTO "ConfigGeral" ("id", "nomeNegocio", "instagram", "criadoEm", "atualizadoEm")
      SELECT 'admin-default', "nomeNegocio", "instagram", "criadoEm", "atualizadoEm"
      FROM "ConfigGeral" WHERE "id" = 'default' AND NOT EXISTS (SELECT 1 FROM "ConfigGeral" WHERE "id"='admin-default')
    `);
  } catch {}

  // ── Tabela MembroEquipe ──────────────────────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MembroEquipe" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "nome" TEXT NOT NULL,
        "cor" TEXT NOT NULL DEFAULT '#6B7280',
        "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch {}

  migracoesFeitasNaInstancia = true;
}
