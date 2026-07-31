import { NextRequest, NextResponse } from "next/server";
import { encontrarMembro, ADMIN_EMAIL } from "@/lib/team";
import { assinarSessao, cookieOpts, COOKIE, USER_COOKIE } from "@/lib/session";
import { prisma } from "@/lib/db/client";
import { verificarSenha } from "@/lib/db/hash";
import { garantirMigracoes } from "@/lib/db/migracoes";

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();
  await garantirMigracoes();

  // 1. Tenta encontrar usuário no time fixo (admin + equipe It Case)
  const membro = encontrarMembro(email ?? "", senha ?? "");
  if (membro) {
    const userId = membro.role === "admin" ? "admin-default" : `team-${membro.email.replace(/[@.]/g, "-")}`;
    const token = await assinarSessao(membro.nome, membro.email, membro.role, userId);
    const res = NextResponse.json({ ok: true, nome: membro.nome, role: membro.role });
    res.cookies.set(COOKIE, token, cookieOpts());
    res.cookies.set(USER_COOKIE, membro.nome, { ...cookieOpts(), httpOnly: false });
    return res;
  }

  // 2. Tenta encontrar usuário cadastrado na plataforma (Cria Para Mim)
  const user = await prisma.user.findUnique({ where: { email: (email ?? "").toLowerCase().trim() } }).catch(() => null);
  if (!user) {
    return NextResponse.json({ erro: "Email ou senha incorretos." }, { status: 401 });
  }
  const senhaOk = await verificarSenha(senha ?? "", user.senhaHash);
  if (!senhaOk) {
    return NextResponse.json({ erro: "Email ou senha incorretos." }, { status: 401 });
  }

  const role = user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "admin" : "user";
  const token = await assinarSessao(user.nome, user.email, role, user.id);
  const res = NextResponse.json({ ok: true, nome: user.nome, role });
  res.cookies.set(COOKIE, token, cookieOpts());
  res.cookies.set(USER_COOKIE, user.nome, { ...cookieOpts(), httpOnly: false });
  return res;
}
