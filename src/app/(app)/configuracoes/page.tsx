"use client";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";

type ConfigIA = {
  id: string; provedor: string; ativo: boolean; prioridade: number;
  modeloPrincipal?: string; statusTeste?: string; ultimoTeste?: string;
};

const PROVEDORES = [
  {
    id: "anthropic",
    nome: "Anthropic (Claude)",
    modelos: ["claude-sonnet-4-6", "claude-opus-4-8", "claude-haiku-4-5-20251001"],
    varEnv: "ANTHROPIC_API_KEY",
  },
  {
    id: "gemini",
    nome: "Google Gemini",
    modelos: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
    varEnv: "GEMINI_API_KEY",
  },
  {
    id: "openai",
    nome: "OpenAI",
    modelos: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    varEnv: "OPENAI_API_KEY",
  },
];

export default function ConfigPage() {
  const [configs, setConfigs] = useState<ConfigIA[]>([]);
  const [testando, setTestando] = useState<string | null>(null);
  const [mostrarChave, setMostrarChave] = useState<Record<string, boolean>>({});
  const [chaves, setChaves] = useState<Record<string, string>>({});

  async function carregar() {
    const res = await fetch("/api/config/ia");
    setConfigs(await res.json());
  }

  useEffect(() => { carregar(); }, []);

  async function salvarConfig(provedor: string, campos: Partial<ConfigIA>) {
    await fetch(`/api/config/ia/${provedor}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campos),
    });
    await carregar();
  }

  async function testarConexao(provedor: string) {
    setTestando(provedor);
    try {
      const res = await fetch(`/api/config/ia/${provedor}/testar`, { method: "POST" });
      const data = await res.json();
      await salvarConfig(provedor, { statusTeste: data.sucesso ? "OK" : data.erro });
    } finally {
      setTestando(null);
    }
  }

  async function salvarChave(provedor: string) {
    const chave = chaves[provedor];
    if (!chave?.trim()) return;
    await fetch(`/api/config/ia/${provedor}/chave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chave }),
    });
    setChaves((p) => ({ ...p, [provedor]: "" }));
    alert(`Chave da ${provedor} salva! Reinicie o servidor para ativar.`);
  }

  function getConfig(provedor: string) {
    return configs.find((c) => c.provedor === provedor);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Provedores de IA e preferências do studio</p>
      </div>

      <h2 className="text-sm font-semibold text-gray-900 mb-4">Provedores de IA</h2>

      <div className="space-y-4">
        {PROVEDORES.map((p) => {
          const config = getConfig(p.id);
          const testOk = config?.statusTeste === "OK";
          const testFail = config?.statusTeste && config.statusTeste !== "OK";

          return (
            <div key={p.id} className="border border-gray-200 rounded-xl p-5 bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{p.nome}</div>
                    <div className="text-xs text-gray-400">{p.varEnv}</div>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-gray-500">{config?.ativo ? "Ativo" : "Inativo"}</span>
                  <div
                    onClick={() => salvarConfig(p.id, { ativo: !config?.ativo })}
                    className={`w-9 h-5 rounded-full transition-colors cursor-pointer relative ${config?.ativo ? "bg-gray-900" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${config?.ativo ? "translate-x-4" : "translate-x-0.5"}`} />
                  </div>
                </label>
              </div>

              {/* Status do teste */}
              <div className="flex items-center gap-2 mb-4">
                {testando === p.id ? (
                  <><Loader2 size={13} className="animate-spin text-gray-400" /><span className="text-xs text-gray-500">Testando conexão…</span></>
                ) : testOk ? (
                  <><CheckCircle size={13} className="text-green-500" /><span className="text-xs text-green-600">Conexão OK</span></>
                ) : testFail ? (
                  <><XCircle size={13} className="text-red-400" /><span className="text-xs text-red-500 truncate max-w-xs">{config.statusTeste}</span></>
                ) : (
                  <span className="text-xs text-gray-400">Não testado</span>
                )}
                <button
                  onClick={() => testarConexao(p.id)}
                  disabled={testando === p.id}
                  className="ml-auto text-xs text-blue-600 hover:text-blue-700 disabled:opacity-40"
                >
                  Testar conexão
                </button>
              </div>

              {/* Modelo */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Modelo principal</label>
                <select
                  value={config?.modeloPrincipal ?? p.modelos[0]}
                  onChange={(e) => salvarConfig(p.id, { modeloPrincipal: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none bg-white"
                >
                  {p.modelos.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Prioridade */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Prioridade (1 = primeira tentativa)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={config?.prioridade ?? 1}
                  onChange={(e) => salvarConfig(p.id, { prioridade: Number(e.target.value) })}
                  className="w-24 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
                />
              </div>

              {/* Chave */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Chave de API</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={mostrarChave[p.id] ? "text" : "password"}
                      value={chaves[p.id] ?? ""}
                      onChange={(e) => setChaves((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="Cole sua chave aqui"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 pr-9 py-2 focus:outline-none focus:border-gray-400 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarChave((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {mostrarChave[p.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={() => salvarChave(p.id)}
                    disabled={!chaves[p.id]?.trim()}
                    className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors text-gray-700"
                  >
                    Salvar
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  A chave é salva no arquivo <code className="bg-gray-100 px-1 rounded">.env.local</code>. Reinicie o servidor após salvar.
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500">
        <p className="font-medium text-gray-700 mb-1">Como funciona o fallback automático</p>
        <p>Se o provedor de maior prioridade falhar (sem crédito, chave inválida, timeout), o sistema tenta automaticamente o próximo na ordem de prioridade. Configure a prioridade de cada provedor para controlar a ordem.</p>
      </div>
    </div>
  );
}
