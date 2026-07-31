import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { prisma } from "@/lib/db/client";

export type Provedor = "anthropic" | "gemini" | "openai";

export interface RespostaIA {
  sucesso: boolean;
  conteudo: string;
  provedor: Provedor;
  modelo: string;
  tokensEntrada?: number;
  tokensSaida?: number;
  latenciaMs: number;
  tentativas: number;
  requestId: string;
  erro?: string;
}

interface OpcoesChamada {
  prompt: string;
  sistema?: string;
  funcionalidade: string;
  maxTokens?: number;
}

function getModelo(provedor: Provedor, modeloPrincipal?: string | null) {
  switch (provedor) {
    case "anthropic":
      return modeloPrincipal || "claude-sonnet-4-6";
    case "gemini":
      return modeloPrincipal || "gemini-2.0-flash";
    case "openai":
      return modeloPrincipal || "gpt-4o-mini";
  }
}

async function chamarProvedor(
  provedor: Provedor,
  modelo: string,
  opcoes: OpcoesChamada
): Promise<{ conteudo: string; tokensEntrada?: number; tokensSaida?: number }> {
  const chaves = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
  };

  const chave = chaves[provedor];
  if (!chave) throw new Error(`Chave da ${provedor} não configurada`);

  let modelInstance;
  switch (provedor) {
    case "anthropic": {
      const client = createAnthropic({ apiKey: chave });
      modelInstance = client(modelo);
      break;
    }
    case "gemini": {
      const client = createGoogleGenerativeAI({ apiKey: chave });
      modelInstance = client(modelo);
      break;
    }
    case "openai": {
      const client = createOpenAI({ apiKey: chave });
      modelInstance = client(modelo);
      break;
    }
  }

  const resultado = await generateText({
    model: modelInstance,
    system: opcoes.sistema,
    prompt: opcoes.prompt,
    maxOutputTokens: opcoes.maxTokens ?? 2000,
  });

  return {
    conteudo: resultado.text,
    tokensEntrada: resultado.usage?.inputTokens,
    tokensSaida: resultado.usage?.outputTokens,
  };
}

