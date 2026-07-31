"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, LayoutDashboard, LogOut, Users, ExternalLink, Search,
  ArrowUpDown, RefreshCw, UserCheck, UserX, Cpu, FileText,
  ChevronUp, ChevronDown, LogIn,
} from "lucide-react";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  nomeEmpresa: string | null;
  instagramHandle: string | null;
  whatsapp: string | null;
  perfilTipo: string | null;
  segmento: string | null;
  faseDigital: string | null;
  role: string;
  onboardingConcluido: boolean;
  criadoEm: string;
  conteudos: number;
  publicados: number;
  iaLogs: number;
  ultimaAtividade: string | null;
};

const PURPLE = "#8B74C8";
const PURPLE_BG = "rgba(139,116,200,0.07)";
const PURPLE_BORDER = "rgba(139,116,200,0.15)";

type Ordenacao = { campo: keyof Usuario; dir: "asc" | "desc" };

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

function iniciais(nome: string) {
  return nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function fmtData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function fmtDataRelativa(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const dias = Math.floor(diff / 86400000);
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `${dias}d atrás`;
  if (dias < 30) return `${Math.floor(dias / 7)}sem`;
  return fmtData(iso);
}

const AVATAR_CORES = [
  "#7c3aed", "#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777",
];
function corAvatar(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return AVATAR_CORES[Math.abs(h) % AVATAR_CORES.length];
}

export default function AdminUsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>({ campo: "criadoEm", dir: "desc" });
  const [impersonando, setImpersonando] = useState<string | null>(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setCarregando(true);
    try {
      const r = await fetch("/api/admin/usuarios");
      if (r.status === 403) { router.push("/admin/login"); return; }
      setUsuarios(await r.json());
    } finally {
      setCarregando(false);
    }
  }

  async function impersionar(u: Usuario) {
    setImpersonando(u.id);
    try {
      const r = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id }),
      });
      if (r.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setImpersonando(null);
    }
  }

  function alternarOrdem(campo: keyof Usuario) {
    setOrdenacao(o =>
      o.campo === campo ? { campo, dir: o.dir === "asc" ? "desc" : "asc" } : { campo, dir: "desc" }
    );
  }

  const lista = useMemo(() => {
    let result = usuarios.filter(u =>
      !busca ||
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()) ||
      (u.nomeEmpresa ?? "").toLowerCase().includes(busca.toLowerCase()) ||
      (u.segmento ?? "").toLowerCase().includes(busca.toLowerCase())
    );
    result = [...result].sort((a, b) => {
      const av = a[ordenacao.campo] ?? "";
      const bv = b[ordenacao.campo] ?? "";
      const cmp = String(av) < String(bv) ? -1 : String(av) > String(bv) ? 1 : 0;
      return ordenacao.dir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [usuarios, busca, ordenacao]);

  function TH({ campo, label }: { campo: keyof Usuario; label: string }) {
    const ativo = ordenacao.campo === campo;
    return (
      <th
        className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap"
        style={{ color: ativo ? "#c4b5fd" : "#5d4a9c" }}
        onClick={() => alternarOrdem(campo)}
      >
        <span className="flex items-center gap-1">
          {label}
          {ativo
            ? ordenacao.dir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />
            : <ArrowUpDown size={9} style={{ opacity: 0.4 }} />}
        </span>
      </th>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #1a0533 0%, #0f0520 100%)" }}>
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: PURPLE }}>· CRM de Usuários</p>
              <h1 className="text-2xl font-bold" style={{ color: "#f0ecff", fontFamily: "var(--font-syne, inherit)" }}>
                Contas Cadastradas
              </h1>
              <p className="text-sm mt-1" style={{ color: "#7a63b5" }}>
                {carregando ? "Carregando…" : `${usuarios.length} usuário${usuarios.length !== 1 ? "s" : ""} no total`}
              </p>
            </div>
            <button
              onClick={carregar}
              disabled={carregando}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"
              style={{ background: "rgba(139,116,200,0.1)", color: "#9b80d4", border: `1px solid ${PURPLE_BORDER}` }}
            >
              <RefreshCw size={12} className={carregando ? "animate-spin" : ""} />
              Atualizar
            </button>
          </div>

          {/* Resumo rápido */}
          {!carregando && usuarios.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total", val: usuarios.length, icon: Users, cor: "#a78bfa" },
                { label: "Onboarding OK", val: usuarios.filter(u => u.onboardingConcluido).length, icon: UserCheck, cor: "#6ee7b7" },
                { label: "Sem onboarding", val: usuarios.filter(u => !u.onboardingConcluido).length, icon: UserX, cor: "#f06080" },
                { label: "Com IA ativa", val: usuarios.filter(u => u.iaLogs > 0).length, icon: Cpu, cor: "#c8d92a" },
              ].map(({ label, val, icon: Icon, cor }) => (
                <div key={label} className="rounded-xl p-3" style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium" style={{ color: "#7a63b5" }}>{label}</span>
                    <Icon size={12} style={{ color: cor }} />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: "#f0ecff", fontFamily: "var(--font-syne, inherit)" }}>{val}</div>
                </div>
              ))}
            </div>
          )}

          {/* Busca */}
          <div className="relative mb-4">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5d4a9c" }} />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, email, empresa ou segmento…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: PURPLE_BG, border: `1px solid ${PURPLE_BORDER}`, color: "#d4c8ff" }}
            />
          </div>

          {/* Tabela */}
          {carregando ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={24} className="animate-spin" style={{ color: PURPLE }} />
            </div>
          ) : lista.length === 0 ? (
            <div className="text-center py-16" style={{ color: "#5d4a9c" }}>
              {busca ? "Nenhum usuário encontrado para esta busca." : "Nenhum usuário cadastrado ainda."}
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${PURPLE_BORDER}` }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(139,116,200,0.1)", borderBottom: `1px solid ${PURPLE_BORDER}` }}>
                      <TH campo="nome" label="Usuário" />
                      <TH campo="nomeEmpresa" label="Empresa" />
                      <TH campo="segmento" label="Segmento" />
                      <TH campo="conteudos" label="Conteúdos" />
                      <TH campo="publicados" label="Publicados" />
                      <TH campo="iaLogs" label="IA calls" />
                      <TH campo="ultimaAtividade" label="Última ativ." />
                      <TH campo="criadoEm" label="Cadastro" />
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {lista.map((u, i) => (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: i < lista.length - 1 ? `1px solid rgba(139,116,200,0.08)` : "none",
                          background: i % 2 === 0 ? "transparent" : "rgba(139,116,200,0.03)",
                        }}
                      >
                        {/* Usuário */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ background: corAvatar(u.id), color: "white" }}
                            >
                              {iniciais(u.nome)}
                            </div>
                            <div>
                              <a
                                href={`/admin/usuarios/${u.id}`}
                                className="font-medium hover:underline block"
                                style={{ color: "#d4c8ff" }}
                              >
                                {u.nome}
                              </a>
                              <span className="text-[10px]" style={{ color: "#5d4a9c" }}>{u.email}</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                {u.onboardingConcluido
                                  ? <span className="text-[9px] px-1.5 py-px rounded" style={{ background: "rgba(110,231,183,0.1)", color: "#6ee7b7" }}>Ativo</span>
                                  : <span className="text-[9px] px-1.5 py-px rounded" style={{ background: "rgba(240,96,128,0.1)", color: "#f06080" }}>Onboarding</span>}
                                {u.instagramHandle && (
                                  <span className="text-[9px]" style={{ color: "#5d4a9c" }}>@{u.instagramHandle}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Empresa */}
                        <td className="px-3 py-3">
                          <span className="text-xs" style={{ color: u.nomeEmpresa ? "#9b80d4" : "#3d2f6e" }}>
                            {u.nomeEmpresa ?? "—"}
                          </span>
                        </td>

                        {/* Segmento */}
                        <td className="px-3 py-3">
                          <span className="text-[10px]" style={{ color: u.segmento ? "#9b80d4" : "#3d2f6e" }}>
                            {u.segmento ?? "—"}
                          </span>
                        </td>

                        {/* Conteúdos */}
                        <td className="px-3 py-3 text-center">
                          <span className="text-sm font-bold" style={{ color: u.conteudos > 0 ? "#d4c8ff" : "#3d2f6e" }}>
                            {u.conteudos}
                          </span>
                        </td>

                        {/* Publicados */}
                        <td className="px-3 py-3 text-center">
                          <span className="text-sm font-bold" style={{ color: u.publicados > 0 ? "#c8d92a" : "#3d2f6e" }}>
                            {u.publicados}
                          </span>
                        </td>

                        {/* IA calls */}
                        <td className="px-3 py-3 text-center">
                          <span className="text-sm font-bold" style={{ color: u.iaLogs > 0 ? "#6ee7b7" : "#3d2f6e" }}>
                            {u.iaLogs}
                          </span>
                        </td>

                        {/* Última atividade */}
                        <td className="px-3 py-3">
                          <span className="text-[10px]" style={{ color: "#7a63b5" }}>
                            {fmtDataRelativa(u.ultimaAtividade)}
                          </span>
                        </td>

                        {/* Cadastro */}
                        <td className="px-3 py-3">
                          <span className="text-[10px]" style={{ color: "#5d4a9c" }}>
                            {fmtData(u.criadoEm)}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`/admin/usuarios/${u.id}`}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-opacity hover:opacity-80"
                              style={{ background: "rgba(139,116,200,0.15)", color: "#c4b5fd" }}
                            >
                              <FileText size={9} />
                              Ver
                            </a>
                            <button
                              onClick={() => impersionar(u)}
                              disabled={impersonando === u.id}
                              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-opacity hover:opacity-80"
                              style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}
                            >
                              {impersonando === u.id
                                ? <RefreshCw size={9} className="animate-spin" />
                                : <LogIn size={9} />}
                              Acessar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
