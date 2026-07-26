// Membros autorizados a acessar o sistema.
// Adicione ou remova entradas conforme necessário.
// O email deve ser digitado exatamente como cadastrado aqui (case-insensitive).

export type Membro = { nome: string; email: string; senha: string };

export const TEAM: Membro[] = [
  { nome: "Mari",    email: "marianapithan@gmail.com", senha: "itcase2026" },
  { nome: "Nicolli", email: "nicolli@itcase.com.br",   senha: "itcase2026" },
  { nome: "Gabi",    email: "gabi@itcase.com.br",      senha: "itcase2026" },
  { nome: "José",    email: "jose@itcase.com.br",      senha: "itcase2026" },
];

export function encontrarMembro(email: string, senha: string): Membro | undefined {
  return TEAM.find(
    (m) =>
      m.email.toLowerCase() === email.toLowerCase().trim() &&
      m.senha === senha
  );
}
