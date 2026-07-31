"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, Brain, ArrowRight, X } from "lucide-react";

export function PersonaBanner() {
  const [mostrar, setMostrar] = useState(false);
  const [dispensadoAgora, setDispensadoAgora] = useState(false);
  const path = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Reseta o dispensado a cada mudança de rota
    setDispensadoAgora(false);

    if (path === "/persona") { setMostrar(false); return; }

    fetch("/api/persona/status")
      .then(r => r.json())
      .then(d => { if (d && !d.completa) setMostrar(true); })
      .catch(() => {});
  }, [path]);

  if (!mostrar || dispensadoAgora || path === "/persona") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#122a1d", border: "1px solid #1e4535", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

        {/* Topo */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid #1e4535" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #9b8fd4, #6b58a5)" }}>
                <Brain size={18} style={{ color: "#fff" }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#9b8fd4" }}>Cria Para Mim</p>
                <p className="text-sm font-bold" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
                  Sua Persona ainda não foi criada
                </p>
              </div>
            </div>
            {/* Fechar apenas para esta página — volta na próxima navegação */}
            <button onClick={() => setDispensadoAgora(true)}
              className="opacity-40 hover:opacity-70 transition-opacity"
              style={{ color: "#e4f0de" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Corpo */}
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed mb-2" style={{ color: "#8ab89a" }}>
            A <strong style={{ color: "#e4f0de" }}>Persona</strong> é o coração da IA. Sem ela, todo o conteúdo gerado é genérico.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#8ab89a" }}>
            Com ela, a IA fala no seu tom, para o seu público, com os seus argumentos de venda.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {["Tom de voz único", "Público definido", "Conteúdo estratégico"].map(item => (
              <div key={item} className="rounded-lg p-2.5 text-center"
                style={{ background: "rgba(155,143,212,0.1)", border: "1px solid rgba(155,143,212,0.2)" }}>
                <p className="text-[11px] font-medium" style={{ color: "#c8bfff" }}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Botão */}
        <div className="px-6 pb-6">
          <button
            onClick={() => router.push("/persona")}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{ background: "linear-gradient(135deg, #9b8fd4, #6b58a5)", color: "#fff", fontFamily: "var(--font-syne, inherit)" }}>
            <Sparkles size={15} />
            Criar minha Persona agora
            <ArrowRight size={15} />
          </button>
          <button onClick={() => setDispensadoAgora(true)}
            className="w-full mt-2 py-2 text-xs transition-opacity hover:opacity-70"
            style={{ color: "#4a7055" }}>
            Fazer depois (aparecerá novamente)
          </button>
        </div>
      </div>
    </div>
  );
}
