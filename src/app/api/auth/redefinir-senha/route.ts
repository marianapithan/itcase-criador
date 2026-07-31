import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { garantirMigracoes } from "@/lib/db/migracoes";
import { hashSenha } from "@/lib/db/hash";

export async function POST(req: NextRequest) {
  await garantirMigracoes();
  const { token, senha } = await req.json();

  if (!token || !senha) return NextResponse.json({ erro: "Dados inválidos." }, { status: 400 });
  if (senha.length < 6) return NextResponse.json({ erro: "Senha deve ter no mínimo 6 caracteres." }, { status: 400 });

  const reset = await prisma.resetSenha.findUnique({ where: { token } });

  if (!reset || reset.usado || reset.expiresAt < new Date()) {
    return NextResponse.json({ erro: "Link inválido ou expirado. Solicite um novo." }, { status: 400 });
  }

  const senhaHash = await hashSenha(senha);

  await prisma.user.update({ where: { id: reset.userId }, data: { senhaHash } });
  await prisma.resetSenha.update({ where: { token }, data: { usado: true } });

  return NextResponse.json({ ok: true });
}
