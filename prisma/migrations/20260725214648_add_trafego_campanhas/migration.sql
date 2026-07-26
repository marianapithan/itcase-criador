-- CreateTable
CREATE TABLE "CampanhaTrafego" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "dataInicio" DATETIME NOT NULL,
    "dataFim" DATETIME NOT NULL,
    "objetivo" TEXT,
    "observacoes" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Conteudo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "roteiro" TEXT,
    "formato" TEXT NOT NULL DEFAULT 'POST_ESTATICO',
    "canal" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDEIA',
    "dataplanejada" DATETIME,
    "dataPublicacao" DATETIME,
    "urlPublicacao" TEXT,
    "objetivo" TEXT,
    "cta" TEXT,
    "campanha" TEXT,
    "temaId" TEXT,
    "microtemaId" TEXT,
    "origemId" TEXT,
    "providerUsado" TEXT,
    "modeloUsado" TEXT,
    "legenda" TEXT,
    "etapaFunil" TEXT,
    "responsavel" TEXT,
    "gravado" BOOLEAN NOT NULL DEFAULT false,
    "editado" BOOLEAN NOT NULL DEFAULT false,
    "agendadoRede" BOOLEAN NOT NULL DEFAULT false,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "trafegoAtivo" BOOLEAN NOT NULL DEFAULT false,
    "trafegoStatus" TEXT,
    "trafegoInicio" DATETIME,
    "trafegoFim" DATETIME,
    "trafegoObjetivo" TEXT,
    "trafegoObs" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Conteudo_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conteudo_microtemaId_fkey" FOREIGN KEY ("microtemaId") REFERENCES "Microtema" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conteudo_origemId_fkey" FOREIGN KEY ("origemId") REFERENCES "Conteudo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Conteudo" ("agendadoRede", "atualizadoEm", "campanha", "canal", "concluido", "criadoEm", "cta", "dataPublicacao", "dataplanejada", "descricao", "editado", "etapaFunil", "formato", "gravado", "id", "legenda", "microtemaId", "modeloUsado", "objetivo", "origemId", "providerUsado", "responsavel", "roteiro", "status", "temaId", "titulo", "urlPublicacao") SELECT "agendadoRede", "atualizadoEm", "campanha", "canal", "concluido", "criadoEm", "cta", "dataPublicacao", "dataplanejada", "descricao", "editado", "etapaFunil", "formato", "gravado", "id", "legenda", "microtemaId", "modeloUsado", "objetivo", "origemId", "providerUsado", "responsavel", "roteiro", "status", "temaId", "titulo", "urlPublicacao" FROM "Conteudo";
DROP TABLE "Conteudo";
ALTER TABLE "new_Conteudo" RENAME TO "Conteudo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
