"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, Eye, EyeOff, Check, User, Cpu, Camera, AtSign, Phone, Calendar, Building2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

type ConfigIA = {
  id: string; provedor: string; ativo: boolean; prioridade: number;
  modeloPrincipal?: string; statusTeste?: string; ultimoTeste?: string;
};

type Perfil = {
  nome: string; email: string; nomeEmpresa: string;
  instagramHandle: string; tiktokHandle: string;
  dataNascimento: string; whatsapp: string;
};

const PROVEDORES = [
  {
    id: "anthropic", nome: "Anthropic (Claude)",
    modelos: ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
    varEnv: "ANTHROPIC_API_KEY",
    gratuito: false,
    creditos: "Sim — mínimo de US$ 5 para começar.",
    passos: [
      "Acesse console.anthropic.com e crie sua conta",
      'Vá em "Billing" → "Add credits" e compre o mínimo (US$ 5)',
      'Vá em "API Keys" → "Create Key", dê um nome e copie a chave',
      'Cole a chave no campo abaixo e clique em Salvar',
    ],
  },
  {
    id: "openai", nome: "OpenAI (ChatGPT)",
    modelos: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    varEnv: "OPENAI_API_KEY",
    gratuito: false,
    creditos: "Sim — mínimo de US$ 5 para começar.",
    passos: [
      "Acesse platform.openai.com e crie sua conta",
      'Vá em "Billing" → "Add to credit balance" e compre créditos (mín. US$ 5)',
      'Vá em "API Keys" → "Create new secret key", copie a chave',
      'Cole a chave no campo abaixo e clique em Salvar',
    ],
  },
  {
    id: "gemini", nome: "Google Gemini",
    modelos: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    varEnv: "GEMINI_API_KEY",
    gratuito: true,
    creditos: "Não — tem plano gratuito generoso para começar.",
    passos: [
      "Acesse aistudio.google.com e faça login com sua conta Google",
      'Clique em "Get API Key" → "Create API Key in new project"',
      "Copie a chave gerada (começa com AIza...)",
      'Cole a chave no campo abaixo e clique em Salvar',
      "Para uso intenso: acesse console.cloud.google.com e ative faturamento",
    ],
  },
];

const ABAS = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "ia",     label: "Integrações de IA", icon: Cpu  },
];

