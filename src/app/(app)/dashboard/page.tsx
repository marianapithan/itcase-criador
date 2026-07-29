export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db/client";
import { Lightbulb, BookOpen, CalendarDays, Video, Smartphone, FileImage, AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { STATUS_CONFIG, FORMATOS_CONFIG } from "@/lib/constants";
import { CONFIG } from "@/lib/config";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const FRASES_MOT = [
  "Seu conteúdo de hoje pode ser sua venda de amanhã.",
  "Consistência bate talento quando talento não é consistente.",
  "O algoritmo ama quem aparece. Apareça!",
  "Não desista de criar. Desista de perfeição.",
  "Uma legenda por dia mantece o cliente por perto.",
  "Feito é melhor que perfeito. Pergunta pra qualquer iPhone seminovo.",
  "Você não cria conteúdo por acaso. Você cria por estratégia.",
  "Quem conta sua história não precisa que o concorrente conte a dele.",
];

const { publicados: META_PUBLICADOS_90D } = CONFIG.metas;
const META_MES = Math.ceil(META_PUBLICADOS_90D / 3);

export default async function Dashboard() {
  const hoje = new Date();
  const inicioDia = new Date(hoje); inicioDia.setHours(0, 0, 0, 0);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
  const em7dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

  const horaLocal = Number(
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false }).format(hoje)
  );
  const saudacao = horaLocal < 12 ? "Bom dia" : horaLocal < 18 ? "Boa tarde" : "Boa noite";

  const [proximosNaoGravados, publicadosMes, proximosConteudos, publicadosPorDia] = await Promise.all([
    prisma.conteudo.count({
      where: {
        dataplanejada: { gte: hoje, lte: new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000) },
        gravado: false,
        status: { in: ["AGENDADO", "APROVADO", "ROTEIRO_PRONTO"] },
      },
    }),
    prisma.conteudo.count({
      where: { status: "PUBLICADO", dataplanejada: { gte: inicioMes, lte: fimMes } },
    }),
    prisma.conteudo.findMany({
      where: {
        dataplanejada: { gte: inicioDia, lte: em7dias },
        status: { notIn: ["DESCARTADO", "PUBLICADO"] },
      },
      orderBy: { dataplanejada: "asc" },
      take: 6,
    }),
    prisma.conteudo.findMany({
      where: { status: "PUBLICADO", dataplanejada: { gte: inicioMes, lte: fimMes } },
      select: { dataplanejada: true },
    }),
  ]);

  const recentes = await prisma.conteudo.findMany({
    take: 5,
    orderBy: { criadoEm: "desc" },
    include: { tema: { select: { titulo: true } } },
  });


  const progMes = META_MES > 0 ? Math.min(100, (publicadosMes / META_MES) * 100) : 0;
  const nomeMes = format(hoje, "MMMM", { locale: ptBR });
  const nomeMesCapitalizado = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
  const fraseIdx = hoje.getDate() % FRASES_MOT.length;
  const fraseMot = FRASES_MOT[fraseIdx];

  const diasNoMes = fimMes.getDate();
  const contagemPorDia = Array(diasNoMes).fill(0);
  for (const p of publicadosPorDia) {
    if (!p.dataplanejada) continue;
    const d = new Date(p.dataplanejada as unknown as string).getDate() - 1;
    if (d >= 0 && d < diasNoMes) contagemPorDia[d]++;
  }
  const acumulado = contagemPorDia.reduce<number[]>((acc, v) => { acc.push((acc[acc.length - 1] ?? 0) + v); return acc; }, []);
  const maxAcum = Math.max(...acumulado, 1);
  const svgW = 200, svgH = 40;
  const sparkPoints = acumulado.map((v, i) => {
    const x = (i / (diasNoMes - 1)) * svgW;
    const y = svgH - (v / maxAcum) * svgH;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-7 flex items-start justify-between gap-3">
        <div>
          <p className="section-label-purple mb-1">· Studio de Conteúdo</p>
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ fontFamily: "var(--font-syne, inherit)", letterSpacing: "-0.01em", color: "var(--foreground)" }}
          >
            {saudacao}, <span className="gradient-text-brand">{CONFIG.nome}!</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Aqui está o resumo do seu estúdio.</p>
        </div>
        {proximosNaoGravados > 0 && (
          <Link href="/calendario"
            className="card-interactive flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-medium shrink-0"
            style={{ background: "rgba(240,96,128,0.1)", border: "1px solid rgba(240,96,128,0.25)", color: "#f06080" }}
          >
            <AlertCircle size={13} className="shrink-0" />
            <span className="hidden sm:inline">{proximosNaoGravados} conteúdo{proximosNaoGravados > 1 ? "s" : ""} sem gravação nos próx. 2 dias</span>
            <span className="sm:hidden">{proximosNaoGravados} sem gravação</span>
          </Link>
        )}
      </div>

      {/* O que vamos criar hoje? */}
      <div className="mb-6">
        <p className="section-label-purple mb-3">O que vamos criar hoje?</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/roteiros?novo=1", label: "Reels",  sub: "Vídeo curto vertical",  icon: Video,      cor: "#f06080", corBg: "rgba(240,96,128,0.12)" },
            { href: "/roteiros?novo=1", label: "Story",  sub: "Conteúdo de 24 horas",  icon: Smartphone, cor: "#9b8fd4", corBg: "rgba(155,143,212,0.12)" },
            { href: "/roteiros?novo=1", label: "Post",   sub: "Imagem ou carrossel",    icon: FileImage,  cor: "#c8d92a", corBg: "rgba(200,217,42,0.12)" },
          ].map(({ href, label, sub, icon: Icon, cor, corBg }) => (
            <Link
              key={label}
              href={href}
              className="card-interactive flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl text-center relative overflow-hidden"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: cor }} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: corBg }}>
                <Icon size={19} style={{ color: cor }} />
              </div>
              <div>
                <div className="font-bold text-base" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>{label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{sub}</div>
              </div>
              <div className="text-xs font-medium mt-1 flex items-center gap-1" style={{ color: cor }}>
                Criar roteiro <ArrowRight size={11} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Próximos + Progresso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">

        {/* Próximos 7 dias */}
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--card-border)" }}>
            <div className="flex items-center gap-2">
              <Clock size={13} style={{ color: "var(--muted)" }} />
              <span className="section-label">Próximos 7 dias</span>
            </div>
            <Link href="/calendario" className="text-[11px] flex items-center gap-1 transition-colors" style={{ color: "var(--muted)" }}>
              Ver calendário <ArrowRight size={10} />
            </Link>
          </div>
          {proximosConteudos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8" style={{ color: "var(--muted)" }}>
              <CalendarDays size={28} className="mb-2 opacity-40" />
              <p className="text-xs">Nenhum conteúdo agendado</p>
            </div>
          ) : (
            <div>
              {proximosConteudos.map((c) => {
                const s = STATUS_CONFIG[c.status] ?? { label: c.status, cor: "status-ideia", dot: "#6a9a78" };
                const fmt = FORMATOS_CONFIG[c.formato];
                const data = c.dataplanejada ? new Date(c.dataplanejada as unknown as string) : null;
                const diffDias = data ? differenceInCalendarDays(data, hoje) : 99;
                const dataLabel = diffDias === 0 ? "Hoje" : diffDias === 1 ? "Amanhã" : data ? format(data, "d MMM", { locale: ptBR }) : "";
                const urgenciaCor = diffDias <= 1 ? "#f06080" : diffDias <= 5 ? "#fbbf24" : "#c8d92a";
                return (
                  <Link
                    key={c.id}
                    href="/calendario"
                    className="card-interactive flex items-center gap-3 px-4 py-2.5 transition-colors"
                    style={{ borderBottom: "1px solid var(--card-border)" }}
                  >
                    <div className="text-[10px] font-bold min-w-[44px]" style={{ color: urgenciaCor }}>
                      {dataLabel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "var(--foreground)" }}>{c.titulo}</div>
                      {fmt && <div className="text-[10px]" style={{ color: "var(--muted)" }}>{fmt.label}</div>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${s.cor}`}>{s.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Progresso do mês */}
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--card-border)" }}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} style={{ color: "var(--muted)" }} />
              <span className="section-label">Publicados em {nomeMesCapitalizado}</span>
            </div>
            <Link href="/biblioteca" className="text-[11px] flex items-center gap-1 transition-colors" style={{ color: "var(--muted)" }}>
              Ver biblioteca <ArrowRight size={10} />
            </Link>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-2 mb-3">
              <span
                className="text-4xl font-bold"
                style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}
              >
                {publicadosMes}
              </span>
              {META_MES > 0 && (
                <span className="text-sm mb-1" style={{ color: "var(--muted)" }}>/ {META_MES} meta</span>
              )}
              {META_MES > 0 && (
                <span
                  className="text-sm font-bold mb-1 ml-auto"
                  style={{ color: progMes >= 100 ? "#c8d92a" : progMes >= 60 ? "#9b8fd4" : "#fbbf24" }}
                >
                  {Math.round(progMes)}%
                </span>
              )}
            </div>
            {META_MES > 0 && (
              <>
                {acumulado.some((v) => v > 0) && (
                  <div className="mb-3">
                    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-10" preserveAspectRatio="none">
                      <polyline
                        points={sparkPoints}
                        fill="none"
                        stroke={progMes >= 100 ? "#c8d92a" : progMes >= 60 ? "#9b8fd4" : "#fbbf24"}
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
                <div className="w-full rounded-full h-2 mb-3" style={{ background: "var(--accent)" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${progMes}%`,
                      background: progMes >= 100 ? "#c8d92a" : progMes >= 60 ? "#9b8fd4" : "#fbbf24",
                    }}
                  />
                </div>
                <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
                  {progMes >= 100
                    ? "Meta do mês atingida! 🎉 Hora de comemorar!"
                    : `${META_MES - publicadosMes} publicaç${META_MES - publicadosMes !== 1 ? "ões" : "ão"} para a meta`}
                </p>
                <p className="text-[11px] italic" style={{ color: "var(--muted)", opacity: 0.7 }}>{fraseMot}</p>
              </>
            )}
            {META_MES === 0 && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>Configure a meta em <code className="text-[11px] px-1 rounded" style={{ background: "var(--accent)" }}>config.ts</code></p>
            )}
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="mb-2">
        <p className="section-label mb-3">Ações rápidas</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { href: "/temas",     label: "Novo tema",   icon: Lightbulb,    cor: "#c8d92a" },
          { href: "/roteiros",  label: "Novo roteiro", icon: BookOpen,     cor: "#9b8fd4" },
          { href: "/calendario",label: "Calendário",   icon: CalendarDays, cor: "#f06080" },
        ].map(({ href, label, icon: Icon, cor }) => (
          <Link
            key={href}
            href={href}
            className="card-interactive flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl text-center"
            style={{ background: "var(--card-bg)", border: `1px dashed var(--card-border)` }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${cor}18` }}>
              <Icon size={17} style={{ color: cor }} />
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Recentes */}
      {recentes.length > 0 && (
        <div>
          <p className="section-label mb-3">Adicionados recentemente</p>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
            {recentes.map((c, i) => {
              const s = STATUS_CONFIG[c.status] ?? { label: c.status, cor: "status-ideia" };
              return (
                <Link
                  key={c.id}
                  href="/roteiros"
                  className="card-interactive flex items-center justify-between px-4 py-3"
                  style={{
                    background: "var(--card-bg)",
                    borderBottom: i < recentes.length - 1 ? "1px solid var(--card-border)" : "none",
                  }}
                >
                  <div>
                    <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{c.titulo}</div>
                    {c.tema && <div className="text-xs" style={{ color: "var(--muted)" }}>{c.tema.titulo}</div>}
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
