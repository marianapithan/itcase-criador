import { NextRequest, NextResponse } from "next/server";
import { chamarIA } from "@/lib/ai/gateway";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ provedor: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { provedor } = await params;

  // Ativa temporariamente só este provedor para o teste
  const config = await prisma.configIA.findUnique({ where: { userId_provedor: { userId, provedor } } });
  const eraAtivo = config?.ativo ?? false;

  if (!eraAtivo) {
    await prisma.configIA.upsert({
      where: { userId_provedor: { userId, provedor } },
      create: { id: `${userId}_${provedor}`, userId, provedor, ativo: true, prioridade: 99 },
      update: { ativo: true },
    });
  }

  const resultado = await chamarIA({
    funcionalidade: "teste-conexao",
    prompt: "Responda apenas: OK",
    maxTokens: 10,
  });

  if (!eraAtivo) {
    await prisma.configIA.update({ where: { userId_provedor: { userId, provedor } }, data: { ativo: false } });
  }

  await prisma.configIA.update({
    where: { userId_provedor: { userId, provedor } },
    data: {
      ultimoTeste: new Date(),
      statusTeste: resultado.sucesso ? "OK" : resultado.erro?.slice(0, 200),
    },
  });

  return NextResponse.json({ sucesso: resultado.sucesso, erro: resultado.erro });
}