export async function chamarIA(opcoes: OpcoesChamada): Promise<RespostaIA> {
  const requestId = crypto.randomUUID();
  const inicio = Date.now();
  let tentativas = 0;

  // Busca provedores ativos ordenados por prioridade
  const configs = await prisma.configIA.findMany({
    where: { ativo: true },
    orderBy: { prioridade: "asc" },
  });

  if (configs.length === 0) {
    return {
      sucesso: false,
      conteudo: "",
      provedor: "anthropic",
      modelo: "",
      latenciaMs: Date.now() - inicio,
      tentativas: 0,
      requestId,
      erro: "Nenhum provedor de IA configurado. Vá em Configurações e adicione pelo menos uma chave.",
    };
  }

  const erros: string[] = [];

  for (const config of configs) {
    const provedor = config.provedor as Provedor;
    const modelo = getModelo(provedor, config.modeloPrincipal);
    tentativas++;

    try {
      const resultado = await chamarProvedor(provedor, modelo, opcoes);
      const latenciaMs = Date.now() - inicio;

      // Log is fire-and-forget — never block or discard AI result on log failure
      prisma.logIA.create({
        data: {
          requestId,
          funcionalidade: opcoes.funcionalidade,
          provedor,
          modelo,
          sucesso: true,
          tokensEntrada: resultado.tokensEntrada,
          tokensSaida: resultado.tokensSaida,
          latenciaMs,
          tentativas,
        },
      }).catch(() => {});

      return {
        sucesso: true,
        conteudo: resultado.conteudo,
        provedor,
        modelo,
        tokensEntrada: resultado.tokensEntrada,
        tokensSaida: resultado.tokensSaida,
        latenciaMs,
        tentativas,
        requestId,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      erros.push(`${provedor}: ${msg}`);
    }
  }

  const latenciaMs = Date.now() - inicio;
  const erroFinal = erros.join(" | ");

  await prisma.logIA.create({
    data: {
      requestId,
      funcionalidade: opcoes.funcionalidade,
      provedor: "anthropic",
      modelo: "desconhecido",
      sucesso: false,
      latenciaMs,
      tentativas,
      erro: erroFinal,
    },
  });

  return {
    sucesso: false,
    conteudo: "",
    provedor: "anthropic",
    modelo: "",
    latenciaMs,
    tentativas,
    requestId,
    erro: `Todos os provedores falharam. ${erroFinal}`,
  };
}

export async function contextoCerebro(userId = "admin-default"): Promise<string> {
  const { CONFIG } = require("@/lib/config");
  let base: string = CONFIG.contextoIA;

  try {
    const estudo = await prisma.estudoEstrategico.findUnique({ where: { id: userId } });
    if (!estudo) return base;

    const extras: string[] = [];
    const arr = (obj: Record<string, unknown>, k: string) =>
      Array.isArray(obj[k]) ? (obj[k] as string[]).filter(Boolean) : [];

    if (estudo.secPersona) {
      try {
        const p = JSON.parse(estudo.secPersona) as Record<string, unknown>;
        const linhas: string[] = [];
        if (p.nome) linhas.push(`Nome da persona: ${p.nome}`);
        if (p.perfil) linhas.push(`Perfil: ${p.perfil}`);
        if (p.rotina) linhas.push(`Rotina: ${p.rotina}`);
        const medos = arr(p, "medos"); if (medos.length) linhas.push(`Medos: ${medos.join(", ")}`);
        const frustracoes = arr(p, "frustracoes"); if (frustracoes.length) linhas.push(`Frustrações: ${frustracoes.join(", ")}`);
        const sonhos = arr(p, "sonhos"); if (sonhos.length) linhas.push(`Sonhos: ${sonhos.join(", ")}`);
        const doresEmo = arr(p, "dores_emocionais"); if (doresEmo.length) linhas.push(`Dores emocionais: ${doresEmo.join(", ")}`);
        const desejos = arr(p, "desejos_conscientes"); if (desejos.length) linhas.push(`Desejos: ${desejos.join(", ")}`);
        const gatilhos = arr(p, "gatilhos_compra"); if (gatilhos.length) linhas.push(`Gatilhos de compra: ${gatilhos.join(", ")}`);
        const usaP = arr(p, "palavras_usa"); if (usaP.length) linhas.push(`Palavras que usa: ${usaP.join(", ")}`);
        const odeiaP = arr(p, "palavras_odeia"); if (odeiaP.length) linhas.push(`Palavras que odeia: ${odeiaP.join(", ")}`);
        const confia = arr(p, "faz_confiar"); if (confia.length) linhas.push(`O que faz confiar: ${confia.join(", ")}`);
        if (linhas.length) extras.push(`PERSONA DETALHADA:\n${linhas.join("\n")}`);
      } catch {}
    }

    if (estudo.secEmpresa) {
      try {
        const e = JSON.parse(estudo.secEmpresa) as Record<string, unknown>;
        const linhas: string[] = [];
        if (e.posicionamento_desejado) linhas.push(`Posicionamento desejado: ${e.posicionamento_desejado}`);
        if (e.promessa) linhas.push(`Promessa da marca: ${e.promessa}`);
        if (e.transformacao) linhas.push(`Transformação entregue: ${e.transformacao}`);
        const diffs = arr(e, "diferenciais"); if (diffs.length) linhas.push(`Diferenciais: ${diffs.join(", ")}`);
        const vals = arr(e, "valores"); if (vals.length) linhas.push(`Valores: ${vals.join(", ")}`);
        if (linhas.length) extras.push(`POSICIONAMENTO ESTRATÉGICO:\n${linhas.join("\n")}`);
      } catch {}
    }

    if (estudo.secObjetivos) {
      try {
        const o = JSON.parse(estudo.secObjetivos) as Record<string, unknown>;
        const linhas: string[] = [];
        if (o.objetivos) linhas.push(`Objetivos do perfil: ${o.objetivos}`);
        if (o.estrategia_geral) linhas.push(`Estratégia geral: ${o.estrategia_geral}`);
        if (o.tipo_conteudo) linhas.push(`Tipo de conteúdo prioritário: ${o.tipo_conteudo}`);
        if (o.frequencia_ideal) linhas.push(`Frequência ideal: ${o.frequencia_ideal}`);
        if (linhas.length) extras.push(`OBJETIVOS DO PERFIL:\n${linhas.join("\n")}`);
      } catch {}
    }

    if ((estudo as Record<string, unknown>).secComunicacao) {
      try {
        const c = JSON.parse((estudo as Record<string, unknown>).secComunicacao as string) as Record<string, unknown>;
        const linhas: string[] = [];
        if (c.ritmo) linhas.push(`Ritmo de comunicação: ${c.ritmo}`);
        if (c.cta_recorrente) linhas.push(`CTA recorrente: ${c.cta_recorrente}`);
        if (c.bordao) linhas.push(`Bordão/expressão de assinatura: ${c.bordao}`);
        if (c.evita) linhas.push(`Nunca usa: ${c.evita}`);
        if (c.humor) linhas.push(`Estilo de humor: ${c.humor}`);
        if (c.vicios) linhas.push(`Vícios de linguagem: ${c.vicios}`);
        if (c.tipo_gravacao) linhas.push(`Formatos de gravação preferidos: ${c.tipo_gravacao}`);
        if (linhas.length) extras.push(`ESTILO DE COMUNICAÇÃO DA CRIADORA:\n${linhas.join("\n")}`);
      } catch {}
    }

    if (extras.length) {
      base += `\n\n--- ESTUDO ESTRATÉGICO (use para personalizar o conteúdo) ---\n${extras.join("\n\n")}`;
    }
  } catch {
    // Silently fall back to base context if study data unavailable
  }

  return base;
}
