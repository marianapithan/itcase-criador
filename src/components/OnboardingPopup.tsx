"use client";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Check, Loader2 } from "lucide-react";

const PASSOS = [
  {
    titulo: "Qual é o seu perfil?",
    subtitulo: "Isso nos ajuda a personalizar a IA para o seu negócio.",
    campo: "perfilTipo",
    opcoes: [
      { valor: "empreendedor",  label: "Empreendedor",            desc: "Vendo produtos ou serviços" },
      { valor: "criador",       label: "Criador de Conteúdo",     desc: "Monetizo minha audiência" },
      { valor: "agencia",       label: "Agência / Freelancer",    desc: "Atendo clientes" },
      { valor: "influencer",    label: "Influencer / Produtor",   desc: "Construo marca pessoal" },
    ],
  },
  {
    titulo: "Qual é o seu segmento?",
    subtitulo: "A IA vai criar conteúdo com a linguagem certa para o seu nicho.",
    campo: "segmento",
    opcoes: [
      { valor: "beleza",      label: "Beleza & Estética",    desc: "Maquiagem, skincare, cabelo" },
      { valor: "moda",        label: "Moda & Lifestyle",     desc: "Roupas, acessórios, estilo" },
      { valor: "fitness",     label: "Fitness & Saúde",      desc: "Academia, nutrição, bem-estar" },
      { valor: "negocios",    label: "Negócios & Finanças",  desc: "Empreendedorismo, investimentos" },
      { valor: "educacao",    label: "Educação",             desc: "Cursos, mentoria, conhecimento" },
      { valor: "gastronomia", label: "Gastronomia",          desc: "Culinária, restaurante, receitas" },
      { valor: "tecnologia",  label: "Tecnologia",           desc: "Apps, gadgets, digital" },
      { valor: "outros",      label: "Outro segmento",       desc: "Meu nicho não está na lista" },
    ],
  },
  {
    titulo: "Como está sua presença digital hoje?",
    subtitulo: "Vamos calibrar as estratégias de acordo com o seu momento.",
    campo: "faseDigital",
    opcoes: [
      { valor: "iniciando",  label: "Estou começando",       desc: "Ainda sem perfil ou recém criado" },
      { valor: "ate10k",     label: "Audiência até 10k",     desc: "Já tenho presença, mas quero crescer" },
      { valor: "10k_100k",   label: "10k a 100k",            desc: "Audiência média, buscando escalar" },
      { valor: "acima100k",  label: "Acima de 100k",         desc: "Grande audiência, foco em monetizar" },
    ],
  },
];

export function OnboardingPopup({ onConcluido }: { onConcluido: () => void }) {
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    // Pequeno delay para a animação de entrada
    const t = setTimeout(() => setVisivel(true), 50);
    return () => clearTimeout(t);
  }, []);

  const passoAtual = PASSOS[passo];
  const selecionado = respostas[passoAtual.campo];
  const isUltimo = passo === PASSOS.length - 1;

  async function avancar() {
    if (!selecionado) return;
    if (!isUltimo) { setPasso(p => p + 1); return; }

    setSalvando(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(respostas),
    });
    setSalvando(false);
    onConcluido();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", opacity: visivel ? 1 : 0 }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: "#122a1d",
          border: "1px solid #1e4535",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          transform: visivel ? "scale(1) translateY(0)" : "scale(0.96) translateY(16px)",
        }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ borderBottom: "1px solid #1e4535" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "linear-gradient(135deg, #c8d92a, #9b8fd4)" }}>
              <Sparkles size={18} style={{ color: "#0d2b1e" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#6a9a78" }}>Cria Para Mim · Configuração inicial</p>
              <p className="text-xs" style={{ color: "#4a7055" }}>Passo {passo + 1} de {PASSOS.length}</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="w-full h-1 rounded-full" style={{ background: "#0a2318" }}>
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${((passo + 1) / PASSOS.length) * 100}%`, background: "linear-gradient(90deg, #c8d92a, #9b8fd4)" }}
            />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-8 py-6">
          <h2 className="text-xl font-bold mb-1" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
            {passoAtual.titulo}
          </h2>
          <p className="text-sm mb-6" style={{ color: "#6a9a78" }}>{passoAtual.subtitulo}</p>

          <div className={`grid gap-2 ${passoAtual.opcoes.length > 4 ? "grid-cols-2" : "grid-cols-1"}`}>
            {passoAtual.opcoes.map(({ valor, label, desc }) => {
              const ativo = selecionado === valor;
              return (
                <button
                  key={valor}
                  onClick={() => setRespostas(r => ({ ...r, [passoAtual.campo]: valor }))}
                  className="text-left p-3.5 rounded-xl transition-all"
                  style={{
                    background: ativo ? "rgba(200,217,42,0.12)" : "#0a2318",
                    border: `1px solid ${ativo ? "#c8d92a" : "#1e4535"}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: ativo ? "#c8d92a" : "#e4f0de" }}>{label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#6a9a78" }}>{desc}</div>
                    </div>
                    {ativo && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 ml-2"
                        style={{ background: "#c8d92a" }}>
                        <Check size={11} style={{ color: "#0d2b1e" }} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8">
          <button
            onClick={avancar}
            disabled={!selecionado || salvando}
            className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            style={{ background: "#c8d92a", color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)" }}
          >
            {salvando ? <Loader2 size={15} className="animate-spin" /> : null}
            {salvando ? "Configurando…" : isUltimo ? "Começar agora" : "Continuar"}
            {!salvando && !isUltimo && <ArrowRight size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
