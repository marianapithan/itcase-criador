"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Shield, LayoutDashboard, LogOut, Users, ExternalLink, RefreshCw,
  ArrowLeft, Phone, Building, Cpu, FileText,
  CheckCircle2, ShieldAlert, LogIn, Globe,
} from "lucide-react";

type Conteudo = { id: string; titulo: string; status: string; formato: string; criadoEm: string };
type LogIA = { funcionalidade: string; provedor: string; sucesso: boolean; criadoEm: string };
type ConfigIA = { provedor: string; ativo: boolean };

type Detalhe = {
  user: {
    id: string; nome: string; email: string;
    nomeEmpresa: string | null; instagramHandle: string | null;
    tiktokHandle: string | null; whatsapp: string | null;
    dataNascimento: string | null; perfilTipo: string | null;
    segmento: string | null; faseDigital: string | null;
    role: string; onboardingConcluido: boolean;
    criadoEm: string; atualizadoEm: string;
  };
  metrics: { totalConteudos: number; totalPublicados: number; totalIA: number; totalTemas: number; totalMembros: number };
  conteudosRecentes: Conteudo[];
  logsIARecentes: LogIA[];
  configIA: ConfigIA[];
  membros: { id: string; nome: string; cor: string }[];
};

const PURPLE = "#8B74C8";
const PURPLE_BG = "rgba(139,116,200,0.07)";
const PURPLE_BORDER = "rgba(139,116,200,0.15)";

