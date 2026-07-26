import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  let adapter: PrismaLibSql;

  if (tursoUrl) {
    // Produção: Turso (libsql remoto)
    adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
  } else {
    // Desenvolvimento: SQLite local
    const dbPath = process.env.DATABASE_URL?.replace("file:", "") ?? "./prisma/dev.db";
    const absolutePath = path.resolve(process.cwd(), dbPath);
    adapter = new PrismaLibSql({ url: `file:${absolutePath}` });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
