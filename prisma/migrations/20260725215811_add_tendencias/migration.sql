-- CreateTable
CREATE TABLE "Tendencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "grau" TEXT NOT NULL DEFAULT 'MEDIA',
    "motivo" TEXT,
    "publico" TEXT,
    "potAlcance" TEXT,
    "potVendas" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOVA',
    "formato" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
