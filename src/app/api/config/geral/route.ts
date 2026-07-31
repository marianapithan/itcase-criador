import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { garantirMigracoes } from "@/lib/db/migracoes";
import { invalidarCacheConfigGeral } from "@/lib/db/config-geral";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  await garantirMigracoes();
  const row = await prisma.configGeral.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, nomeNegocio: "", instagram: "", metaPublicados: 0, metaSeguidores: 0, metaReceita: 0 },
  });
  return NextResponse.json({ nomeNegocio: row.nomeNegocio, instagram: row.instagram, metaPublicados: row.metaPublicados, metaSeguidores: row.metaSeguidores, metaReceita: row.metaReceita });
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  await garantirMigracoes();
  const body = await req.json();
  const row = await prisma.configGeral.upsert({
    where: { id: userId },
    update: {
      ...(body.nomeNegocio    !== undefined ? { nomeNegocio:    body.nomeNegocio }         : {}),
      ...(body.instagram      !== undefined ? { instagram:      body.instagram }            : {}),
      ...(body.metaPublicados !== undefined ? { metaPublicados: Number(body.metaPublicados) } : {}),
      ...(body.metaSeguidores !== undefined ? { metaSeguidores: Number(body.metaSeguidores) } : {}),
      ...(body.metaReceita    !== undefined ? { metaReceita:    Number(body.metaReceita) }    : {}),
    },
    create: {
      id: userId,
      nomeNegocio:    body.nomeNegocio    ?? "",
      instagram:      body.instagram      ?? "",
      metaPublicados: Number(body.metaPublicados ?? 0),
      metaSeguidores: Number(body.metaSeguidores ?? 0),
      metaReceita:    Number(body.metaReceita    ?? 0),
    },
  });
  invalidarCacheConfigGeral();
  return NextResponse.json({ ok: true, nomeNegocio: row.nomeNegocio, instagram: row.instagram, metaPublicados: row.metaPublicados, metaSeguidores: row.metaSeguidores, metaReceita: row.metaReceita });
}
