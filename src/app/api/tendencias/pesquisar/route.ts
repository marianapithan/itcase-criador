import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";

type TendenciaGerada = {
  titulo: string;
  descricao: string;
  plataforma: string;
  categoria: string;
  grau: string;
  motivo?: string;
  publico?: string;
  potAlcance?: string;
  potVendas?: string;
  formato?: string;
};

const PLATAFORMAS_VALIDAS = ["INSTAGRAM", "TIKTOK", "GOOGLE", "YOUTUBE", "NOTICIAS", "GERAL"];
const CATEGORIAS_VALIDAS = ["EDUCATIVO", "COMERCIAL", "INSTITUCIONAL", "TRAFEGO_PAGO", "PRODUTO", "DICA", "NOVIDADE"];
const GRAUS_VALIDOS = ["ALTA", "MEDIA", "BAIXA"];
const FORMATOS_VALIDOS = ["REELS", "CARROSSEL", "POST_ESTATICO", "STORIES", "GRUPO_VIP"];
const POT_VALIDOS = ["ALTO", "MEDIO", "BAIXO"];

function normalizar(valor: string | undefined, lista: string[], fallback: string): string {
  if (!valor) return fallback;
  const v = valor.toUpperCase().trim();
  return lista.includes(v) ? v : fallback;
}

function parsearTendencias(texto: string): TendenciaGerada[] {
  // Remove markdown code blocks
  let limpo = texto
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Tenta extrair array JSON de qualquer posição no texto
  const match = limpo.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // tenta corrigir JSON malformado
      try {
        const fixed = match[0].replace(/,\s*\]/g, "]").replace(/,\s*\}/g, "}");
        const parsed = JSON.parse(fixed);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* continua */ }
    }
  }

  // Tenta o texto inteiro como JSON
  try {
    const parsed = JSON.parse(limpo);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.tendencias)) return parsed.tendencias;
  } catch { /* continua */ }

  return [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const nicho = body.nicho?.trim() || "";
    const dataAtual = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

    const prompt = `Você é um analista estratégico de conteúdo digital para a It Case, loja Apple em Londrina-PR.

${contextoCerebro()}
${nicho ? `\nNicho extra: ${nicho}` : ""}

Data: ${dataAtual}

Gere 12 tendências de conteúdo digital relevantes para este negócio. Analise o que está em alta no Instagram, TikTok, Google, YouTube e notícias do setor.

Retorne SOMENTE um array JSON válido, sem explicações, sem markdown, sem texto adicional.

Exemplo de um item:
{"titulo":"Comparativo iPhone 15 vs 16","descricao":"Comparativos de modelos geram alto engajamento e ajudam o cliente a tomar decisão de compra. Perfeito para stories interativos.","plataforma":"INSTAGRAM","categoria":"EDUCATIVO","grau":"ALTA","motivo":"Lançamento recente do iPhone 16 gerou busca intensa por comparativos","publico":"Adultos 25-35 anos querendo trocar de celular","potAlcance":"ALTO","potVendas":"ALTO","formato":"CARROSSEL"}

Valores permitidos:
- plataforma: INSTAGRAM, TIKTOK, GOOGLE, YOUTUBE, NOTICIAS, GERAL
- categoria: EDUCATIVO, COMERCIAL, INSTITUCIONAL, TRAFEGO_PAGO, PRODUTO, DICA, NOVIDADE
- grau: ALTA, MEDIA, BAIXA
- potAlcance: ALTO, MEDIO, BAIXO
- potVendas: ALTO, MEDIO, BAIXO
- formato: REELS, CARROSSEL, POST_ESTATICO, STORIES, GRUPO_VIP

Retorne apenas o array JSON com 12 itens:`;

    const resposta = await chamarIA({
      prompt,
      funcionalidade: "tendencias",
      maxTokens: 4000,
    });

    if (!resposta.sucesso) {
      return NextResponse.json({ erro: resposta.erro }, { status: 500 });
    }

    const lista = parsearTendencias(resposta.conteudo);

    if (lista.length === 0) {
      return NextResponse.json(
        { erro: `IA não retornou JSON válido. Resposta recebida: ${resposta.conteudo.slice(0, 300)}` },
        { status: 500 }
      );
    }

    // Salva cada item com validação individual
    const criadas = [];
    for (const t of lista) {
      try {
        if (!t.titulo || !t.descricao) continue;
        const criada = await prisma.tendencia.create({
          data: {
            titulo: String(t.titulo).slice(0, 200),
            descricao: String(t.descricao).slice(0, 1000),
            plataforma: normalizar(t.plataforma, PLATAFORMAS_VALIDAS, "GERAL"),
            categoria: normalizar(t.categoria, CATEGORIAS_VALIDAS, "EDUCATIVO"),
            grau: normalizar(t.grau, GRAUS_VALIDOS, "MEDIA"),
            motivo: t.motivo ? String(t.motivo).slice(0, 500) : null,
            publico: t.publico ? String(t.publico).slice(0, 300) : null,
            potAlcance: normalizar(t.potAlcance, POT_VALIDOS, "MEDIO"),
            potVendas: normalizar(t.potVendas, POT_VALIDOS, "MEDIO"),
            formato: normalizar(t.formato, FORMATOS_VALIDOS, "REELS"),
            status: "NOVA",
          },
        });
        criadas.push(criada);
      } catch { /* pula item inválido */ }
    }

    if (criadas.length === 0) {
      return NextResponse.json({ erro: "Nenhuma tendência pôde ser salva." }, { status: 500 });
    }

    return NextResponse.json({ criadas: criadas.length, tendencias: criadas });
  } catch (err) {
    return NextResponse.json({ erro: String(err) }, { status: 500 });
  }
}
