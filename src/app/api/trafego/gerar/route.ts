import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";

export const maxDuration = 60;
export const runtime = "nodejs";

// Standard FB Ads steps — same every time, no need to burn AI tokens
const PASSO_A_PASSO = [
  "Abra business.facebook.com e clique em 'Gerenciador de Anúncios' no menu lateral.",
  "Clique no botão verde 'Criar' no canto superior esquerdo.",
  "Selecione o objetivo 'Mensagens' → em 'Aplicativo de mensagens' escolha WhatsApp → clique em Continuar.",
  "Nomeie a campanha com o código gerado (ex.: IPHONE-MSG-LOCAL15KM-202607) e deixe o orçamento em nível de conjunto (ABO).",
  "No conjunto de anúncios: defina orçamento diário (o valor calculado acima), data de início hoje e SEM data de término.",
  "Em Público: localização → Londrina, PR + 15 km de raio · faixa etária 25-45 · todos os gêneros. Adicione os interesses listados acima.",
  "Em Posicionamentos, clique em 'Editar posicionamentos' e deixe APENAS: Feed Instagram, Reels Instagram e Feed Facebook.",
  "Na seção Anúncio: conecte sua Página do Facebook e o número do WhatsApp Business.",
  "Faça upload do vídeo/imagem, cole os textos campo a campo (primário, headline, descrição) seguindo a nomenclatura gerada.",
  "Revise tudo na tela de resumo → clique em 'Publicar'. O anúncio nasce PAUSADO — ative manualmente quando estiver pronto.",
];

// Filming guide template by format — generated once, not by AI
function gerarBriefing(formato: string, titulo: string, gancho: string): string {
  const isReel = /reel|reels/i.test(formato);
  const isStory = /stor/i.test(formato);
  const isCarrossel = /carrossel|carousel/i.test(formato);

  if (isReel || isStory) {
    return `FORMATO: Vertical 9:16 · duração ideal 15-30s\n` +
      `CENA: Aparece na frente da câmera com o produto em mãos, fundo limpo (balcão da loja ou parede branca).\n` +
      `GANCHO (0-3s, fale em voz alta): "${gancho}"\n` +
      `TEXTO NA TELA: 0s → título curto do tema | 3s → frase de prova ou benefício | 10s → CTA "Chama no WhatsApp"\n` +
      `FIGURINO: uniforme da It Case ou roupa neutra escura. Produto Apple visível na mão ou na mesa.`;
  }
  if (isCarrossel) {
    return `FORMATO: Carrossel feed · 3-5 slides · proporção 1:1\n` +
      `SLIDE 1 (gancho): "${gancho}" — texto grande, fundo escuro.\n` +
      `SLIDES 2-4: um benefício ou diferencial por slide, com ícone simples.\n` +
      `SLIDE FINAL: CTA "Chama no WhatsApp" + logo da It Case.\n` +
      `FIGURINO/ESTILO: paleta da marca. Produto Apple em destaque no slide 1.`;
  }
  return `FORMATO: Imagem ou vídeo feed · proporção 1:1 ou 4:5\n` +
    `CENA: Produto em destaque, fundo limpo. "${gancho}" como texto principal sobreposto.\n` +
    `TEXTO NA TELA: gancho no topo, benefício no meio, CTA "Chama no WhatsApp" na base.\n` +
    `FIGURINO/OBJETO: produto Apple limpo, bem iluminado, mão segurando (humaniza o produto).`;
}

