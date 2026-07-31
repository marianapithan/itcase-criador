import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { verificarSessao, assinarSessao, COOKIE, cookieOpts } from "@/lib/session";

const BACKUP_COOKIE = "admin_impersonate_backup";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;
  if (!sessao || sessao.role !== "admin") {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ erro: "userId obrigatório" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 });

  const userToken = await assinarSessao(user.nome, user.email, user.role as "admin" | "user", user.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(BACKUP_COOKIE, token!, { ...cookieOpts(), httpOnly: true });
  res.cookies.set(COOKIE, userToken, cookieOpts());
  return res;
}

export async function DELETE(req: NextRequest) {
  const backup = req.cookies.get(BACKUP_COOKIE)?.value;
  if (!backup) return NextResponse.json({ erro: "Sem impersonação ativa" }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, backup, cookieOpts());
  res.cookies.delete(BACKUP_COOKIE);
  return res;
}
