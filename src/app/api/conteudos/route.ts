import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { searchParams } = new URL(req.url);
  const comData = searchParams.get("comData") === "true";
  const incluirTema = searchParams.get("incluirTema") === "true";
  const pendentesHoje = searchParams.get("pendentesHoje") === "true";

  if (pendentesHoje) {
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0, 0);
    const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
    const pendentes = await prisma.conteudo.findMany({
      where: {
        userId,
        dataplanejada: { gte: inicioDia, lte: fimDia },
        status: { notIn: ["PUBLICADO", "DESCARTADO"] },
        concluido: false,
      },
      orderBy: { dataplanejada: "asc" },
    });
    return NextResponse.json(pendentes);
  }

  const where = comData ? { userId, dataplanejada: { not: null } } : { userId };
  const limit = Math.min(Number(searchParams.get("limit") ?? "200"), 500);

  const conteudos = await prisma.conteudo.findMany({
    where,
    orderBy: { criadoEm: "desc" },
    take: limit,
    include: incluirTema ? { tema: { select: { titulo: true } } } : undefined,
  });

  return NextResponse.json(conteudos);
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const body = await req.json();
  const conteudo = await prisma.conteudo.create({
    data: {
      userId,
      titulo: body.titulo,
      descricao: body.descricao,
      roteiro: body.roteiro,
      formato: body.formato ?? "POST_ESTATICO",
      canal: body.canal,
      status: body.status ?? "IDEIA",
      dataplanejada: body.dataplanejada ? new Date(body.dataplanejada) : undefined,
      objetivo: body.objetivo,
      cta: body.cta,
      campanha: body.campanha,
      temaId: body.temaId,
      microtemaId: body.microtemaId,
    },
  });
  return NextResponse.json(conteudo, { status: 201 });
}