export async function POST(req: NextRequest) {
  const { conteudoId, investimento, ticket, dias: diasRaw } = await req.json();
  const dias = Math.max(1, Number(diasRaw) || 30);

  const [conteudo, persona] = await Promise.all([
    prisma.conteudo.findUnique({
      where: { id: conteudoId },
      include: { tema: { select: { titulo: true } } },
    }),
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
    : {
        nome: "Ana Conquista",
        faixa: "25-40 anos",
        local: "Londrina e região",
        desejos: "status, produtividade, pertencimento, segurança na compra",
        medos: "ser enganada, falta de suporte, pagar caro pelo errado",
      };

  const valorConversa = ticket * 0.2;
  const empate = Math.round(valorConversa);
  const escala = Math.round(valorConversa * 0.7);
  const alerta = Math.round(valorConversa * 1.35);
  const verbaDia = Math.round(investimento / dias);

  const mesAno = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  // Compact prompt — only what AI needs to personalise; briefing & passoAPasso are hardcoded
  const prompt = `Você é gestor de tráfego Meta Ads. Responda SOMENTE com o JSON abaixo, sem nenhum texto fora.

CONTEÚDO: "${conteudo.titulo}" | formato: ${conteudo.formato}
PERSONA: ${pd.nome}, ${pd.faixa}, ${pd.local}. Desejos: ${pd.desejos}. Medos: ${pd.medos}.
NEGÓCIO: It Case, loja Apple em shopping, Londrina-PR. Tom: confiança, acolhimento. Nunca usar: "capinha", "aproveite agora", "compre agora". Canal: WhatsApp.
VERBA: R$${verbaDia}/dia (${dias} dias). Ticket R$${ticket}. CPAs: escala R$${escala} · empate R$${empate} · alerta R$${alerta}.

{
  "personaRapida": "<2 frases por que este conteúdo para o scroll da ${pd.nome}>",
  "publicoAlvo": {
    "segmentacao": "<localização, idade, gênero>",
    "interesses": ["<int1>", "<int2>", "<int3>"],
    "exclusoes": "<quem excluir>"
  },
  "ganchoVID01": "<frase de gancho ≤80c, ângulo dor>",
  "ganchoVID02": "<frase de gancho ≤80c, ângulo prova/resultado>",
  "ganchoVID03": "<frase de gancho ≤80c, ângulo desejo/status>",
  "copies": [
    {"codigo":"VID01","angulo":"<nome do ângulo>","curto":"<≤100c>","expandido":"<≤200c com CTA emoji>","headline":"<≤40c>","descricao":"<1 linha>"},
    {"codigo":"VID02","angulo":"<nome do ângulo>","curto":"<≤100c>","expandido":"<≤200c com CTA emoji>","headline":"<≤40c>","descricao":"<1 linha>"},
    {"codigo":"VID03","angulo":"<nome do ângulo>","curto":"<≤100c>","expandido":"<≤200c com CTA emoji>","headline":"<≤40c>","descricao":"<1 linha>"}
  ],
  "nomenclatura": {
    "campanha": "<PRODUTO-MSG-LOCAL15KM-${mesAno}>",
    "conjunto": "<PRODUTO-MSG-INTERESSE25A45-${mesAno}>",
    "prefixoAnuncio": "<PRODUTO-MSG-INTERESSE25A45>"
  },
  "saudeIA": "<2 frases: diagnóstico de R$${verbaDia}/dia por ${dias} dias e recomendação>"
}`;

  const resultado = await chamarIA({
    funcionalidade: "trafego-gerar-campanha",
    sistema: contextoCerebro(),
    prompt,
    maxTokens: 1200,
  });

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 });
  }

  const texto = resultado.conteudo.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ erro: `Resposta inválida da IA. Raw: ${texto.slice(0, 200)}` }, { status: 400 });
  }

  let campanha: Record<string, unknown>;
  try {
    campanha = JSON.parse(match[0]);
  } catch (e) {
    return NextResponse.json({
      erro: `Erro ao processar resposta. JSON truncado em ${match[0].length} chars. Raw: ${match[0].slice(-100)}`,
    }, { status: 400 });
  }

  // Inject server-generated fields — AI doesn't spend tokens on these
  const gancho1 = (campanha.ganchoVID01 as string) || "";
  const gancho2 = (campanha.ganchoVID02 as string) || "";
  const gancho3 = (campanha.ganchoVID03 as string) || "";

  campanha.briefings = {
    VID01: gerarBriefing(conteudo.formato, conteudo.titulo, gancho1),
    VID02: gerarBriefing(conteudo.formato, conteudo.titulo, gancho2),
    VID03: gerarBriefing(conteudo.formato, conteudo.titulo, gancho3),
  };
  campanha.passoAPasso = PASSO_A_PASSO;
  campanha.cpas = { empate, escala, alerta, verbaDia, investimento, ticket, dias };

  try {
    await prisma.conteudo.update({
      where: { id: conteudoId },
      data: {
        trafegoAtivo: true,
        trafegoStatus: "GERADO",
        trafegoObjetivo: `R$${investimento} · ${dias} dias · ticket R$${ticket}`,
        trafegoObs: JSON.stringify({ investimento, ticket, dias, geradoEm: new Date().toISOString(), ...campanha }),
      },
    });
  } catch {
    // non-fatal
  }

  return NextResponse.json(campanha);
}
