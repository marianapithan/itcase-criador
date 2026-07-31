import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { hashSenha } from "@/lib/db/hash";
import { assinarSessao, cookieOpts, COOKIE, USER_COOKIE } from "@/lib/session";
import { garantirMigracoes } from "@/lib/db/migracoes";

export async function POST(req: NextRequest) {
  await garantirMigracoes();
  const { nome, email, senha } = await req.json();

  if (!nome?.trim() || !email?.trim() || !senha?.trim()) {
    return NextResponse.json({ erro: "Preencha nome, email e senha." }, { status: 400 });
  }
  if (senha.length < 6) {
    return NextResponse.json({ erro: "Senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const emailNorm = email.toLowerCase().trim();
  const existe = await prisma.user.findUnique({ where: { email: emailNorm } }).catch(() => null);
  if (existe) {
    return NextResponse.json({ erro: "Este email já tem uma conta. Faça login." }, { status: 409 });
  }

  const senhaHash = await hashSenha(senha);
  const user = await prisma.user.create({
    data: { nome: nome.trim(), email: emailNorm, senhaHash, role: "user" },
  });

  // Cria registros iniciais isolados para o novo usuário
  await Promise.allSettled([
    prisma.configFramework.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, ativo: "PAS" },
    }),
    prisma.configGeral.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, nomeNegocio: "", instagram: "" },
    }),
    prisma.estudoEstrategico.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id },
    }),
    // Cria ConfigIA padrão: Claude=1, ChatGPT=2, Gemini=3
    ...[
      { provedor: "anthropic", prioridade: 1, ativo: true  },
      { provedor: "openai",    prioridade: 2, ativo: false },
      { provedor: "gemini",    prioridade: 3, ativo: false },
    ].map(({ provedor, prioridade, ativo }) =>
      prisma.configIA.upsert({
        where: { userId_provedor: { userId: user.id, provedor } },
        update: {},
        create: { id: `${user.id}_${provedor}`, userId: user.id, provedor, ativo, prioridade },
      })
    ),
  ]);

  const token = await assinarSessao(user.nome, user.email, "user", user.id);
  const res = NextResponse.json({ ok: true, nome: user.nome });
  res.cookies.set(COOKIE, token, cookieOpts());
  res.cookies.set(USER_COOKIE, user.nome, { ...cookieOpts(), httpOnly: false });
  return res;
}
