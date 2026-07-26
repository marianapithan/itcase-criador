"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, Loader2 } from "lucide-react";
import { CONFIG } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro ?? "Email não autorizado.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Erro ao conectar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-900 mb-4">
            <Sparkles size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{CONFIG.nome}</h1>
          <p className="text-sm text-gray-500 mt-1">{CONFIG.tagline}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Bem-vinda de volta</h2>
          <p className="text-xs text-gray-500 mb-6">Digite seu email para acessar.</p>

          <form onSubmit={entrar} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
                />
              </div>
            </div>

            {erro && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando || !email || !senha}
              className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {carregando ? <Loader2 size={15} className="animate-spin" /> : null}
              {carregando ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-400 mt-6">
          Acesso restrito ao time {CONFIG.nome}.
        </p>
        <p className="text-center text-[10px] text-gray-300 mt-1">
          powered by <span className="font-semibold">cr<span className="text-gray-400">IA</span>dor</span>
        </p>
      </div>
    </div>
  );
}
