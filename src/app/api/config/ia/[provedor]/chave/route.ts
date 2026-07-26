import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const ENV_PATH = join(process.cwd(), ".env.local");

const VAR_MAP: Record<string, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  openai: "OPENAI_API_KEY",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ provedor: string }> }) {
  const { provedor } = await params;
  const { chave } = await req.json();

  const varName = VAR_MAP[provedor];
  if (!varName) return NextResponse.json({ erro: "Provedor inválido" }, { status: 400 });
  if (!chave?.trim()) return NextResponse.json({ erro: "Chave inválida" }, { status: 400 });

  let conteudo = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf-8") : "";
  const regex = new RegExp(`^${varName}=.*$`, "m");

  if (regex.test(conteudo)) {
    conteudo = conteudo.replace(regex, `${varName}=${chave.trim()}`);
  } else {
    conteudo = conteudo.trimEnd() + `\n${varName}=${chave.trim()}\n`;
  }

  writeFileSync(ENV_PATH, conteudo, "utf-8");
  return NextResponse.json({ sucesso: true });
}
