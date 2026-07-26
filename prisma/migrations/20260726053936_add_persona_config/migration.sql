-- CreateTable
CREATE TABLE "PersonaConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "nomePersona" TEXT NOT NULL DEFAULT 'Ana Conquista',
    "faixaEtaria" TEXT NOT NULL DEFAULT '25 a 40 anos',
    "localizacao" TEXT NOT NULL DEFAULT 'Londrina e região',
    "perfilCompra" TEXT NOT NULL DEFAULT 'Consultivo, não impulsivo',
    "desejos" TEXT NOT NULL DEFAULT '[]',
    "medos" TEXT NOT NULL DEFAULT '[]',
    "palavrasMarca" TEXT NOT NULL DEFAULT '[]',
    "palavrasProibidas" TEXT NOT NULL DEFAULT '[]',
    "diferenciais" TEXT NOT NULL DEFAULT '[]',
    "comoComunicar" TEXT NOT NULL DEFAULT '[]',
    "sugestoesIA" TEXT,
    "atualizadoEm" DATETIME NOT NULL
);
