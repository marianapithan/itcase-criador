-- CreateTable
CREATE TABLE "Estrategia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "objetivo" TEXT,
    "publicoAlvo" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tema" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDEIA',
    "estrategiaId" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Tema_estrategiaId_fkey" FOREIGN KEY ("estrategiaId") REFERENCES "Estrategia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Microtema" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDEIA',
    "temaId" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Microtema_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conteudo" (
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
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "Conteudo_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conteudo_microtemaId_fkey" FOREIGN KEY ("microtemaId") REFERENCES "Microtema" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conteudo_origemId_fkey" FOREIGN KEY ("origemId") REFERENCES "Conteudo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfigIA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provedor" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "prioridade" INTEGER NOT NULL DEFAULT 1,
    "modeloPrincipal" TEXT,
    "modeloFallback" TEXT,
    "ultimoTeste" DATETIME,
    "statusTeste" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LogIA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "funcionalidade" TEXT NOT NULL,
    "provedor" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "tokensEntrada" INTEGER,
    "tokensSaida" INTEGER,
    "latenciaMs" INTEGER,
    "tentativas" INTEGER NOT NULL DEFAULT 1,
    "erro" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfigIA_provedor_key" ON "ConfigIA"("provedor");

-- CreateIndex
CREATE UNIQUE INDEX "LogIA_requestId_key" ON "LogIA"("requestId");
