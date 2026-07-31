"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, Loader2 } from "lucide-react";
import { CONFIG } from "@/lib/config";
import Link from "next/link";

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
    <div
      className="min-h-screen flex items-center justify-center px-4 grid-bg"
      style={{ background: "#0d2b1e" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: "linear-gradient(135deg, #c8d92a, #9b8fd4)", boxShadow: "0 0 32px rgba(200,217,42,0.3)" }}
          >
            <Sparkles size={24} style={{ color: "#0d2b1e" }} />
          </div>
          <h1
            className="text-2xl font-bold leading-tight"
            style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}
          >
            {CONFIG.plataforma}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6a9a78" }}>{CONFIG.tagline}</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: "#122a1d", border: "1px solid #1e4535" }}
        >
          <h2
            className="text-base font-semibold mb-1"
            style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}
          >
            Bem-vinda de volta
          </h2>
          <p className="text-xs mb-6" style={{ color: "#6a9a78" }}>
            Digite seu email para acessar o estúdio.
          </p>

          <form onSubmit={entrar} className="space-y-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#8ab89a" }}>
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4a7055" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none transition"
                  style={{
                    background: "#0a2318",
                    color: "#e4f0de",
                    border: "1px solid #2d5a3d",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#c8d92a")}
                  onBlur={e => (e.target.style.borderColor = "#2d5a3d")}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#8ab89a" }}>
                Senha
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4a7055" }} />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none transition"
                  style={{
                    background: "#0a2318",
                    color: "#e4f0de",
                    border: "1px solid #2d5a3d",
                  }}
                  onFocus={e => (e.target.style.borderColor = "#c8d92a")}
                  onBlur={e => (e.target.style.borderColor = "#2d5a3d")}
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
              style={{ background: "#c8d92a", color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)" }}
            >
              {carregando ? <Loader2 size={15} className="animate-spin" /> : null}
              {carregando ? "Entrando…" : "Entrar no estúdio"}
            </button>

            <div className="text-center">
              <Link href="/esqueci-senha" className="text-xs transition-colors" style={{ color: "#4a7055" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#6a9a78")}
                onMouseLeave={e => (e.currentTarget.style.color = "#4a7055")}>
                Esqueci minha senha
              </Link>
            </div>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "#4a7055" }}>
          Não tem conta?{" "}
          <Link href="/cadastro" className="underline" style={{ color: "#6a9a78" }}>Criar conta gratuita</Link>
        </p>

        <p className="text-center text-[11px] mt-6" style={{ color: "#4a7055" }}>
          Acesso restrito — plataforma {CONFIG.plataforma}.
        </p>
        <p className="text-center text-[10px] mt-1" style={{ color: "#2d5a3d" }}>
          powered by{" "}
          <span className="font-semibold" style={{ color: "#4a7055" }}>
            {CONFIG.plataforma}
          </span>
        </p>
      </div>
    </div>
  );
}
