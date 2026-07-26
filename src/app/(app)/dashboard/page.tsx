import { prisma } from "@/lib/db/client";
import { Lightbulb, BookOpen, CalendarDays, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { STATUS_CONFIG, FORMATOS_CONFIG } from "@/lib/constants";
import { CONFIG } from "@/lib/config";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const FRASES_MOT = [
  "Seu conteúdo de hoje pode ser sua venda de amanhã. 🚀",
  "Consistência bate talento quando talento não é consistente. 💪",
  "O algoritmo ama quem aparece. Apareça! 📲",
  "Não desista de criar — desista de perfeição. 🎯",
  "Uma legenda por dia mantece o cliente por perto. ✍️",
  "Hoje você posta, amanhã você vende, depois você descansa (talvez). 😄",
  "Cada post é uma sementinha. Não para de regar! 🌱",
  "Feito é melhor que perfeito — pergunta pra qualquer iPhone seminovo. 😂",
  "Você não cria conteúdo por acaso. Você cria por estratégia. 🎬",
  "Quem conta sua história não precisa que o concorrente conte a dele. 🏆",
];

const { publicados: META_PUBLICADOS_90D } = CONFIG.metas;
const META_MES = Math.ceil(META_PUBLICADOS_90D / 3);

export default async function Dashboard() {
  const hoje = new Date();
  const inicioDia = new Date(hoje); inicioDia.setHours(0, 0, 0, 0);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
  const em7dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [totalTemas, totalConteudos, agendados, aprovados, proximosNaoGravados, publicadosMes, proximosConteudos] = await Promise.all([
    prisma.tema.count(),
    prisma.conteudo.count(),
    prisma.conteudo.count({ where: { status: "AGENDADO" } }),
    prisma.conteudo.count({ where: { status: "APROVADO" } }),
    prisma.conteudo.count({
      where: {
        dataplanejada: { gte: hoje, lte: new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000) },
        gravado: false,
        status: { in: ["AGENDADO", "APROVADO", "ROTEIRO_PRONTO"] },
      },
    }),
    prisma.conteudo.count({
      where: {
        status: "PUBLICADO",
        dataplanejada: { gte: inicioMes, lte: fimMes },
      },
    }),
    prisma.conteudo.findMany({
      where: {
        dataplanejada: { gte: inicioDia, lte: em7dias },
        status: { notIn: ["DESCARTADO", "PUBLICADO"] },
      },
      orderBy: { dataplanejada: "asc" },
      take: 6,
    }),
  ]);

  const recentes = await prisma.conteudo.findMany({
    take: 5,
    orderBy: { criadoEm: "desc" },
    include: { tema: { select: { titulo: true } } },
  });

  const stats = [
    { label: "Temas criados",   value: totalTemas,     icon: Lightbulb,    href: "/temas",      cor: "bg-blue-50 text-blue-600" },
    { label: "Conteúdos",       value: totalConteudos, icon: BookOpen,     href: "/biblioteca", cor: "bg-purple-50 text-purple-600" },
    { label: "Agendados",       value: agendados,      icon: CalendarDays, href: "/calendario", cor: "bg-orange-50 text-orange-600" },
    { label: "Aprovados",       value: aprovados,      icon: TrendingUp,   href: "/roteiros",   cor: "bg-green-50 text-green-600" },
  ];

  const progMes = META_MES > 0 ? Math.min(100, (publicadosMes / META_MES) * 100) : 0;
  const nomeMes = format(hoje, "MMMM", { locale: ptBR });
  const nomeMesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  const fraseIdx = hoje.getDate() % FRASES_MOT.length;
  const fraseMot = FRASES_MOT[fraseIdx];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Bom dia! 👋</h1>
          <p className="text-gray-500 mt-1 text-sm">Aqui está o resumo do seu Studio de Conteúdo.</p>
        </div>
        {proximosNaoGravados > 0 && (
          <Link href="/calendario"
            className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors font-medium shrink-0">
            <AlertCircle size={13} className="text-amber-500 shrink-0" />
            <span className="hidden sm:inline">{proximosNaoGravados} conteúdo{proximosNaoGravados > 1 ? "s" : ""} agendado{proximosNaoGravados > 1 ? "s" : ""} nos próximos 2 dias sem gravação</span>
            <span className="sm:hidden">{proximosNaoGravados} sem gravação</span>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon, href, cor }) => (
          <Link key={label} href={href} className="group block border border-gray-100 rounded-xl p-3 md:p-4 hover:border-gray-300 transition-colors bg-white">
            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center mb-2 md:mb-3 ${cor}`}>
              <Icon size={16} />
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      {/* Próximos + Progresso do mês */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">

        {/* Próximos conteúdos */}
        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Próximos 7 dias</span>
            </div>
            <Link href="/calendario" className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors">Ver calendário →</Link>
          </div>
          {proximosConteudos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-300">
              <CalendarDays size={28} className="mb-2" />
              <p className="text-xs">Nenhum conteúdo agendado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {proximosConteudos.map((c) => {
                const s = STATUS_CONFIG[c.status] ?? { label: c.status, cor: "bg-gray-100 text-gray-600", dot: "#9ca3af" };
                const fmt = FORMATOS_CONFIG[c.formato];
                const data = c.dataplanejada ? new Date(c.dataplanejada as unknown as string) : null;
                const diffDias = data ? differenceInCalendarDays(data, hoje) : 99;
                const dataLabel = diffDias === 0 ? "Hoje" : diffDias === 1 ? "Amanhã" : data ? format(data, "d MMM", { locale: ptBR }) : "";
                const urgenciaCor = diffDias <= 1 ? "text-red-500" : diffDias <= 5 ? "text-amber-500" : "text-green-600";
                return (
                  <Link key={c.id} href="/calendario" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                    <div className={`text-[10px] font-bold min-w-[44px] ${urgenciaCor}`}>
                      {dataLabel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">{c.titulo}</div>
                      {fmt && <div className="text-[10px] text-gray-400">{fmt.label}</div>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${s.cor}`}>{s.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Progresso do mês */}
        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Publicados em {nomeMesCapitalizado}</span>
            </div>
            <Link href="/biblioteca" className="text-[11px] text-gray-400 hover:text-gray-700 transition-colors">Ver biblioteca →</Link>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-bold text-gray-900">{publicadosMes}</span>
              {META_MES > 0 && (
                <span className="text-sm text-gray-400 mb-1">/ {META_MES} meta</span>
              )}
              {META_MES > 0 && (
                <span className="text-sm font-semibold mb-1 ml-auto" style={{ color: progMes >= 100 ? "#16a34a" : progMes >= 60 ? "#2563eb" : "#f59e0b" }}>
                  {Math.round(progMes)}%
                </span>
              )}
            </div>
            {META_MES > 0 && (
              <>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${progMes}%`,
                      backgroundColor: progMes >= 100 ? "#16a34a" : progMes >= 60 ? "#2563eb" : "#f59e0b",
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {progMes >= 100
                    ? "Meta do mês atingida! 🎉 Hora de comemorar!"
                    : `${META_MES - publicadosMes} publicaç${META_MES - publicadosMes !== 1 ? "ões" : "ão"} para a meta`}
                </p>
                <p className="text-[11px] text-gray-400 italic">{fraseMot}</p>
              </>
            )}
            {META_MES === 0 && (
              <p className="text-xs text-gray-400">Configure a meta em <code className="text-[11px] bg-gray-100 px-1 rounded">config.ts</code></p>
            )}
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link href="/temas" className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors text-center">
          <Lightbulb size={18} className="text-gray-400" />
          <span className="text-xs text-gray-600 leading-tight">Novo tema</span>
        </Link>
        <Link href="/roteiros" className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors text-center">
          <BookOpen size={18} className="text-gray-400" />
          <span className="text-xs text-gray-600 leading-tight">Roteiro</span>
        </Link>
        <Link href="/calendario" className="flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl border border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors text-center">
          <CalendarDays size={18} className="text-gray-400" />
          <span className="text-xs text-gray-600 leading-tight">Calendário</span>
        </Link>
      </div>

      {/* Recentes */}
      {recentes.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">Adicionados recentemente</h2>
          <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {recentes.map((c) => {
              const s = STATUS_CONFIG[c.status] ?? { label: c.status, cor: "bg-gray-100 text-gray-600" };
              return (
                <Link key={c.id} href="/roteiros" className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{c.titulo}</div>
                    {c.tema && <div className="text-xs text-gray-400">{c.tema.titulo}</div>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cor}`}>{s.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
