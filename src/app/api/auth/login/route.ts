import { NextRequest, NextResponse } from "next/server";
import { encontrarMembro } from "@/lib/team";
import { assinarSessao, cookieOpts, COOKIE, USER_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json();

  const membro = encontrarMembro(email ?? "", senha ?? "");
  if (!membro) {
    return NextResponse.json({ erro: "Email ou senha incorretos." }, { status: 401 });
  }

  const token = await assinarSessao(membro.nome, membro.email);

  const res = NextResponse.json({ ok: true, nome: membro.nome });
  res.cookies.set(COOKIE, token, cookieOpts());
  res.cookies.set(USER_COOKIE, membro.nome, {
    ...cookieOpts(),
    httpOnly: false, // legível pelo client para exibir nome na sidebar
  });
  return res;
}
