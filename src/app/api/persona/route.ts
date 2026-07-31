import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { chamarIA } from "@/lib/ai/gateway";
import { CONFIG } from "@/lib/config";
import { requireAuth } from "@/lib/auth-session";

const DEFAULTS = {
  nomePersona: "Ana Conquista",
  faixaEtaria: "25 a 40 anos",
  localizacao: "Londrina e região",
  perfilCompra: "Consultivo, não impulsivo",
  desejos: [
    { emoji: "✨", titulo: "Status e reconhecimento", desc: "O iPhone não é só um celular — é um símbolo de conquista pessoal. Ela quer sentir que chegou lá." },
    { emoji: "⚡", titulo: "Produtividade real", desc: "Usa o ecossistema Apple para trabalhar, estudar e se organizar. Valoriza quem entende isso." },
    { emoji: "🤝", titulo: "Pertencimento", desc: "Quer fazer parte de um grupo que compartilha valores: qualidade, cuidado e bom gosto." },
    { emoji: "🛡️", titulo: "Segurança na compra", desc: "Quer saber que não vai se arrepender. Garantia, procedência e suporte pós-venda são decisivos." },
  ],
  medos: [
    { emoji: "😰", titulo: "Ser enganada", desc: "Medo de comprar um produto adulterado, clonado ou com procedência duvidosa." },
    { emoji: "😤", titulo: "Falta de suporte", desc: "Comprar e ficar na mão depois. Ela quer saber que pode voltar se tiver problema." },
    { emoji: "💸", titulo: "Pagar caro pelo errado", desc: "Investir em algo que não atende ao que ela realmente precisa." },
  ],
  palavrasMarca: ["Confiança", "Acolhimento", "Proximidade"],
  palavrasProibidas: [
    { proibido: "capinha", correto: "capa de celular" },
    { proibido: "posso ajudar?", correto: "direcionar com confiança" },
    { proibido: "preço imbatível", correto: "o melhor custo-benefício pra você" },
    { proibido: "aproveite agora!", correto: "convidar sem pressionar" },
  ],
  diferenciais: [
    { icon: "🛡️", titulo: "Película com garantia de tela de 6 meses", desc: "Única na região." },
    { icon: "📱", titulo: "iPhones seminovos nunca abertos", desc: "Originais, com peças Apple, garantia de 6 meses." },
    { icon: "🏪", titulo: "Loja física no Shopping Catuaí", desc: "Presença física = credibilidade." },
    { icon: "🤝", titulo: "Atendimento consultivo", desc: "Não empurra produto — encontra a solução certa." },
  ],
  comoComunicar: [
    "Dirija em vez de perguntar (\"Você precisa de...\" em vez de \"Posso te ajudar?\")",
    "Convide em vez de pressionar (\"Vem conhecer\" em vez de \"Corre que acaba!\")",
    "Humanize — ela compra de pessoas que confiam, não de lojas",
  ],
};

export async function GET(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const persona = await prisma.personaConfig.findUnique({ where: { id: userId } });
  if (!persona) return NextResponse.json({ ...DEFAULTS, sugestoesIA: null, atualizadoEm: null });

  return NextResponse.json({
    nomePersona: persona.nomePersona,
    faixaEtaria: persona.faixaEtaria,
    localizacao: persona.localizacao,
    perfilCompra: persona.perfilCompra,
    desejos: JSON.parse(persona.desejos),
    medos: JSON.parse(persona.medos),
    palavrasMarca: JSON.parse(persona.palavrasMarca),
    palavrasProibidas: JSON.parse(persona.palavrasProibidas),
    diferenciais: JSON.parse(persona.diferenciais),
    comoComunicar: JSON.parse(persona.comoComunicar),
    sugestoesIA: persona.sugestoesIA,
    atualizadoEm: persona.atualizadoEm,
  });
}

export async function POST(req: NextRequest) {
  const sessao = await requireAuth(req);
  if (!sessao) return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  const { userId } = sessao;

  const body = await req.json();
  const {
    nomePersona, faixaEtaria, localizacao, perfilCompra,
    desejos, medos, palavrasMarca, palavrasProibidas, diferenciais, comoComunicar,
  } = body;

  // Gera sugestões via IA baseadas na nova persona
  const prompt = `Você é um estrategista de conteúdo digital especialista em lojas Apple e varejo.

Com base na persona atualizada da ${CONFIG.nome}:

Nome da persona: ${nomePersona}
Faixa etária: ${faixaEtaria}
Localização: ${localizacao}
Perfil de compra: ${perfilCompra}
Desejos: ${desejos.map((d: { titulo: string }) => d.titulo).join(", ")}
Medos: ${medos.map((m: { titulo: string }) => m.titulo).join(", ")}
Tom de voz (3 palavras): ${palavrasMarca.join(", ")}
Diferenciais: ${diferenciais.map((d: { titulo: string }) => d.titulo).join(", ")}

Gere 4 sugestões estratégicas de EXPANSÃO ou MELHORIA da persona, cada uma com:
- titulo: nome da oportunidade (máx 60 chars)
- desc: explicação prática de por que vale explorar (máx 150 chars)
- tag: benefício em 2-4 palavras
- tagCor: uma das opções (bg-green-100 text-green-700 | bg-blue-100 text-blue-700 | bg-orange-100 text-orange-700 | bg-purple-100 text-purple-700)

Retorne SOMENTE um JSON array válido com 4 objetos: [{"titulo":"...","desc":"...","tag":"...","tagCor":"..."}]`;

  const resp = await chamarIA({ prompt, funcionalidade: "persona_sugestoes", maxTokens: 800 });
  let sugestoesIA: string | null = null;
  if (resp.sucesso) {
    const clean = resp.conteudo.replace(/```json\n?/gi, "").replace(/```\n?/g, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (match) sugestoesIA = match[0];
  }

  const persona = await prisma.personaConfig.upsert({
    where: { id: userId },
    update: {
      nomePersona, faixaEtaria, localizacao, perfilCompra,
      desejos: JSON.stringify(desejos),
      medos: JSON.stringify(medos),
      palavrasMarca: JSON.stringify(palavrasMarca),
      palavrasProibidas: JSON.stringify(palavrasProibidas),
      diferenciais: JSON.stringify(diferenciais),
      comoComunicar: JSON.stringify(comoComunicar),
      sugestoesIA,
    },
    create: {
      id: userId,
      nomePersona, faixaEtaria, localizacao, perfilCompra,
      desejos: JSON.stringify(desejos),
      medos: JSON.stringify(medos),
      palavrasMarca: JSON.stringify(palavrasMarca),
      palavrasProibidas: JSON.stringify(palavrasProibidas),
      diferenciais: JSON.stringify(diferenciais),
      comoComunicar: JSON.stringify(comoComunicar),
      sugestoesIA,
    },
  });

  return NextResponse.json({
    nomePersona: persona.nomePersona,
    faixaEtaria: persona.faixaEtaria,
    localizacao: persona.localizacao,
    perfilCompra: persona.perfilCompra,
    desejos: JSON.parse(persona.desejos),
    medos: JSON.parse(persona.medos),
    palavrasMarca: JSON.parse(persona.palavrasMarca),
    palavrasProibidas: JSON.parse(persona.palavrasProibidas),
    diferenciais: JSON.parse(persona.diferenciais),
    comoComunicar: JSON.parse(persona.comoComunicar),
    sugestoesIA: persona.sugestoesIA,
    atualizadoEm: persona.atualizadoEm,
  });
}
