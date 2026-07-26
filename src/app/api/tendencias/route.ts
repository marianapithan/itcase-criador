import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const plataforma = searchParams.get("plataforma");
    const categoria = searchParams.get("categoria");
    const status = searchParams.get("status");

    const tendencias = await prisma.tendencia.findMany({
      where: {
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
