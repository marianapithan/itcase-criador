import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { verificarSessao, COOKIE } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;
  if (!sessao || sessao.role !== "admin") {
    return NextResponse.json({ erro: "Acesso negado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({ orderBy: { criadoEm: "desc" } });
  const userIds = users.map((u) => u.id);

  const [contConteudos, contPublicados, contIA, ultimaIA] = await Promise.all([
    prisma.conteudo.groupBy({ by: ["userId"], where: { userId: { in: userIds } }, _count: { id: true } }),
    prisma.conteudo.groupBy({ by: ["userId"], where: { userId: { in: userIds }, status: "PUBLICADO" }, _count: { id: true } }),
    prisma.logIA.groupBy({ by: ["userId"], where: { userId: { in: userIds } }, _count: { id: true } }),
    prisma.logIA.groupBy({ by: ["userId"], where: { userId: { in: userIds } }, _max: { criadoEm: true } }),
  ]);

  const conteudosMap: Record<string, number> = Object.fromEntries(contConteudos.map((r) => [r.userId, r._count.id]));
  const publicadosMap: Record<string, number> = Object.fromEntries(contPublicados.map((r) => [r.userId, r._count.id]));
  const iaMap: Record<string, number> = Object.fromEntries(contIA.map((r) => [r.userId, r._count.id]));
  const atividadeMap: Record<string, Date | null> = Object.fromEntries(ultimaIA.map((r) => [r.userId, r._max.criadoEm]));

  const result = users.map((u) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    nomeEmpresa: u.nomeEmpresa,
    instagramHandle: u.instagramHandle,
    tiktokHandle: u.tiktokHandle,
    whatsapp: u.whatsapp,
    perfilTipo: u.perfilTipo,
    segmento: u.segmento,
    faseDigital: u.faseDigital,
    role: u.role,
    onboardingConcluido: u.onboardingConcluido,
    criadoEm: u.criadoEm,
    conteudos: conteudosMap[u.id] ?? 0,
    publicados: publicadosMap[u.id] ?? 0,
    iaLogs: iaMap[u.id] ?? 0,
    ultimaAtividade: atividadeMap[u.id] ?? null,
  }));

  return NextResponse.json(result);
}
