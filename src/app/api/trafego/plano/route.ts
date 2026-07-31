import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA, contextoCerebro } from "@/lib/ai/gateway";
import { requireAuth } from "@/lib/auth-session";

export const maxDuration = 60;
export const runtime = "nodejs";

const PLATAFORMA_LABEL: Record<string, string> = {
  meta: "Meta Ads (Facebook & Instagram)",
  google: "Google Ads",
  youtube: "YouTube Ads",
  tiktok: "TikTok Ads",
  linkedin: "LinkedIn Ads",
};

function gerarPassos(
  plataforma: string,
  objetivo: string,
  d: { verbaDia: number; investimento: number; dias: number; nomenclatura: { campanha: string; conjunto: string; anuncio: string }; interesses: string[] }
): string[] {
  const { verbaDia, nomenclatura } = d;
  const ints = d.interesses.slice(0, 3).join(", ") || "interesses gerados acima";

  if (plataforma === "meta") {
    const objLabel = { whatsapp: "Mensagens", leads: "Geração de cadastros", trafego: "Tráfego", reconhecimento: "Reconhecimento de marca", engajamento: "Engajamento", vendas: "Vendas" }[objetivo] ?? "Mensagens";
    return [
      `Acesse business.facebook.com → clique em "Gerenciador de Anúncios" no menu lateral.`,
      `Clique no botão verde "Criar" no canto superior esquerdo.`,
      `Objetivo: selecione "${objLabel}"${objetivo === "whatsapp" ? " → em Aplicativo de mensagens escolha WhatsApp" : ""} → Continuar.`,
      `Nome da campanha: "${nomenclatura.campanha}" · deixe orçamento no nível do conjunto (ABO).`,
      `Conjunto: "${nomenclatura.conjunto}" · orçamento diário R$${verbaDia} · data de início: hoje · sem data de término.`,
      `Público: Londrina, PR + 15 km de raio · faixa 25–45 anos · todos os gêneros. Interesses: ${ints}.`,
      `Posicionamentos → "Editar" → deixe APENAS Feed Instagram, Reels Instagram e Feed Facebook.`,
      `${objetivo === "whatsapp" ? "Conecte a Página do Facebook e o número do WhatsApp Business." : "Configure o URL de destino do anúncio."}`,
      `Anúncio "${nomenclatura.anuncio}": faça upload do vídeo/imagem, cole a copy nos campos (texto primário, headline, descrição).`,
      `Clique em "Publicar" — nasce PAUSADO. Revise tudo e ative manualmente quando estiver pronto.`,
    ];
  }

  if (plataforma === "google") {
    return [
      `Acesse ads.google.com → clique em "+ Nova campanha".`,
      `Objetivo: "${objetivo === "pesquisa" ? "Vendas ou tráfego do site" : "Leads"}" → Tipo: Rede de Pesquisa.`,
      `Nome: "${nomenclatura.campanha}" · orçamento diário R$${verbaDia} · lances: CPC manual.`,
      `Localização: Brasil → Londrina, PR + 15 km · idioma: Português.`,
      `Grupo de anúncios "${nomenclatura.conjunto}": adicione as palavras-chave sugeridas.`,
      `Crie o anúncio responsivo: cole a copy selecionada nos campos de títulos (até 15) e descrições (até 4).`,
      `URL final: site ou link do WhatsApp (wa.me/SEU_NUMERO).`,
      `Extensões: adicione sitelinks e extensão de chamada se possível.`,
      `Revise e publique. Google leva até 24h para aprovação.`,
    ];
  }

  if (plataforma === "youtube") {
    return [
      `Acesse ads.google.com (YouTube usa a plataforma do Google Ads).`,
      `+ Nova campanha → objetivo "Reconhecimento e alcance" → tipo "Vídeo".`,
      `Nome: "${nomenclatura.campanha}" · estratégia: CPV máximo · orçamento diário R$${verbaDia}.`,
      `Localização: Londrina, PR · idioma: Português.`,
      `Publique o vídeo no YouTube como "Não listado" e copie a URL.`,
      `Grupo de anúncios "${nomenclatura.conjunto}": cole a URL do vídeo.`,
      `Formato: In-stream pulável (aparece antes dos vídeos, pode ser pulado em 5s).`,
      `Configure a URL final e o CTA. Nome do anúncio: "${nomenclatura.anuncio}".`,
      `Adicione banner companion (imagem 300x60 lateral ao vídeo).`,
      `Publique. YouTube leva até 1 dia útil para revisão.`,
    ];
  }

  if (plataforma === "tiktok") {
    return [
      `Acesse ads.tiktok.com → clique em "+ Criar".`,
      `Objetivo: "${objetivo === "spark" ? "Engajamento" : "Tráfego"}" → modo Simplificado.`,
      `Nome: "${nomenclatura.campanha}" · orçamento diário R$${verbaDia}.`,
      `Grupo de anúncios "${nomenclatura.conjunto}": localização Brasil · faixa 18–44 anos.`,
      `Interesses sugeridos: ${ints}.`,
      `Vídeo: formato vertical 9:16, duração 15–30s, arquivo MP4.`,
      `Texto do anúncio: cole a copy (ate 100c) · configure CTA (ex.: "Saiba mais").`,
      `URL de destino: site ou link do WhatsApp.`,
      `Revise e publique. TikTok leva até 24h para aprovação.`,
    ];
  }

  if (plataforma === "linkedin") {
    return [
      `Acesse linkedin.com/campaignmanager → "Criar campanha".`,
      `Objetivo: "${objetivo === "mensagem" ? "Conscientização" : objetivo === "lead-form" ? "Geração de leads" : "Visitas ao site"}".`,
      `Nome: "${nomenclatura.campanha}" · orçamento diário R$${verbaDia}.`,
      `Público: localização Brasil (Londrina) · segmentos de cargo/setor relevantes.`,
      `Formato: "${objetivo === "mensagem" ? "Message Ads" : objetivo === "lead-form" ? "Lead Gen Forms" : "Conteúdo patrocinado"}".`,
      `Anúncio "${nomenclatura.anuncio}": cole a copy e configure o CTA.`,
      `${objetivo === "lead-form" ? "Configure o formulário de lead com campos essenciais." : "Configure a URL de destino."}`,
      `Revise e publique. LinkedIn leva até 24h para revisão.`,
    ];
  }

  return [`Acesse a plataforma de anúncios, crie a campanha com as configurações geradas e siga as instruções da plataforma.`];
}