function AdminSidebar() {
  const router = useRouter();
  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
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
        {[
          { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
          { label: "Usuários", icon: Users, href: "/admin/usuarios", active: true },
        ].map(({ label, icon: Icon, href, active }) => (
          <a key={label} href={href} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm"
            style={active ? { background: "rgba(139,116,200,0.2)", color: "#d4c8ff" } : { color: "#7a63b5" }}>
            <Icon size={14} />{label}
          </a>
        ))}
      </nav>
      <div className="px-2 py-3" style={{ borderTop: `1px solid ${PURPLE_BORDER}` }}>
        <a href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md text-xs mb-1" style={{ color: "#7a63b5" }}>
          <ExternalLink size={12} />Ver app
        </a>
        <button onClick={sair} className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs"
          style={{ color: "#7a63b5" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#f06080"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#7a63b5"; }}>
          <LogOut size={12} />Sair
        </button>
      </div>
    </aside>
  );
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtDataCurta(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function iniciais(nome: string) {
  return nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

const STATUS_COR: Record<string, string> = {
  PUBLICADO: "#c8d92a", APROVADO: "#c8d92a", IDEIA: "#6B7280",
  EM_EDICAO: "#fbbf24", PRONTO_PUBLICAR: "#6ee7b7", GERADO_IA: "#9b8fd4",
  DESCARTADO: "#f06080",
};

export default function UsuarioDetalhe() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [detalhe, setDetalhe] = useState<Detalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [impersonando, setImpersonando] = useState(false);

  useEffect(() => { carregar(); }, [id]);

  async function carregar() {
    setCarregando(true);
    try {
      const r = await fetch(`/api/admin/usuarios/${id}`);
      if (r.status === 403) { router.push("/admin/login"); return; }
      if (!r.ok) { router.push("/admin/usuarios"); return; }
      setDetalhe(await r.json());
    } finally {
      setCarregando(false);
    }
  }

  async function impersionar() {
    setImpersonando(true);
    try {
      const r = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      if (r.ok) { router.push("/dashboard"); router.refresh(); }
    } finally {
      setImpersonando(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #1a0533 0%, #0f0520 100%)" }}>
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <a href="/admin/usuarios" className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70" style={{ color: "#7a63b5" }}>
              <ArrowLeft size={13} />Usuários
            </a>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin" style={{ color: PURPLE }} />
            </div>
          ) : !detalhe ? (
            <p style={{ color: "#5d4a9c" }}>Usuário não encontrado.</p>
          ) : (
            <div className="space-y-5">
              {/* Cabeçalho do usuário */}
              <div className="rounded-xl p-5" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                      style={{ background: "#7c3aed", color: "white" }}
                    >
                      {iniciais(detalhe.user.nome)}
                    </div>
                    <div>
                      <h1 className="text-xl font-bold" style={{ color: "#f0ecff", fontFamily: "var(--font-syne, inherit)" }}>
                        {detalhe.user.nome}
                      </h1>
                      <p className="text-sm mt-0.5" style={{ color: "#7a63b5" }}>{detalhe.user.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {detalhe.user.onboardingConcluido
                          ? <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(110,231,183,0.1)", color: "#6ee7b7", border: "1px solid rgba(110,231,183,0.2)" }}>Ativo</span>
                          : <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(240,96,128,0.1)", color: "#f06080", border: "1px solid rgba(240,96,128,0.2)" }}>Onboarding pendente</span>}
                        {detalhe.user.role === "admin" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(139,116,200,0.2)", color: "#c4b5fd" }}>Admin</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={impersionar}
                    disabled={impersonando}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium shrink-0 transition-opacity hover:opacity-80"
                    style={{ background: "#7c3aed", color: "white" }}
                  >
                    {impersonando ? <RefreshCw size={13} className="animate-spin" /> : <LogIn size={13} />}
                    Acessar como este usuário
                  </button>
                </div>
              </div>

              {/* Métricas de engajamento */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Conteúdos", val: detalhe.metrics.totalConteudos, cor: PURPLE },
                  { label: "Publicados", val: detalhe.metrics.totalPublicados, cor: "#c8d92a" },
                  { label: "Chamadas IA", val: detalhe.metrics.totalIA, cor: "#6ee7b7" },
                  { label: "Temas", val: detalhe.metrics.totalTemas, cor: "#fbbf24" },
                  { label: "Equipe", val: detalhe.metrics.totalMembros, cor: "#a78bfa" },
                ].map(({ label, val, cor }) => (
                  <div key={label} className="rounded-xl p-3 text-center" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                    <div className="text-2xl font-bold" style={{ color: cor, fontFamily: "var(--font-syne, inherit)" }}>{val}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#5d4a9c" }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Dados do perfil */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Building size={13} style={{ color: PURPLE }} />
                    <span className="text-xs font-bold tracking-wider uppercase" style={{ color: PURPLE }}>Dados do Cadastro</span>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { label: "Empresa", val: detalhe.user.nomeEmpresa },
                      { label: "Segmento", val: detalhe.user.segmento },
                      { label: "Perfil", val: detalhe.user.perfilTipo },
                      { label: "Fase digital", val: detalhe.user.faseDigital },
                      { label: "Data nasc.", val: detalhe.user.dataNascimento },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex items-start justify-between gap-2">
                        <span className="text-xs shrink-0" style={{ color: "#5d4a9c" }}>{label}</span>
                        <span className="text-xs text-right" style={{ color: val ? "#9b80d4" : "#3d2f6e" }}>{val ?? "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                  <div className="flex items-center gap-2 mb-4">
                    <Globe size={13} style={{ color: PURPLE }} />
                    <span className="text-xs font-bold tracking-wider uppercase" style={{ color: PURPLE }}>Redes & Contato</span>
                  </div>
                  <div className="space-y-2.5">
                    {detalhe.user.instagramHandle && (
                      <div className="flex items-center gap-2">
                        <Globe size={12} style={{ color: "#E23E8C" }} />
                        <span className="text-xs" style={{ color: "#9b80d4" }}>Instagram: @{detalhe.user.instagramHandle}</span>
                      </div>
                    )}
                    {detalhe.user.tiktokHandle && (
                      <div className="flex items-center gap-2">
                        <Globe size={12} style={{ color: "#69C9D0" }} />
                        <span className="text-xs" style={{ color: "#9b80d4" }}>@{detalhe.user.tiktokHandle}</span>
                      </div>
                    )}
                    {detalhe.user.whatsapp && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} style={{ color: "#6ee7b7" }} />
                        <span className="text-xs" style={{ color: "#9b80d4" }}>{detalhe.user.whatsapp}</span>
                      </div>
                    )}
                    {!detalhe.user.instagramHandle && !detalhe.user.tiktokHandle && !detalhe.user.whatsapp && (
                      <p className="text-xs" style={{ color: "#3d2f6e" }}>Nenhuma rede informada</p>
                    )}
                    <div className="pt-2" style={{ borderTop: `1px solid ${PURPLE_BORDER}` }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs" style={{ color: "#5d4a9c" }}>Cadastrado em</span>
                        <span className="text-xs" style={{ color: "#7a63b5" }}>{fmtData(detalhe.user.criadoEm)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs" style={{ color: "#5d4a9c" }}>Atualizado em</span>
                        <span className="text-xs" style={{ color: "#7a63b5" }}>{fmtData(detalhe.user.atualizadoEm)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuração de IA */}
              <div className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Cpu size={13} style={{ color: PURPLE }} />
                  <span className="text-xs font-bold tracking-wider uppercase" style={{ color: PURPLE }}>Configuração de IA</span>
                </div>
                {detalhe.configIA.length === 0 ? (
                  <p className="text-xs" style={{ color: "#3d2f6e" }}>Nenhuma IA configurada.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detalhe.configIA.map((c) => (
                      <span
                        key={c.provedor}
                        className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                        style={c.ativo
                          ? { background: "rgba(110,231,183,0.1)", color: "#6ee7b7", border: "1px solid rgba(110,231,183,0.2)" }
                          : { background: "rgba(139,116,200,0.08)", color: "#5d4a9c", border: `1px solid ${PURPLE_BORDER}` }}
                      >
                        {c.provedor} {c.ativo ? "✓" : "(inativo)"}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Equipe */}
              {detalhe.membros.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                  <div className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: PURPLE }}>Equipe</div>
                  <div className="flex flex-wrap gap-2">
                    {detalhe.membros.map((m) => (
                      <span
                        key={m.id}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                        style={{ background: m.cor + "22", border: `1px solid ${m.cor}44`, color: m.cor }}
                      >
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: m.cor, color: "white" }}>
                          {m.nome[0].toUpperCase()}
                        </span>
                        {m.nome}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Conteúdos recentes */}
              {detalhe.conteudosRecentes.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={13} style={{ color: PURPLE }} />
                    <span className="text-xs font-bold tracking-wider uppercase" style={{ color: PURPLE }}>
                      Conteúdos recentes ({detalhe.metrics.totalConteudos} total)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {detalhe.conteudosRecentes.map((c) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: (STATUS_COR[c.status] ?? "#6B7280") + "22", color: STATUS_COR[c.status] ?? "#6B7280" }}
                        >
                          {c.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs flex-1 truncate" style={{ color: "#9b80d4" }}>{c.titulo || "(sem título)"}</span>
                        <span className="text-[10px] shrink-0" style={{ color: "#5d4a9c" }}>{fmtDataCurta(c.criadoEm)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logs de IA recentes */}
              {detalhe.logsIARecentes.length > 0 && (
                <div className="rounded-xl p-4" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu size={13} style={{ color: PURPLE }} />
                    <span className="text-xs font-bold tracking-wider uppercase" style={{ color: PURPLE }}>
                      Últimas chamadas IA ({detalhe.metrics.totalIA} total)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {detalhe.logsIARecentes.map((log, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {log.sucesso
                          ? <CheckCircle2 size={11} style={{ color: "#6ee7b7" }} />
                          : <ShieldAlert size={11} style={{ color: "#f06080" }} />}
                        <span className="text-xs flex-1" style={{ color: "#9b80d4" }}>{log.funcionalidade}</span>
                        <span className="text-[10px]" style={{ color: "#5d4a9c" }}>{log.provedor}</span>
                        <span className="text-[10px]" style={{ color: "#3d2f6e" }}>{fmtDataCurta(log.criadoEm)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
