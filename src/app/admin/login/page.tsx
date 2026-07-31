"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
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
        setErro(data.erro ?? "Email ou senha incorretos.");
        return;
      }
      if (data.role !== "admin") {
        setErro("Acesso não autorizado ao painel de administração.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setErro("Erro ao conectar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #0f0520 100%)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: "linear-gradient(135deg, #8B74C8, #5d4a9c)", boxShadow: "0 0 32px rgba(139,116,200,0.4)" }}
          >
            <Shield size={24} style={{ color: "#f0ecff" }} />
          </div>
          <h1
            className="text-2xl font-bold leading-tight"
            style={{ color: "#f0ecff", fontFamily: "var(--font-syne, inherit)" }}
          >
            Cria Para Mim
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9b80d4" }}>Painel de Administração</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(139,116,200,0.08)", border: "1px solid rgba(139,116,200,0.2)" }}
        >
          <h2 className="text-base font-semibold mb-1" style={{ color: "#f0ecff", fontFamily: "var(--font-syne, inherit)" }}>
            Acesso restrito
          </h2>
          <p className="text-xs mb-6" style={{ color: "#7a63b5" }}>
            Exclusivo para o administrador master da plataforma.
          </p>

          <form onSubmit={entrar} className="space-y-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#9b80d4" }}>Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5d4a9c" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none transition"
                  style={{ background: "rgba(15,5,32,0.6)", color: "#f0ecff", border: "1px solid #3d2b6b" }}
                  onFocus={(e) => (e.target.style.borderColor = "#8B74C8")}
                  onBlur={(e) => (e.target.style.borderColor = "#3d2b6b")}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#9b80d4" }}>Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5d4a9c" }} />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none transition"
                  style={{ background: "rgba(15,5,32,0.6)", color: "#f0ecff", border: "1px solid #3d2b6b" }}
                  onFocus={(e) => (e.target.style.borderColor = "#8B74C8")}
                  onBlur={(e) => (e.target.style.borderColor = "#3d2b6b")}
                />
              </div>
            </div>

            {erro && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#f06080", background: "rgba(240,96,128,0.1)", border: "1px solid rgba(240,96,128,0.2)" }}>
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando || !email || !senha}
              className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #8B74C8, #6d58aa)", color: "#f0ecff", fontFamily: "var(--font-syne, inherit)" }}
            >
              {carregando ? <Loader2 size={15} className="animate-spin" /> : <Shield size={14} />}
              {carregando ? "Verificando…" : "Acessar painel"}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] mt-6" style={{ color: "#3d2b6b" }}>
          Acesso exclusivo ao administrador master
        </p>
      </div>
    </div>
  );
}