function gerarChecklist(plataforma: string, objetivo: string): { id: string; label: string; categoria: string }[] {
  const itens = [
    { id: "criativo", label: "Criativo (vídeo ou imagem) finalizado e inserido", categoria: "Conteudo" },
    { id: "copy", label: "Copy colada nos campos: texto primário, headline, descrição", categoria: "Conteudo" },
    { id: "publico", label: "Público configurado: localização + interesses sugeridos", categoria: "Segmentação" },
    { id: "orcamento", label: "Orçamento diário definido no nível do conjunto", categoria: "Orçamento" },
    { id: "data-inicio", label: "Data de início configurada para hoje (ou data planejada)", categoria: "Calendário" },
    { id: "cta", label: "CTA e URL de destino configurados e testados", categoria: "Conversão" },
    { id: "nomenclatura", label: "Nomenclatura aplicada: campanha, conjunto e anúncio nomeados", categoria: "Organização" },
    { id: "revisao", label: "Revisão completa na tela de resumo antes de publicar", categoria: "Publicação" },
  ];

  if (plataforma === "meta") {
    itens.push({ id: "pagina", label: "Página do Facebook conectada à conta de anúncios", categoria: "Configuração" });
    if (objetivo === "whatsapp") itens.push({ id: "whatsapp", label: "WhatsApp Business vinculado à conta do Meta", categoria: "Configuração" });
    itens.push({ id: "posicionamentos", label: "Posicionamentos revisados: feed, reels (outros desativados)", categoria: "Posicionamento" });
  }

  if (plataforma === "google" || plataforma === "youtube") {
    itens.push({ id: "palavras-chave", label: "Palavras-chave adicionadas ao grupo de anúncios", categoria: "Segmentação" });
    itens.push({ id: "extensoes", label: "Extensões de anúncio configuradas (sitelinks, chamadas)", categoria: "Configuração" });
  }

  if (plataforma === "youtube") {
    itens.push({ id: "video-youtube", label: "Vídeo publicado no YouTube como Nao listado", categoria: "Conteudo" });
  }

  if (plataforma === "tiktok") {
    itens.push({ id: "video-vertical", label: "Vídeo em formato vertical 9:16 (15-30s)", categoria: "Conteudo" });
  }

  return itens;
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const { conteudoId, investimento, ticket, dias: diasRaw, plataforma, objetivo, copiaTexto, copiaAngulo } = await req.json();
  const dias = Math.max(1, Number(diasRaw) || 30);

  const [conteudo, persona] = await Promise.all([
    prisma.conteudo.findFirst({ where: { id: conteudoId, userId }, include: { tema: { select: { titulo: true } } } }),
    prisma.personaConfig.findUnique({ where: { id: userId } }),
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
    : { nome: "Ana Conquista", faixa: "25-40 anos", local: "Londrina e regiao", desejos: "status, produtividade, pertencimento", medos: "ser enganada, pagar caro pelo errado" };

  const valorConversa = ticket * 0.2;
  const empate = Math.round(valorConversa);
  const escala = Math.round(valorConversa * 0.7);
  const alerta = Math.round(valorConversa * 1.35);
  const verbaDia = Math.round(investimento / dias);
  const mesAno = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  // Compact prompt — keep input tokens low so output has room within maxTokens
  const nomePersona = pd.nome;
  const desejos = pd.desejos.slice(0, 60);
  const medos = pd.medos.slice(0, 60);
  const copiaResumida = (copiaTexto ?? "").slice(0, 100);
  const platLabel = PLATAFORMA_LABEL[plataforma] || plataforma;

  const prompt = [
    "Gestor de trafego. Responda SOMENTE o JSON abaixo, sem texto fora.",
    "",
    `CONTEUDO: "${conteudo.titulo}" | ${conteudo.formato}`,
    `PERSONA: ${nomePersona}, ${pd.faixa}, ${pd.local}. Desejos: ${desejos}. Medos: ${medos}.`,
    `COPY: ${copiaResumida}`,
    `PLATAFORMA: ${platLabel} | OBJETIVO: ${objetivo}`,
    `VERBA: R$${verbaDia}/dia . ${dias} dias . ticket R$${ticket}`,
    "",
    `{"personaRapida":"<1 frase por que esta copy funciona para ${nomePersona}>","publicoAlvo":{"segmentacao":"<local+idade+genero>","interesses":["<int1>","<int2>","<int3>"],"exclusoes":"<quem excluir>"},"nomenclatura":{"campanha":"<PRODUTO-OBJ-LOCAL-${mesAno}>","conjunto":"<PRODUTO-OBJ-PUB25A45-${mesAno}>","anuncio":"<PRODUTO-OBJ-PUB25A45-VID01>"},"saudeIA":"<1 frase diagnostico R$${verbaDia}/dia por ${dias} dias>"}`,
  ].join("\n");

  const resultado = await chamarIA({ funcionalidade: "trafego-plano", sistema: await contextoCerebro(userId), prompt, maxTokens: 800 });
  if (!resultado.sucesso) return NextResponse.json({ erro: resultado.erro }, { status: 400 });

  const texto = resultado.conteudo.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ erro: `IA retornou: ${texto.slice(0, 200)}` }, { status: 400 });

  let dados: Record<string, unknown>;
  try {
    dados = JSON.parse(match[0]);
  } catch {
    return NextResponse.json({ erro: `JSON cortado: ...${match[0].slice(-80)}` }, { status: 400 });
  }

  const interesses = ((dados.publicoAlvo as { interesses?: string[] })?.interesses) ?? [];
  const nomenclatura = (dados.nomenclatura as { campanha: string; conjunto: string; anuncio: string }) ??
    { campanha: `ITCASE-MSG-LOCAL-${mesAno}`, conjunto: `ITCASE-MSG-PUB25A45-${mesAno}`, anuncio: `ITCASE-MSG-PUB25A45-VID01` };

  const resposta = {
    personaRapida: dados.personaRapida,
    publicoAlvo: dados.publicoAlvo,
    nomenclatura,
    saudeIA: dados.saudeIA,
    cpas: { empate, escala, alerta, verbaDia, investimento, ticket, dias },
    passoAPasso: gerarPassos(plataforma, objetivo, { verbaDia, investimento, dias, nomenclatura, interesses }),
    checklist: gerarChecklist(plataforma, objetivo),
    copy: { texto: copiaTexto, angulo: copiaAngulo },
    plataforma,
    objetivo,
  };

  try {
    await prisma.conteudo.update({
      where: { id: conteudoId },
      data: {
        trafegoAtivo: true,
        trafegoStatus: "GERADO",
        trafegoObjetivo: `${platLabel} . R$${investimento} . ${dias} dias`,
        trafegoObs: JSON.stringify({ v: 2, geradoEm: new Date().toISOString(), ...resposta }),
      },
    });
  } catch { /* non-fatal */ }

  return NextResponse.json(resposta);
}
