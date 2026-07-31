"use client";
import { useState } from "react";
import { Sparkles, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { CONFIG } from "@/lib/config";
import Link from "next/link";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErro(data.erro ?? "Erro ao enviar. Tente novamente.");
        return;
      }
      setEnviado(true);
    } catch {
      setErro("Erro ao conectar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0d2b1e" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: "linear-gradient(135deg, #c8d92a, #9b8fd4)", boxShadow: "0 0 32px rgba(200,217,42,0.3)" }}>
            <Sparkles size={24} style={{ color: "#0d2b1e" }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
            {CONFIG.plataforma}
          </h1>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "#122a1d", border: "1px solid #1e4535" }}>
          {enviado ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle size={40} style={{ color: "#c8d92a" }} />
              </div>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
                Email enviado!
              </h2>
              <p className="text-sm mb-6" style={{ color: "#8ab89a", lineHeight: "1.6" }}>
                Se esse email estiver cadastrado, você receberá um link para redefinir sua senha. Verifique sua caixa de entrada e a pasta de spam.
              </p>
              <Link href="/login"
                className="flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                style={{ color: "#6a9a78" }}>
                <ArrowLeft size={14} /> Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold mb-1" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
                Esqueceu sua senha?
              </h2>
              <p className="text-xs mb-6" style={{ color: "#6a9a78" }}>
                Digite seu email e enviaremos um link para criar uma nova senha.
              </p>

              <form onSubmit={enviar} className="space-y-4">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "#8ab89a" }}>Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4a7055" }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com" required autoFocus
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none transition"
                      style={{ background: "#0a2318", color: "#e4f0de", border: "1px solid #2d5a3d" }}
                      onFocus={e => (e.target.style.borderColor = "#c8d92a")}
                      onBlur={e => (e.target.style.borderColor = "#2d5a3d")} />
                  </div>
                </div>

                {erro && (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#f06080", background: "rgba(240,96,128,0.1)", border: "1px solid rgba(240,96,128,0.2)" }}>
                    {erro}
                  </p>
                )}

                <button type="submit" disabled={carregando || !email}
                  className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  style={{ background: "#c8d92a", color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)" }}>
                  {carregando ? <Loader2 size={15} className="animate-spin" /> : null}
                  {carregando ? "Enviando…" : "Enviar link de redefinição"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/login" className="flex items-center justify-center gap-1.5 text-xs transition-colors" style={{ color: "#4a7055" }}>
                  <ArrowLeft size={12} /> Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
