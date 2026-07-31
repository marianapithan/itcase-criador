export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db/client";
import { garantirMigracoes } from "@/lib/db/migracoes";
import { getConfigGeral } from "@/lib/db/config-geral";
import { Lightbulb, BookOpen, CalendarDays, Video, Smartphone, FileImage, AlertCircle, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { STATUS_CONFIG, FORMATOS_CONFIG } from "@/lib/constants";
import { StatusBadge } from "@/components/StatusBadge";
import { format, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cookies } from "next/headers";
import { verificarSessao, COOKIE } from "@/lib/session";
import { MetaEditor } from "@/components/MetaEditor";

const FRASES_MOT = [
  "Seu conteúdo de hoje pode ser sua venda de amanhã.",
  "Consistência bate talento quando talento não é consistente.",
  "O algoritmo ama quem aparece. Apareça!",
  "Não desista de criar. Desista de perfeição.",
  "Uma legenda por dia mantece o cliente por perto.",
  "Seu algoritmo agradece.",
  "Você não cria conteúdo por acaso. Você cria por estratégia.",
  "Quem conta sua história não precisa que o concorrente conte a dele.",
  "Conteúdo bom não é o mais elaborado. É o mais verdadeiro.",
  "Poste hoje. Ajuste amanhã. Pare de esperar o dia perfeito.",
  "Cada post é uma conversa que começa antes da venda.",
  "Quem aparece toda semana é quem o cliente lembra na hora de comprar.",
  "Criatividade com consistência é a fórmula que o algoritmo não sabe imitar.",
  "Roteiro salvo é conteúdo a meio caminho.",
  "Três Reels por semana valem mais que um viral por mês.",
  "A câmera não precisa estar perfeita. A mensagem precisa ser honesta.",
  "Você já ajudou alguém hoje só pelo que publicou. Continue.",
  "Calendário cheio é sossego mental. Planeje para executar em paz.",
  "Seu concorrente espera que você desista hoje.",
  "Conteúdo é o vendedor que trabalha enquanto você dorme.",
  "Uma boa legenda começa antes da câmera ligar.",
  "Não existe conteúdo pequeno quando a mensagem é grande.",
  "Quem educa a audiência hoje, vende sem esforço amanhã.",
  "Conteúdo parado não gera venda. Publique.",
  "Stories todos os dias é o café da manhã do algoritmo.",
  "Cada peça de conteúdo plantada é uma semente de relacionamento.",
  "Uma ideia publicada vale mais do que dez ideias guardadas.",
  "Uma semana de posts consistentes muda a percepção de marca.",
  "O melhor conteúdo é o que sai. Não o que fica perfeito na cabeça.",
  "Autoridade se constrói post a post, não num só dia.",
  "O conteúdo de hoje abre a porta que o anúncio de amanhã vai fechar.",
];


export default async function Dashboard() {
  await garantirMigracoes();
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  const sessao = token ? await verificarSessao(token) : null;
  const userId = sessao?.userId ?? "admin-default";
  const configGeral = await getConfigGeral(userId);
  const nomeNegocio = configGeral.nomeNegocio;
  const META_MES = configGeral.metaPublicados > 0 ? configGeral.metaPublicados : 0;
  const hoje = new Date();
  const inicioDia = new Date(hoje); inicioDia.setHours(0, 0, 0, 0);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);
  const em7dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);

  const horaLocal = Number(
    new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false }).format(hoje)
  );
  const saudacao = horaLocal < 12 ? "Bom dia" : horaLocal < 18 ? "Boa tarde" : "Boa noite";

  const [proximosNaoGravados, publicadosMes, proximosConteudos, publicadosPorDia, recentes] = await Promise.all([
    prisma.conteudo.count({
      where: {
        userId,
        dataplanejada: { gte: hoje, lte: new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000) },
        gravado: false,
        status: { in: ["AGENDADO", "APROVADO", "ROTEIRO_PRONTO"] },
      },
    }),
    prisma.conteudo.count({
      where: { userId, status: "PUBLICADO", dataplanejada: { gte: inicioMes, lte: fimMes } },
    }),
    prisma.conteudo.findMany({
      where: {
        userId,
        dataplanejada: { gte: inicioDia, lte: em7dias },
        status: { notIn: ["DESCARTADO", "PUBLICADO"] },
      },
      orderBy: { dataplanejada: "asc" },
      take: 6,
    }),
    prisma.conteudo.findMany({
      where: { userId, status: "PUBLICADO", dataplanejada: { gte: inicioMes, lte: fimMes } },
      select: { dataplanejada: true },
    }),
    prisma.conteudo.findMany({
      where: { userId },
      take: 5,
      orderBy: { criadoEm: "desc" },
      include: { tema: { select: { titulo: true } } },
    }),
  ]);


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
            className="text-2xl md:text-3xl font-bold gradient-text-brand"
            style={{ fontFamily: "var(--font-syne, inherit)", letterSpacing: "-0.01em" }}
          >
            {saudacao}{nomeNegocio ? `, ${nomeNegocio}` : ""}!
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
            { href: "/roteiros?novo=1", label: "Reels",  sub: "Vídeo curto vertical",  icon: Video,      cor: "#f06080" },
            { href: "/roteiros?novo=1", label: "Story",  sub: "Conteúdo de 24 horas",  icon: Smartphone, cor: "#9b8fd4" },
            { href: "/roteiros?novo=1", label: "Post",   sub: "Imagem ou carrossel",    icon: FileImage,  cor: "#c8d92a" },
          ].map(({ href, label, sub, icon: Icon, cor }) => (
            <Link
              key={label}
              href={href}
              className="card-interactive flex flex-col items-center gap-2 p-4 md:p-5 rounded-xl text-center relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, rgba(139,116,200,0.13) 0%, rgba(155,143,212,0.06) 100%)", border: "1px solid rgba(155,143,212,0.2)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl" style={{ background: cor }} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${cor}22` }}>
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
                      <div className="text-xs font-medium line-clamp-2" style={{ color: "var(--foreground)" }}>{c.titulo}</div>
                      {fmt && <div className="text-[10px]" style={{ color: "var(--muted)" }}>{fmt.label}</div>}
                    </div>
                    <StatusBadge status={c.status} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Progresso do mês */}
        <MetaEditor
          metaMes={META_MES}
          publicadosMes={publicadosMes}
          nomeMes={nomeMesCapitalizado}
          fraseMot={fraseMot}
          sparkPoints={sparkPoints}
          svgW={svgW}
          svgH={svgH}
          acumulado={acumulado}
        />
      </div>

      {/* Ações rápidas */}
      <div className="mb-2">
        <p className="section-label mb-3">Ações rápidas</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { href: "/temas",     label: "Novo tema",    icon: Lightbulb,    cor: "#c8d92a" },
          { href: "/roteiros",  label: "Novo roteiro", icon: BookOpen,     cor: "#9b8fd4" },
          { href: "/calendario",label: "Calendário",   icon: CalendarDays, cor: "#8B74C8" },
        ].map(({ href, label, icon: Icon, cor }) => (
          <Link
            key={href}
            href={href}
            className="card-interactive flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl text-center"
            style={{ background: "linear-gradient(135deg, rgba(139,116,200,0.10) 0%, rgba(155,143,212,0.04) 100%)", border: "1px dashed rgba(155,143,212,0.25)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${cor}22` }}>
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
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-2" style={{ color: "var(--foreground)" }}>{c.titulo}</div>
                    {c.tema && <div className="text-xs" style={{ color: "var(--muted)" }}>{c.tema.titulo}</div>}
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
