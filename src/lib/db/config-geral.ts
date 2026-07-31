import { prisma } from "@/lib/db/client";

export function invalidarCacheConfigGeral() {
  // cache por userId não é viável em serverless — sem-op mantido para compatibilidade
}

export async function getConfigGeral(userId = "admin-default") {
  const row = await prisma.configGeral.findUnique({ where: { id: userId } })
    ?? await prisma.configGeral.findUnique({ where: { id: "default" } });
  return {
    nomeNegocio:    row?.nomeNegocio    || "",
    instagram:      row?.instagram      || "",
    metaPublicados: row?.metaPublicados ?? 0,
    metaSeguidores: row?.metaSeguidores ?? 0,
    metaReceita:    row?.metaReceita    ?? 0,
  };
}

export async function getNomeNegocio(userId = "admin-default"): Promise<string> {
  const c = await getConfigGeral(userId);
  return c.nomeNegocio;
}
