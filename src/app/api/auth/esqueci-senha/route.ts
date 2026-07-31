import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { garantirMigracoes } from "@/lib/db/migracoes";
import { enviarEmailRedefinicaoSenha } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  await garantirMigracoes();
  const { email } = await req.json();

  if (!email) return NextResponse.json({ erro: "Email obrigatório." }, { status: 400 });

  // Responde sempre com sucesso para não revelar se o email existe
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // Invalida tokens anteriores não usados
    await prisma.resetSenha.updateMany({
      where: { userId: user.id, usado: false },
      data: { usado: true },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.resetSenha.create({
      data: { id: randomBytes(8).toString("hex"), userId: user.id, token, expiresAt },
    });

    try {
      await enviarEmailRedefinicaoSenha(user.email, user.nome, token);
    } catch (e) {
      console.error("Erro ao enviar email de redefinição:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
