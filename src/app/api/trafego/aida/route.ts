import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { conteudoId } = await req.json();

  const [conteudo, persona] = await Promise.all([
    prisma.conteudo.findUnique({ where: { id: conteudoId }, include: { tema: { select: { titulo: true } } } }),
    prisma.personaConfig.findUnique({ where: { id: "default" } }),
  ]);
  if (!conteudo) return NextResponse.json({ erro: "Conteúdo não encontrado" }, { status: 404 });

  const pd = persona
    ? {
        nome: persona.nomePersona,
        faixa: persona.faixaEtaria,
        local: persona.localizacao,
        desejos: (JSON.parse(persona.desejos) as { titulo: string }[]).map((d) => d.titulo).join(", "),
        medos: (JSON.parse(persona.medos) as { titulo: string }[]).map((m) => m.titulo).join(", "),
      }
    : { nome: "Ana Conquista", faixa: "25-40 anos", local: "Londrina e região", desejos: "status, produtividade, pertencimento", medos: "ser enganada, pagar caro pelo errado" };

  const prompt = `Copywriter especialista em Meta Ads. Responda SOMENTE o JSON abaixo.

CONTEÚDO: "${conteudo.titulo}" | formato: ${conteudo.formato}
PERSONA: ${pd.nome}, ${pd.faixa}, ${pd.local}. Desejos: ${pd.desejos}. Medos: ${pd.medos}.
NEGÓCIO: It Case, loja Apple, Catuaí Londrina. Tom: confiança, acolhimento. Nunca: "capinha", "aproveite agora".

Gere 3 copies AIDA. Cada campo ≤100c, textoCompleto ≤280c:

{"copies":[
{"numero":1,"angulo":"Direta e comercial","atencao":"<gancho direto ≤80c>","interesse":"<amplifica interesse ≤100c>","desejo":"<prova/benefício ≤100c>","acao":"<CTA claro ≤60c>","textoCompleto":"<copy completa ≤280c>"},
{"numero":2,"angulo":"Emocional, foco na dor","atencao":"<gancho emocional ≤80c>","interesse":"<amplifica dor ≤100c>","desejo":"<solução desejada ≤100c>","acao":"<CTA ≤60c>","textoCompleto":"<copy completa ≤280c>"},
{"numero":3,"angulo":"Educativa, foco em benefícios","atencao":"<gancho educativo ≤80c>","interesse":"<gera curiosidade ≤100c>","desejo":"<benefício concreto ≤100c>","acao":"<CTA ≤60c>","textoCompleto":"<copy completa ≤280c>"}
]}`;

  const resultado = await chamarIA({ funcionalidade: "trafego-aida", sistema: contextoCerebro(), prompt, maxTokens: 900 });
  if (!resultado.sucesso) return NextResponse.json({ erro: resultado.erro }, { status: 400 });

  const texto = resultado.conteudo.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ erro: `IA retornou: ${texto.slice(0, 200)}` }, { status: 400 });

  try {
    return NextResponse.json(JSON.parse(match[0]));
  } catch {
    return NextResponse.json({ erro: `JSON cortado em ${match[0].length}c: ...${match[0].slice(-80)}` }, { status: 400 });
  }
}
