import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const estudo = await prisma.estudoEstrategico.findUnique({ where: { id: userId } });

  if (!estudo) {
    return NextResponse.json({ completa: false, secoes: 0, total: 7 });
  }

  const secoes = [
    estudo.secEmpresa,
    estudo.secPersona,
    estudo.secJornada,
    estudo.secMercado,
    estudo.secPosicionamento,
    estudo.secCriadora,
    estudo.secObjetivos,
  ];

  const preenchidas = secoes.filter((s) => s && s.trim().length > 10).length;
  const completa = preenchidas >= 5;

  return NextResponse.json({ completa, secoes: preenchidas, total: secoes.length });
}
