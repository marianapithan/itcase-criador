import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth-session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;
  const conteudo = await prisma.conteudo.findFirst({ where: { id, userId }, include: { tema: { select: { titulo: true } } } });
  if (!conteudo) return new NextResponse(null, { status: 404 });
  return NextResponse.json(conteudo);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;
  const body = await req.json();

  const existe = await prisma.conteudo.findFirst({ where: { id, userId } });
  if (!existe) return new NextResponse(null, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.titulo !== undefined) data.titulo = body.titulo;
  if (body.status !== undefined) data.status = body.status;
  if (body.formato !== undefined) data.formato = body.formato;
  if (body.roteiro !== undefined) data.roteiro = body.roteiro;
  if (body.legenda !== undefined) data.legenda = body.legenda;
  if (body.objetivo !== undefined) data.objetivo = body.objetivo;
  if (body.etapaFunil !== undefined) data.etapaFunil = body.etapaFunil;
  if (body.responsavel !== undefined) data.responsavel = body.responsavel;
  if (body.temaId !== undefined) data.temaId = body.temaId || null;
  if (body.descricao !== undefined) data.descricao = body.descricao;
  if (body.dataplanejada !== undefined) data.dataplanejada = body.dataplanejada ? new Date(body.dataplanejada) : null;
  if (body.dataPublicacao !== undefined) data.dataPublicacao = body.dataPublicacao ? new Date(body.dataPublicacao) : null;
  if (body.urlPublicacao !== undefined) data.urlPublicacao = body.urlPublicacao;
  if (body.canal !== undefined) data.canal = body.canal;
  if (body.campanha !== undefined) data.campanha = body.campanha;
  if (body.gravado !== undefined) data.gravado = body.gravado;
  if (body.editado !== undefined) data.editado = body.editado;
  if (body.agendadoRede !== undefined) data.agendadoRede = body.agendadoRede;
  if (body.concluido !== undefined) data.concluido = body.concluido;
  if (body.trafegoAtivo !== undefined) data.trafegoAtivo = body.trafegoAtivo;
  if (body.trafegoStatus !== undefined) data.trafegoStatus = body.trafegoStatus;
  if (body.trafegoInicio !== undefined) data.trafegoInicio = body.trafegoInicio ? new Date(body.trafegoInicio) : null;
  if (body.trafegoFim !== undefined) data.trafegoFim = body.trafegoFim ? new Date(body.trafegoFim) : null;
  if (body.trafegoObjetivo !== undefined) data.trafegoObjetivo = body.trafegoObjetivo;
  if (body.trafegoObs !== undefined) data.trafegoObs = body.trafegoObs;
  if (body.hashtags !== undefined) data.hashtags = body.hashtags;

  const conteudo = await prisma.conteudo.update({ where: { id }, data });
  return NextResponse.json(conteudo);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { id } = await params;
  const existe = await prisma.conteudo.findFirst({ where: { id, userId } });
  if (!existe) return new NextResponse(null, { status: 404 });

  await prisma.conteudo.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
