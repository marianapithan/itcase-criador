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

export function contextoCerebro(): string {
  const { CONFIG } = require("@/lib/config");
  return CONFIG.contextoIA;
}