function Campo({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: "var(--muted)" }}>
        <Icon size={12} /> {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none transition";
const inputStyle = { background: "var(--accent)", color: "var(--foreground)", border: "1px solid var(--card-border)" };

export default function ConfigPage() {
  const [aba, setAba] = useState<"perfil" | "ia">("perfil");

  // Perfil
  const [perfil, setPerfil] = useState<Perfil>({ nome: "", email: "", nomeEmpresa: "", instagramHandle: "", tiktokHandle: "", dataNascimento: "", whatsapp: "" });
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [perfilSalvo, setPerfilSalvo] = useState(false);

  // IA
  const [configs, setConfigs] = useState<ConfigIA[]>([]);
  const [testando, setTestando] = useState<string | null>(null);
  const [mostrarChave, setMostrarChave] = useState<Record<string, boolean>>({});
  const [chaves, setChaves] = useState<Record<string, string>>({});
  const [mostrarInstrucoes, setMostrarInstrucoes] = useState<Record<string, boolean>>({});

  async function carregarPerfil() {
    const res = await fetch("/api/perfil");
    if (res.ok) setPerfil(await res.json());
  }

  async function salvarPerfil() {
    setSalvandoPerfil(true);
    await fetch("/api/perfil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(perfil),
    });
    setSalvandoPerfil(false);
    setPerfilSalvo(true);
    setTimeout(() => setPerfilSalvo(false), 2500);
  }

  async function carregarIA() {
    const res = await fetch("/api/config/ia");
    setConfigs(await res.json());
  }

  async function salvarConfig(provedor: string, campos: Partial<ConfigIA>) {
    await fetch(`/api/config/ia/${provedor}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(campos) });
    await carregarIA();
  }

  async function testarConexao(provedor: string) {
    setTestando(provedor);
    try {
      const res = await fetch(`/api/config/ia/${provedor}/testar`, { method: "POST" });
      const data = await res.json();
      await salvarConfig(provedor, { statusTeste: data.sucesso ? "OK" : data.erro });
    } finally { setTestando(null); }
  }

  async function salvarChave(provedor: string) {
    const chave = chaves[provedor];
    if (!chave?.trim()) return;
    await fetch(`/api/config/ia/${provedor}/chave`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chave }) });
    setChaves(p => ({ ...p, [provedor]: "" }));
    alert(`Chave da ${provedor} salva! Reinicie o servidor para ativar.`);
  }

  useEffect(() => { carregarPerfil(); carregarIA(); }, []);

  const getConfig = (provedor: string) => configs.find(c => c.provedor === provedor);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-syne, inherit)" }}>Configurações</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Seu perfil e integrações de IA</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "var(--accent)", border: "1px solid var(--card-border)" }}>
        {ABAS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setAba(id as "perfil" | "ia")}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all"
            style={{
              background: aba === id ? "var(--card-bg)" : "transparent",
              color: aba === id ? "var(--foreground)" : "var(--muted)",
              boxShadow: aba === id ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── ABA PERFIL ── */}
      {aba === "perfil" && (
        <div className="rounded-2xl p-6 space-y-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Campo label="Seu nome" icon={User}>
              <input type="text" value={perfil.nome}
                onChange={e => setPerfil(p => ({ ...p, nome: e.target.value }))}
                placeholder="Como você se chama"
                className={inputCls} style={inputStyle} />
            </Campo>

            <Campo label="Nome da empresa" icon={Building2}>
              <input type="text" value={perfil.nomeEmpresa}
                onChange={e => setPerfil(p => ({ ...p, nomeEmpresa: e.target.value }))}
                placeholder="Nome do seu negócio ou marca"
                className={inputCls} style={inputStyle} />
            </Campo>

            <Campo label="Perfil do Instagram" icon={Camera}>
              <input type="text" value={perfil.instagramHandle}
                onChange={e => setPerfil(p => ({ ...p, instagramHandle: e.target.value }))}
                placeholder="@instagram"
                className={inputCls} style={inputStyle} />
            </Campo>

            <Campo label="Perfil do TikTok" icon={AtSign}>
              <input type="text" value={perfil.tiktokHandle}
                onChange={e => setPerfil(p => ({ ...p, tiktokHandle: e.target.value }))}
                placeholder="@tiktok"
                className={inputCls} style={inputStyle} />
            </Campo>

            <Campo label="WhatsApp" icon={Phone}>
              <input type="tel" value={perfil.whatsapp}
                onChange={e => setPerfil(p => ({ ...p, whatsapp: e.target.value }))}
                placeholder="(00) 00000-0000"
                className={inputCls} style={inputStyle} />
            </Campo>

            <Campo label="Data de nascimento" icon={Calendar}>
              <input type="date" value={perfil.dataNascimento}
                onChange={e => setPerfil(p => ({ ...p, dataNascimento: e.target.value }))}
                className={inputCls} style={{ ...inputStyle, colorScheme: "dark" }} />
            </Campo>
          </div>

          <div className="pt-2">
            <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
              Email: <span style={{ color: "var(--foreground)" }}>{perfil.email}</span>
              <span className="ml-2 opacity-50">(não é possível alterar)</span>
            </p>
            <button onClick={salvarPerfil} disabled={salvandoPerfil}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
              style={{ background: "#c8d92a", color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)" }}>
              {salvandoPerfil ? <Loader2 size={14} className="animate-spin" /> : perfilSalvo ? <Check size={14} /> : null}
              {perfilSalvo ? "Salvo!" : "Salvar perfil"}
            </button>
          </div>
        </div>
      )}

      {/* ── ABA IA ── */}
      {aba === "ia" && (
        <div className="space-y-4">
          {PROVEDORES.map((p) => {
            const config = getConfig(p.id);
            const testOk   = config?.statusTeste === "OK";
            const testFail = config?.statusTeste && config.statusTeste !== "OK";

            return (
              <div key={p.id} className="rounded-2xl p-5" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{p.nome}</div>
                    <div className="text-xs font-mono" style={{ color: "var(--muted)" }}>{p.varEnv}</div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{config?.ativo ? "Ativo" : "Inativo"}</span>
                    <div onClick={() => salvarConfig(p.id, { ativo: !config?.ativo })}
                      className="w-9 h-5 rounded-full transition-colors cursor-pointer relative"
                      style={{ background: config?.ativo ? "#c8d92a" : "var(--accent)" }}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${config?.ativo ? "translate-x-4" : "translate-x-0.5"}`} />
                    </div>
                  </label>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {testando === p.id ? (
                    <><Loader2 size={13} className="animate-spin" style={{ color: "var(--muted)" }} /><span className="text-xs" style={{ color: "var(--muted)" }}>Testando…</span></>
                  ) : testOk ? (
                    <><CheckCircle size={13} className="text-green-500" /><span className="text-xs text-green-500">Conexão OK</span></>
                  ) : testFail ? (
                    <><XCircle size={13} className="text-red-400" /><span className="text-xs text-red-400 truncate max-w-xs">{config.statusTeste}</span></>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--muted)" }}>Não testado</span>
                  )}
                  <button onClick={() => testarConexao(p.id)} disabled={testando === p.id}
                    className="ml-auto text-xs disabled:opacity-40" style={{ color: "#9b8fd4" }}>
                    Testar conexão
                  </button>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted)" }}>Modelo principal</label>
                  <select value={config?.modeloPrincipal ?? p.modelos[0]}
                    onChange={e => salvarConfig(p.id, { modeloPrincipal: e.target.value })}
                    className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
                    style={{ background: "var(--accent)", color: "var(--foreground)", border: "1px solid var(--card-border)" }}>
                    {p.modelos.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted)" }}>Ordem de uso (quem tentamos primeiro?)</label>
                  <select value={config?.prioridade ?? 1}
                    onChange={e => salvarConfig(p.id, { prioridade: Number(e.target.value) })}
                    className="w-full text-sm rounded-xl px-3 py-2 focus:outline-none"
                    style={{ background: "var(--accent)", color: "var(--foreground)", border: "1px solid var(--card-border)" }}>
                    <option value={1}>1ª opção — usar primeiro</option>
                    <option value={2}>2ª opção — usar se a 1ª falhar</option>
                    <option value={3}>3ª opção — usar se as outras falharem</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted)" }}>Chave de API</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type={mostrarChave[p.id] ? "text" : "password"}
                        value={chaves[p.id] ?? ""}
                        onChange={e => setChaves(prev => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="Cole sua chave aqui"
                        className="w-full text-sm rounded-xl px-3 pr-9 py-2 focus:outline-none font-mono"
                        style={{ background: "var(--accent)", color: "var(--foreground)", border: "1px solid var(--card-border)" }} />
                      <button type="button"
                        onClick={() => setMostrarChave(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
                        {mostrarChave[p.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button onClick={() => salvarChave(p.id)} disabled={!chaves[p.id]?.trim()}
                      className="text-sm px-4 py-2 rounded-xl disabled:opacity-40 transition-colors"
                      style={{ background: "var(--accent)", color: "var(--foreground)", border: "1px solid var(--card-border)" }}>
                      Salvar
                    </button>
                  </div>
                </div>

                {/* Bloco de instruções expansível */}
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--card-border)" }}>
                  <button
                    onClick={() => setMostrarInstrucoes(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                    className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                    style={{ background: "var(--accent)" }}
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink size={12} style={{ color: "var(--muted)" }} />
                      <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                        Como obter a chave e comprar créditos
                      </span>
                      {p.gratuito && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(200,217,42,0.15)", color: "#c8d92a", border: "1px solid rgba(200,217,42,0.3)" }}>
                          GRATUITO
                        </span>
                      )}
                    </div>
                    {mostrarInstrucoes[p.id] ? <ChevronUp size={13} style={{ color: "var(--muted)" }} /> : <ChevronDown size={13} style={{ color: "var(--muted)" }} />}
                  </button>

                  {mostrarInstrucoes[p.id] && (
                    <div className="px-4 py-4" style={{ background: "rgba(0,0,0,0.15)", borderTop: "1px solid var(--card-border)" }}>
                      <p className="text-xs mb-3 flex items-start gap-1.5 flex-wrap" style={{ color: "var(--muted)" }}>
                        <span className="font-medium" style={{ color: "var(--foreground)" }}>Precisa comprar créditos?</span>
                        <span className="font-medium" style={{ color: p.gratuito ? "var(--success)" : "var(--warning)" }}>{p.creditos}</span>
                      </p>
                      <ol className="space-y-2">
                        {p.passos.map((passo, i) => (
                          <li key={i} className="flex gap-3 text-xs" style={{ color: "var(--muted)" }}>
                            <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                              style={{ background: "rgba(155,143,212,0.2)", color: "#9b8fd4" }}>
                              {i + 1}
                            </span>
                            <span className="leading-relaxed pt-0.5">{passo}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="p-4 rounded-xl text-xs" style={{ background: "var(--accent)", border: "1px solid var(--card-border)", color: "var(--muted)" }}>
            <p className="font-medium mb-1" style={{ color: "var(--foreground)" }}>Como funciona o fallback automático</p>
            <p>Se o provedor de maior prioridade falhar, o sistema tenta automaticamente o próximo na ordem. Configure a prioridade para controlar a ordem.</p>
          </div>
        </div>
      )}
    </div>
  );
}
