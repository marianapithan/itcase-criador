import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST() {
  const [objecoes, persona] = await Promise.all([
    prisma.objecao.findMany({ orderBy: { criadoEm: "asc" } }),
    prisma.personaConfig.findUnique({ where: { id: "default" } }),
  ]);

  if (objecoes.length === 0) return NextResponse.json({ erro: "Nenhuma objeção cadastrada." }, { status: 400 });

  const pd = persona
    ? { nome: persona.nomePersona, faixa: persona.faixaEtaria, local: persona.localizacao }
    : { nome: "Ana Conquista", faixa: "25-40 anos", local: "Londrina e regiao" };

  const listaTexto = objecoes.map((o, i) =>
    `${i + 1}. id:${o.id} | "${o.texto}" | freq:${o.frequencia || "?"} | etapa:${o.etapaVenda || "?"} | contorna:${o.consegueContornar || "?"} | compra-depois:${o.clienteCompraDepois || "?"}`
  ).join("\n");

  const prompt = [
    "Especialista em vendas para loja de tecnologia Apple. Responda SOMENTE o JSON.",
    "",
    `NEGOCIO: It Case, loja Apple, Shopping Catuai, Londrina-PR. PERSONA: ${pd.nome}, ${pd.faixa}, ${pd.local}.`,
    "",
    "OBJECOES:",
    listaTexto,
    "",
    "Para cada objecao: prioridade (1=mais urgente pra resolver), raiz verdadeira em 1 frase, resposta curta pra WhatsApp em 2 linhas, prevencao no conteudo em 1 frase.",
    "",
    `[{"id":"<id>","prioridade":1,"raiz":"<raiz>","respostaCurta":"<resposta 2 linhas>","prevencao":"<1 frase de conteudo>"}]`,
  ].join("\n");

  const resultado = await chamarIA({ funcionalidade: "objecoes-analisar", sistema: contextoCerebro(), prompt, maxTokens: 900 });
  if (!resultado.sucesso) return NextResponse.json({ erro: resultado.erro }, { status: 400 });

  const texto = resultado.conteudo.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  const match = texto.match(/\[[\s\S]*\]/);
  if (!match) return NextResponse.json({ erro: `IA retornou formato inesperado: ${texto.slice(0, 200)}` }, { status: 400 });

  let analises: { id: string; prioridade: number; raiz: string; respostaCurta: string; prevencao: string }[];
  try {
    analises = JSON.parse(match[0]);
  } catch {
    return NextResponse.json({ erro: `JSON cortado: ...${match[0].slice(-80)}` }, { status: 400 });
  }

  await Promise.all(
    analises.map((a) =>
      prisma.objecao.update({
        where: { id: a.id },
        data: { prioridade: a.prioridade, raiz: a.raiz, respostaCurta: a.respostaCurta, prevencao: a.prevencao },
      }).catch(() => {})
    )
  );

  const atualizadas = await prisma.objecao.findMany({ orderBy: [{ prioridade: "asc" }, { criadoEm: "asc" }] });
  return NextResponse.json(atualizadas);
}
