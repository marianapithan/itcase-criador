import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { verificarSessao, COOKIE } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;
  if (!sessao || sessao.role !== "admin") {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
  }

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [
    totalConteudos,
    totalPublicados,
    totalGeradosIA,
    totalTemas,
    totalMicrotemas,
    totalObjecoes,
    totalTendencias,
    totalRoteirosComTexto,
    totalLogsIA,
    configIA,
    framework,
    recentesIA,
    totalUsuarios,
    novosEsseMes,
    onboardingConcluido,
  ] = await Promise.all([
    prisma.conteudo.count(),
    prisma.conteudo.count({ where: { status: "PUBLICADO" } }),
    prisma.conteudo.count({ where: { status: "GERADO_IA" } }),
    prisma.tema.count(),
    prisma.microtema.count(),
    prisma.objecao.count(),
    prisma.tendencia.count(),
    prisma.conteudo.count({ where: { roteiro: { not: null } } }),
    prisma.logIA.count(),
    prisma.configIA.findMany({ where: { ativo: true }, orderBy: { prioridade: "asc" } }),
    prisma.configFramework.findUnique({ where: { id: "default" } }),
    prisma.logIA.findMany({ take: 5, orderBy: { criadoEm: "desc" } }),
    prisma.user.count(),
    prisma.user.count({ where: { criadoEm: { gte: inicioMes } } }),
    prisma.user.count({ where: { onboardingConcluido: true } }),
  ]);

  return NextResponse.json({
    conteudos: { total: totalConteudos, publicados: totalPublicados, geradosIA: totalGeradosIA, comRoteiro: totalRoteirosComTexto },
    temas: { total: totalTemas, microtemas: totalMicrotemas },
    objecoes: totalObjecoes,
    tendencias: totalTendencias,
    ia: { totalLogs: totalLogsIA, provedoresAtivos: configIA.map((c) => c.provedor), frameworkAtivo: framework?.ativo ?? "AIDA" },
    recenteIA: recentesIA,
    usuarios: { total: totalUsuarios, novosEsseMes, onboardingConcluido },
  });
}
