// Membros autorizados a acessar o sistema.
// Adicione ou remova entradas conforme necessário.
// O email deve ser digitado exatamente como cadastrado aqui (case-insensitive).

import type { Role } from "@/lib/session";

export type Membro = { nome: string; email: string; senha: string };

// Email do administrador master da plataforma
export const ADMIN_EMAIL = "marianapithan@gmail.com";

export const TEAM: Membro[] = [
  { nome: "Mari",    email: "marianapithan@gmail.com", senha: "itcase2026" },
  { nome: "Nicolli", email: "nicolli@itcase.com.br",   senha: "itcase2026" },
  { nome: "Gabi",    email: "gabi@itcase.com.br",      senha: "itcase2026" },
  { nome: "José",    email: "jose@itcase.com.br",      senha: "itcase2026" },
];

export function encontrarMembro(
  email: string,
  senha: string
): (Membro & { role: Role }) | undefined {
  const m = TEAM.find(
    (m) =>
      m.email.toLowerCase() === email.toLowerCase().trim() &&
      m.senha === senha
  );
  if (!m) return undefined;
  return { ...m, role: m.email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "admin" : "user" };
}
