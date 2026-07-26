export const STATUS_CONFIG: Record<string, { label: string; cor: string; dot: string }> = {
  IDEIA:              { label: "Ideia",               cor: "bg-gray-100 text-gray-600",      dot: "#9CA3AF" },
  APROVADO:           { label: "Aprovado",             cor: "bg-green-100 text-green-700",    dot: "#22C55E" },
  ROTEIRO_PRONTO:     { label: "Roteiro pronto",       cor: "bg-indigo-100 text-indigo-700",  dot: "#6366F1" },
  GERADO_IA:          { label: "Roteiro pronto",       cor: "bg-indigo-100 text-indigo-700",  dot: "#6366F1" },
  EM_EDICAO:          { label: "Em edição",            cor: "bg-amber-100 text-amber-700",    dot: "#F59E0B" },
  PRONTO_PUBLICAR:    { label: "Pronto para publicar", cor: "bg-teal-100 text-teal-700",      dot: "#14B8A6" },
  AGENDADO:           { label: "Agendado",             cor: "bg-purple-100 text-purple-700",  dot: "#A855F7" },
  PUBLICADO:          { label: "Publicado",            cor: "bg-emerald-100 text-emerald-800",dot: "#059669" },
  REVISAR_MAIS_TARDE: { label: "Revisar mais tarde",   cor: "bg-amber-50 text-amber-600",     dot: "#D97706" },
  DESCARTADO:         { label: "Descartado",           cor: "bg-red-50 text-red-500",         dot: "#EF4444" },
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
