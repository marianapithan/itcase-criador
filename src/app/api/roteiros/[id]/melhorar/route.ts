import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";
import { requireAuth } from "@/lib/auth-session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;
  const { instrucao } = await req.json();

  const conteudo = await prisma.conteudo.findFirst({ where: { id, userId } });
  if (!conteudo) return NextResponse.json({ erro: "Conteúdo não encontrado" }, { status: 404 });
  if (!conteudo.roteiro) return NextResponse.json({ erro: "Este conteúdo ainda não tem roteiro" }, { status: 400 });

  const resultado = await chamarIA({
    funcionalidade: "melhorar-roteiro",
    sistema: await contextoCerebro(userId),
    prompt: `Melhore este roteiro conforme a instrução abaixo.

ROTEIRO ATUAL:
${conteudo.roteiro}

INSTRUÇÃO DE MELHORIA:
${instrucao}

REGRAS: escreva APENAS o texto que será falado/lido. Sem indicações de câmera, cena, expressão ou postura. Retorne apenas o roteiro melhorado, sem explicações.`,
    maxTokens: 2500,
  });

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 });
  }

  const atualizado = await prisma.conteudo.update({
    where: { id },
    data: {
      roteiroAnterior: conteudo.roteiro,
      legendaAnterior: conteudo.legenda ?? null,
      roteiro: resultado.conteudo,
      providerUsado: resultado.provedor,
      modeloUsado: resultado.modelo,
    },
  });

  return NextResponse.json(atualizado);
}
