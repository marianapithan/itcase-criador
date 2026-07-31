"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, LayoutDashboard, LogOut, FileText, Lightbulb,
  ShieldAlert, Radar, Cpu, Layers, BarChart3, RefreshCw,
  CheckCircle2, Sparkles, ExternalLink, Users,
} from "lucide-react";

type Stats = {
  conteudos: { total: number; publicados: number; geradosIA: number; comRoteiro: number };
  temas: { total: number; microtemas: number };
  objecoes: number;
  tendencias: number;
  ia: { totalLogs: number; provedoresAtivos: string[]; frameworkAtivo: string };
  recenteIA: { funcionalidade: string; provedor: string; sucesso: boolean; criadoEm: string }[];
  usuarios: { total: number; novosEsseMes: number; onboardingConcluido: number };
};

const PURPLE = "#8B74C8";
const PURPLE_BG = "rgba(139,116,200,0.07)";
const PURPLE_BORDER = "rgba(139,116,200,0.15)";

function AdminSidebar({ ativo }: { ativo: string }) {
  const router = useRouter();

  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const itens = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
    { label: "Usuários", icon: Users, href: "/admin/usuarios" },
  ];

  return (
    <aside className="w-52 shrink-0 flex flex-col" style={{ background: "rgba(139,116,200,0.06)", borderRight: `1px solid ${PURPLE_BORDER}` }}>
      <div className="px-4 py-5" style={{ borderBottom: `1px solid ${PURPLE_BORDER}` }}>
        <div className="flex items-center gap-2">
          <Shield size={16} style={{ color: PURPLE }} />
          <div>
            <div className="font-bold text-sm" style={{ color: "#f0ecff", fontFamily: "var(--font-syne, inherit)" }}>Cria Para Mim</div>
            <div className="text-[10px]" style={{ color: "#7a63b5" }}>Admin Master</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {itens.map(({ label, icon: Icon, href }) => {
          const active = ativo === href;
          return (
            <a
              key={label}
              href={href}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm"
              style={active ? { background: "rgba(139,116,200,0.2)", color: "#d4c8ff" } : { color: "#7a63b5" }}
            >
              <Icon size={14} />
              {label}
            </a>
          );
        })}
      </nav>

      <div className="px-2 py-3" style={{ borderTop: `1px solid ${PURPLE_BORDER}` }}>
        <a
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors mb-1"
          style={{ color: "#7a63b5" }}
        >
          <ExternalLink size={12} />
          Ver app
        </a>
        <button
          onClick={sair}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors"
          style={{ color: "#7a63b5" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f06080"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#7a63b5"; }}
        >
          <LogOut size={12} />
          Sair
        </button>
      </div>
    </aside>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregarStats(); }, []);

  async function carregarStats() {
    setCarregando(true);
    try {
      const r = await fetch("/api/admin/stats");
      if (r.status === 403) { router.push("/admin/login"); return; }
      setStats(await r.json());
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #1a0533 0%, #0f0520 100%)" }}>
      <AdminSidebar ativo="/admin" />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: PURPLE }}>
                · Painel de Administração
              </p>
              <h1 className="text-2xl font-bold" style={{ color: "#f0ecff", fontFamily: "var(--font-syne, inherit)" }}>
                Visão Geral da Plataforma
              </h1>
              <p className="text-sm mt-1" style={{ color: "#7a63b5" }}>Cria Para Mim — Métricas globais</p>
            </div>
            <button
              onClick={carregarStats}
              disabled={carregando}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
              style={{ background: "rgba(139,116,200,0.1)", color: "#9b80d4", border: `1px solid ${PURPLE_BORDER}` }}
            >
              <RefreshCw size={12} className={carregando ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin" style={{ color: PURPLE }} />
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Cards principais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Usuários", valor: stats.usuarios.total, sub: `${stats.usuarios.novosEsseMes} este mês`, icon: Users, cor: "#a78bfa" },
                  { label: "Conteúdos", valor: stats.conteudos.total, sub: `${stats.conteudos.publicados} publicados`, icon: FileText, cor: PURPLE },
                  { label: "Temas", valor: stats.temas.total, sub: `${stats.temas.microtemas} microtemas`, icon: Lightbulb, cor: "#c8d92a" },
                  { label: "Chamadas IA", valor: stats.ia.totalLogs, sub: "total histórico", icon: Cpu, cor: "#6ee7b7" },
                ].map(({ label, valor, sub, icon: Icon, cor }) => (
                  <div key={label} className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: "#7a63b5" }}>{label}</span>
                      <Icon size={14} style={{ color: cor }} />
                    </div>
                    <div className="text-3xl font-bold" style={{ color: "#f0ecff", fontFamily: "var(--font-syne, inherit)" }}>{valor}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#5d4a9c" }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Usuários + Conteúdos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users size={14} style={{ color: PURPLE }} />
                      <span className="text-xs font-bold tracking-wider uppercase" style={{ color: PURPLE }}>Usuários</span>
                    </div>
                    <a href="/admin/usuarios" className="text-[10px] px-2 py-0.5 rounded transition-opacity hover:opacity-80" style={{ background: "rgba(139,116,200,0.2)", color: "#c4b5fd" }}>
                      Ver todos →
                    </a>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Total cadastrados", val: stats.usuarios.total },
                      { label: "Novos este mês", val: stats.usuarios.novosEsseMes },
                      { label: "Onboarding concluído", val: stats.usuarios.onboardingConcluido },
                      { label: "Sem onboarding", val: stats.usuarios.total - stats.usuarios.onboardingConcluido },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "#7a63b5" }}>{label}</span>
                        <span className="text-sm font-bold" style={{ color: "#d4c8ff" }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={14} style={{ color: PURPLE }} />
                    <span className="text-xs font-bold tracking-wider uppercase" style={{ color: PURPLE }}>Conteúdos</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Total criados", val: stats.conteudos.total },
                      { label: "Gerados por IA", val: stats.conteudos.geradosIA },
                      { label: "Com roteiro", val: stats.conteudos.comRoteiro },
                      { label: "Publicados", val: stats.conteudos.publicados },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "#7a63b5" }}>{label}</span>
                        <span className="text-sm font-bold" style={{ color: "#d4c8ff" }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* IA Status */}
              <div className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                <div className="flex items-center gap-2 mb-4">
                  <Cpu size={14} style={{ color: PURPLE }} />
                  <span className="text-xs font-bold tracking-wider uppercase" style={{ color: PURPLE }}>Inteligência Artificial</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs" style={{ color: "#7a63b5" }}>Total de chamadas</span>
                    <div className="text-lg font-bold mt-0.5" style={{ color: "#d4c8ff" }}>{stats.ia.totalLogs}</div>
                  </div>
                  <div>
                    <span className="text-xs" style={{ color: "#7a63b5" }}>Framework ativo</span>
                    <div className="mt-0.5">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(139,116,200,0.2)", color: "#c4b5fd" }}>{stats.ia.frameworkAtivo}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs" style={{ color: "#7a63b5" }}>Provedores ativos</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {stats.ia.provedoresAtivos.length > 0 ? stats.ia.provedoresAtivos.map((p) => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(110,231,183,0.1)", color: "#6ee7b7", border: "1px solid rgba(110,231,183,0.2)" }}>{p}</span>
                      )) : (
                        <span className="text-[10px]" style={{ color: "#5d4a9c" }}>Nenhum configurado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Atividade recente IA */}
              {stats.recenteIA.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={14} style={{ color: PURPLE }} />
                    <span className="text-xs font-bold tracking-wider uppercase" style={{ color: PURPLE }}>Última atividade IA</span>
                  </div>
                  <div className="space-y-2">
                    {stats.recenteIA.map((log, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {log.sucesso
                          ? <CheckCircle2 size={12} style={{ color: "#6ee7b7" }} />
                          : <ShieldAlert size={12} style={{ color: "#f06080" }} />}
                        <span className="text-xs flex-1" style={{ color: "#9b80d4" }}>{log.funcionalidade}</span>
                        <span className="text-[10px]" style={{ color: "#5d4a9c" }}>{log.provedor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Objeções e Tendências */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Objeções", valor: stats.objecoes, sub: "cadastradas", icon: ShieldAlert, cor: "#f06080" },
                  { label: "Tendências", valor: stats.tendencias, sub: "identificadas", icon: Radar, cor: "#6ee7b7" },
                ].map(({ label, valor, sub, icon: Icon, cor }) => (
                  <div key={label} className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium" style={{ color: "#7a63b5" }}>{label}</span>
                      <Icon size={14} style={{ color: cor }} />
                    </div>
                    <div className="text-3xl font-bold" style={{ color: "#f0ecff", fontFamily: "var(--font-syne, inherit)" }}>{valor}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "#5d4a9c" }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Planos */}
              <div className="rounded-xl p-4" style={{ background: "rgba(200,217,42,0.05)", border: "1px solid rgba(200,217,42,0.15)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={14} style={{ color: "#c8d92a" }} />
                  <span className="text-xs font-bold tracking-wider uppercase" style={{ color: "#c8d92a" }}>Planos & Comercialização</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded ml-auto" style={{ background: "rgba(200,217,42,0.1)", color: "#c8d92a", border: "1px solid rgba(200,217,42,0.2)" }}>Em preparação</span>
                </div>
                <p className="text-xs" style={{ color: "#6a8f30" }}>
                  Arquitetura preparada para planos free, premium e business. Nenhuma funcionalidade bloqueada — fase de validação ativa.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Plano Free", "Plano Pro", "Plano Business", "Bloqueio por plano", "Upgrades"].map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(200,217,42,0.08)", color: "#8faa10", border: "1px solid rgba(200,217,42,0.15)" }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center" style={{ color: "#5d4a9c" }}>Erro ao carregar métricas.</p>
          )}
        </div>
      </main>
    </div>
  );
}
