import { prisma } from "@/lib/db/client";
import { Lightbulb, BookOpen, CalendarDays, TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import { STATUS_CONFIG } from "@/lib/constants";
import { CONFIG } from "@/lib/config";

const { receita: META_RECEITA, seguidores: META_SEGUIDORES, publicados: META_PUBLICADOS, dias: DIAS_META } = CONFIG.metas;

export default async function Dashboard() {
  const hoje = new Date();
  const inicioPeriodo = new Date(hoje);
  inicioPeriodo.setDate(hoje.getDate() - DIAS_META);

  const [totalTemas, totalConteudos, agendados, publicados, aprovados, proximosNaoGravados] = await Promise.all([
    prisma.tema.count(),
    prisma.conteudo.count(),
    prisma.conteudo.count({ where: { status: "AGENDADO" } }),
    prisma.conteudo.count({ where: { status: "PUBLICADO" } }),
    prisma.conteudo.count({ where: { status: "APROVADO" } }),
    // conteúdos agendados nos próximos 2 dias sem "gravado"
    prisma.conteudo.count({
      where: {
        dataplanejada: {
          gte: hoje,
          lte: new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000),
        },
        gravado: false,
        status: { in: ["AGENDADO", "APROVADO", "ROTEIRO_PRONTO"] },
      },
    }),
  ]);

  const recentes = await prisma.conteudo.findMany({
    take: 6,
    orderBy: { criadoEm: "desc" },
    include: { tema: { select: { titulo: true } } },
  });

  const stats = [
    { label: "Temas criados",   value: totalTemas,     icon: Lightbulb,    href: "/temas",      cor: "bg-blue-50 text-blue-600" },
    { label: "Conteúdos",       value: totalConteudos, icon: BookOpen,     href: "/biblioteca", cor: "bg-purple-50 text-purple-600" },
    { label: "Agendados",       value: agendados,      icon: CalendarDays, href: "/calendario", cor: "bg-orange-50 text-orange-600" },
    { label: "Aprovados",       value: aprovados,      icon: TrendingUp,   href: "/roteiros",   cor: "bg-green-50 text-green-600" },
  ];

  const progPublicados = Math.min(100, (publicados / META_PUBLICADOS) * 100);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bom dia! 👋</h1>
          <p className="text-gray-500 mt-1">Aqui está o resumo do seu Studio de Conteúdo.</p>
        </div>
        {proximosNaoGravados > 0 && (
          <Link href="/calendario"
            className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors font-medium">
            <AlertCircle size={13} className="text-amber-500" />
            {proximosNaoGravados} conteúdo{proximosNaoGravados > 1 ? "s" : ""} agendado{proximosNaoGravados > 1 ? "s" : ""} nos próximos 2 dias sem gravação
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href, cor }) => (
          <Link key={label} href={href} className="group block border border-gray-100 rounded-xl p-4 hover:border-gray-300 transition-colors bg-white">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${cor}`}>
              <Icon size={18} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      {/* Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Meta receita */}
        <div className="bg-gray-900 text-white rounded-xl p-5">
          <div className="flex items-start justify-between mb-1">
            <div className="text-xs text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <DollarSign size={11} /> Meta de receita
            </div>
            <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">Projeção · {DIAS_META} dias</span>
          </div>
          <div className="text-2xl font-bold mb-3">R$ {META_RECEITA.toLocaleString("pt-BR")}</div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>{publicados} conteúdos publicados</span>
            <span>meta: {META_PUBLICADOS}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mb-1.5">
            <div className="h-1.5 rounded-full bg-green-400 transition-all" style={{ width: `${progPublicados}%` }} />
          </div>
          <div className="text-[11px] text-gray-500">
            Baseado em conteúdos publicados — conecte dados de vendas para progresso real
          </div>
        </div>

        {/* Meta seguidores */}
        <div className="bg-gradient-to-br from-purple-900 to-purple-800 text-white rounded-xl p-5">
          <div className="flex items-start justify-between mb-1">
            <div className="text-xs text-purple-300 uppercase tracking-wide flex items-center gap-1.5">
              <Users size={11} /> Meta de seguidores
            </div>
            <span className="text-[10px] bg-white/10 text-purple-300 px-2 py-0.5 rounded-full">Projeção · {DIAS_META} dias</span>
          </div>
          <div className="text-2xl font-bold mb-3">{META_SEGUIDORES.toLocaleString("pt-BR")} seguidores</div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
            <div className="h-1.5 rounded-full bg-purple-300/40 w-full" />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-purple-400">
            <AlertCircle size={11} />
            Sem dados conectados — integre Instagram para acompanhar o progresso real
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Link href="/temas" className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm text-gray-600">
          <Lightbulb size={16} /> Criar novo tema
        </Link>
        <Link href="/roteiros" className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm text-gray-600">
          <BookOpen size={16} /> Gerar roteiro
        </Link>
        <Link href="/calendario" className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm text-gray-600">
          <CalendarDays size={16} /> Abrir calendário
        </Link>
      </div>

      {/* Recentes */}
      {recentes.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">Conteúdos recentes</h2>
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
