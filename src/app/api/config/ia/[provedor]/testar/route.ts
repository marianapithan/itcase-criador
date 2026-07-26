import { NextRequest, NextResponse } from "next/server";
import { chamarIA } from "@/lib/ai/gateway";
import { prisma } from "@/lib/db/client";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ provedor: string }> }) {
  const { provedor } = await params;

  // Ativa temporariamente só este provedor para o teste
  const config = await prisma.configIA.findUnique({ where: { provedor } });
  const eraAtivo = config?.ativo ?? false;

  if (!eraAtivo) {
    await prisma.configIA.upsert({
      where: { provedor },
      create: { provedor, ativo: true, prioridade: 99 },
      update: { ativo: true },
    });
  }

  const resultado = await chamarIA({
    funcionalidade: "teste-conexao",
    prompt: "Responda apenas: OK",
    maxTokens: 10,
  });

  if (!eraAtivo) {
    await prisma.configIA.update({ where: { provedor }, data: { ativo: false } });
  }

  await prisma.configIA.update({
    where: { provedor },
    data: {
      ultimoTeste: new Date(),
      statusTeste: resultado.sucesso ? "OK" : resultado.erro?.slice(0, 200),
    },
  });

  return NextResponse.json({ sucesso: resultado.sucesso, erro: resultado.erro });
}
