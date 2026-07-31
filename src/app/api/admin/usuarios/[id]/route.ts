import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { verificarSessao, COOKIE } from "@/lib/session";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;
  if (!sessao || sessao.role !== "admin") {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });

  const [conteudos, temas, membros, logsIA, configIA] = await Promise.all([
    prisma.conteudo.findMany({ where: { userId: id }, orderBy: { criadoEm: "desc" }, take: 10, select: { id: true, titulo: true, status: true, formato: true, criadoEm: true } }),
    prisma.tema.count({ where: { userId: id } }),
    prisma.membroEquipe.findMany({ where: { userId: id } }),
    prisma.logIA.findMany({ where: { userId: id }, orderBy: { criadoEm: "desc" }, take: 10, select: { funcionalidade: true, provedor: true, sucesso: true, criadoEm: true } }),
    prisma.configIA.findMany({ where: { userId: id }, select: { provedor: true, ativo: true } }),
  ]);

  const totalConteudos = await prisma.conteudo.count({ where: { userId: id } });
  const totalPublicados = await prisma.conteudo.count({ where: { userId: id, status: "PUBLICADO" } });
  const totalIA = await prisma.logIA.count({ where: { userId: id } });

  return NextResponse.json({
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      nomeEmpresa: user.nomeEmpresa,
      instagramHandle: user.instagramHandle,
      tiktokHandle: user.tiktokHandle,
      whatsapp: user.whatsapp,
      dataNascimento: user.dataNascimento,
      perfilTipo: user.perfilTipo,
      segmento: user.segmento,
      faseDigital: user.faseDigital,
      role: user.role,
      onboardingConcluido: user.onboardingConcluido,
      criadoEm: user.criadoEm,
      atualizadoEm: user.atualizadoEm,
    },
    metrics: { totalConteudos, totalPublicados, totalIA, totalTemas: temas, totalMembros: membros.length },
    conteudosRecentes: conteudos,
    logsIARecentes: logsIA,
    configIA,
    membros,
  });
}
