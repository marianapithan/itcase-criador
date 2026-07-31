import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { garantirMigracoes } from "@/lib/db/migracoes";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  await garantirMigracoes();

  const user = await prisma.user.findUnique({ where: { id: sessao.userId } });
  if (!user) return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 });

  return NextResponse.json({
    nome: user.nome,
    email: user.email,
    nomeEmpresa: user.nomeEmpresa ?? "",
    instagramHandle: user.instagramHandle ?? "",
    tiktokHandle: user.tiktokHandle ?? "",
    dataNascimento: user.dataNascimento ?? "",
    whatsapp: user.whatsapp ?? "",
  });
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  await garantirMigracoes();

  const body = await req.json();

  const user = await prisma.user.update({
    where: { id: sessao.userId },
    data: {
      ...(body.nome !== undefined ? { nome: body.nome } : {}),
      ...(body.nomeEmpresa !== undefined ? { nomeEmpresa: body.nomeEmpresa } : {}),
      ...(body.instagramHandle !== undefined ? { instagramHandle: body.instagramHandle } : {}),
      ...(body.tiktokHandle !== undefined ? { tiktokHandle: body.tiktokHandle } : {}),
      ...(body.dataNascimento !== undefined ? { dataNascimento: body.dataNascimento } : {}),
      ...(body.whatsapp !== undefined ? { whatsapp: body.whatsapp } : {}),
    },
  });

  // Sincroniza nomeEmpresa com ConfigGeral para aparecer na sidebar
  if (body.nomeEmpresa !== undefined) {
    await prisma.configGeral.upsert({
      where: { id: sessao.userId },
      update: { nomeNegocio: body.nomeEmpresa },
      create: { id: sessao.userId, nomeNegocio: body.nomeEmpresa, instagram: "" },
    });
  }

  return NextResponse.json({ ok: true, nome: user.nome });
}
