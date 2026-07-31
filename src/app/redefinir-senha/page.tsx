"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { CONFIG } from "@/lib/config";
import Link from "next/link";

function RedefinirSenhaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!token) setErro("Link inválido. Solicite um novo.");
  }, [token]);

  async function redefinir(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha !== confirmar) { setErro("As senhas não coincidem."); return; }
    if (senha.length < 6) { setErro("Senha deve ter no mínimo 6 caracteres."); return; }

    setCarregando(true);
    try {
      const res = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, senha }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.erro ?? "Erro ao redefinir. Tente novamente."); return; }
      setSucesso(true);
      setTimeout(() => router.push("/login"), 3000);
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
          {sucesso ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle size={40} style={{ color: "#c8d92a" }} />
              </div>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
                Senha redefinida!
              </h2>
              <p className="text-sm" style={{ color: "#8ab89a" }}>
                Sua senha foi atualizada com sucesso. Redirecionando para o login…
              </p>
            </div>
          ) : !token ? (
            <div className="text-center">
              <AlertCircle size={36} className="mx-auto mb-3" style={{ color: "#f06080" }} />
              <p className="text-sm mb-4" style={{ color: "#f06080" }}>Link inválido ou expirado.</p>
              <Link href="/esqueci-senha" className="text-sm underline" style={{ color: "#6a9a78" }}>
                Solicitar novo link
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold mb-1" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
                Nova senha
              </h2>
              <p className="text-xs mb-6" style={{ color: "#6a9a78" }}>
                Escolha uma senha segura com no mínimo 6 caracteres.
              </p>

              <form onSubmit={redefinir} className="space-y-4">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "#8ab89a" }}>Nova senha</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4a7055" }} />
                    <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres" required autoFocus
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none transition"
                      style={{ background: "#0a2318", color: "#e4f0de", border: "1px solid #2d5a3d" }}
                      onFocus={e => (e.target.style.borderColor = "#c8d92a")}
                      onBlur={e => (e.target.style.borderColor = "#2d5a3d")} />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: "#8ab89a" }}>Confirmar senha</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4a7055" }} />
                    <input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)}
                      placeholder="Digite a senha novamente" required
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

                <button type="submit" disabled={carregando || !senha || !confirmar}
                  className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  style={{ background: "#c8d92a", color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)" }}>
                  {carregando ? <Loader2 size={15} className="animate-spin" /> : null}
                  {carregando ? "Salvando…" : "Salvar nova senha"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0d2b1e", minHeight: "100vh" }} />}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
