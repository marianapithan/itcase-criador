export const STATUS_CONFIG: Record<string, { label: string; cor: string; dot: string }> = {
  IDEIA:              { label: "Ideia",               cor: "status-ideia",     dot: "#6a9a78" },
  APROVADO:           { label: "Aprovado",             cor: "status-aprovado",  dot: "#c8d92a" },
  ROTEIRO_PRONTO:     { label: "Roteiro pronto",       cor: "status-roteiro",   dot: "#9b8fd4" },
  GERADO_IA:          { label: "Roteiro pronto",       cor: "status-roteiro",   dot: "#9b8fd4" },
  EM_EDICAO:          { label: "Em edição",            cor: "status-edicao",    dot: "#fbbf24" },
  EM_PRODUCAO:        { label: "Em produção",          cor: "status-edicao",    dot: "#fbbf24" },
  PRONTO_PUBLICAR:    { label: "Pronto para publicar", cor: "status-pronto",    dot: "#6ee7b7" },
  AGENDADO:           { label: "Agendado",             cor: "status-agendado",  dot: "#9b8fd4" },
  PUBLICADO:          { label: "Publicado",            cor: "status-publicado", dot: "#c8d92a" },
  REVISAR_MAIS_TARDE: { label: "Revisar mais tarde",   cor: "status-revisar",   dot: "#fbbf24" },
  DESCARTADO:         { label: "Descartado",           cor: "status-descartado",dot: "#f06080" },
};

export const STATUS_LIST_EDITORIAL = [
  "IDEIA", "APROVADO", "ROTEIRO_PRONTO", "EM_EDICAO", "PRONTO_PUBLICAR", "AGENDADO", "PUBLICADO",
] as const;

export const RESPONSAVEIS = [
  { nome: "Mari",   cor: "#EF4444", bg: "#FEE2E2", inicial: "M" },
  { nome: "Nicolli", cor: "#8B5CF6", bg: "#EDE9FE", inicial: "N" },
  { nome: "Gabi",   cor: "#10B981", bg: "#D1FAE5", inicial: "G" },
  { nome: "José",   cor: "#3B82F6", bg: "#DBEAFE", inicial: "J" },
] as const;

export function getResponsavelConfig(nome: string) {
  return RESPONSAVEIS.find((r) => r.nome === nome) ?? null;
}

export const FORMATOS_CONFIG: Record<string, { label: string; bg: string; border: string; text: string; dot: string }> = {
  REELS:         { label: "Reels",     bg: "#FDECF5", border: "#E23E8C", text: "#B91C6A", dot: "#E23E8C" },
  CARROSSEL:     { label: "Carrossel", bg: "#FDF1EA", border: "#E8703A", text: "#C45A20", dot: "#E8703A" },
  POST_ESTATICO: { label: "Estático",  bg: "#ECF2FE", border: "#2F6FED", text: "#1A4DB5", dot: "#2F6FED" },
  STORIES:       { label: "Stories",   bg: "#F3E8FF", border: "#9333EA", text: "#7C22D4", dot: "#9333EA" },
  GRUPO_VIP:     { label: "Grupo VIP", bg: "#DCFCE7", border: "#16A34A", text: "#15803D", dot: "#16A34A" },
};

export const TRAFEGO_STATUS_LIST = [
  { value: "NAO_INICIADO",  label: "Não iniciado" },
  { value: "PROGRAMADO",    label: "Programado" },
  { value: "EM_VEICULACAO", label: "Em veiculação" },
  { value: "PAUSADO",       label: "Pausado" },
  { value: "ENCERRADO",     label: "Encerrado" },
] as const;
