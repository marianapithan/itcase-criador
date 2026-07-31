import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  try {
    const { searchParams } = new URL(req.url);
    const plataforma = searchParams.get("plataforma");
    const categoria = searchParams.get("categoria");
    const status = searchParams.get("status");

    const tendencias = await prisma.tendencia.findMany({
      where: {
        userId,
        ...(plataforma ? { plataforma } : {}),
        ...(categoria ? { categoria } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { criadoEm: "desc" },
    });

    return NextResponse.json(tendencias);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ erro: msg }, { status: 500 });
  }
}
