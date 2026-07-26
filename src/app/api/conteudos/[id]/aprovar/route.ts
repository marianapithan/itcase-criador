import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

async function proximoDiaLivre(horaDefault = 9): Promise<Date> {
  const hoje = new Date();
  for (let i = 1; i <= 60; i++) {
    const candidato = new Date(hoje);
    candidato.setDate(hoje.getDate() + i);
    candidato.setHours(horaDefault, 0, 0, 0);
    candidato.setSeconds(0, 0);

    const inicio = new Date(candidato);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(candidato);
    fim.setHours(23, 59, 59, 999);

    const existente = await prisma.conteudo.findFirst({
      where: { dataplanejada: { gte: inicio, lte: fim } },
    });

    if (!existente) return candidato;
  }

  const fallback = new Date(hoje);
  fallback.setDate(hoje.getDate() + 61);
  fallback.setHours(horaDefault, 0, 0, 0);
  return fallback;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { adicionarCalendario } = await req.json();

  let dataplanejada: Date | undefined;
  if (adicionarCalendario) {
    dataplanejada = await proximoDiaLivre(9);
  }

  const conteudo = await prisma.conteudo.update({
    where: { id },
    data: {
      status: adicionarCalendario ? "AGENDADO" : "APROVADO",
      ...(dataplanejada ? { dataplanejada } : {}),
    },
  });

  return NextResponse.json(conteudo);
}
