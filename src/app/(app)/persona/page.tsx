"use client";
import { useState, useEffect } from "react";
import {
  User, Target, Heart, AlertTriangle, MessageSquare, TrendingUp,
  Lightbulb, ChevronDown, ChevronUp, Star, ShoppingBag, Smartphone,
  Pencil, Plus, Trash2, Sparkles, Check, X, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Desejo = { emoji: string; titulo: string; desc: string };
type Medo = { emoji: string; titulo: string; desc: string };
type Proibido = { proibido: string; correto: string };
type Diferencial = { icon: string; titulo: string; desc: string };
type Sugestao = { titulo: string; desc: string; tag: string; tagCor: string };

type PersonaData = {
  nomePersona: string;
  faixaEtaria: string;
  localizacao: string;
  perfilCompra: string;
  desejos: Desejo[];
  medos: Medo[];
  palavrasMarca: string[];
  palavrasProibidas: Proibido[];
  diferenciais: Diferencial[];
  comoComunicar: string[];
  sugestoesIA: string | null;
  atualizadoEm: string | null;
};

type Step = "perfil" | "desejos" | "medos" | "voz" | "diferenciais" | "comunicar";
const STEPS: Step[] = ["perfil", "desejos", "medos", "voz", "diferenciais", "comunicar"];
const STEP_LABELS: Record<Step, string> = {
  perfil: "Perfil",
  desejos: "Desejos",
  medos: "Medos",
  voz: "Tom de voz",
  diferenciais: "Diferenciais",
  comunicar: "Comunicação",
};

export default function PersonaPage() {
  const [aberta, setAberta] = useState<string | null>("perfil");
  const [persona, setPersona] = useState<PersonaData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [step, setStep] = useState<Step>("perfil");
  const [salvando, setSalvando] = useState(false);

  // Form state
  const [form, setForm] = useState<PersonaData>({
    nomePersona: "", faixaEtaria: "", localizacao: "", perfilCompra: "",
    desejos: [], medos: [], palavrasMarca: ["", "", ""],
    palavrasProibidas: [], diferenciais: [], comoComunicar: [],
    sugestoesIA: null, atualizadoEm: null,
  });

  useEffect(() => {
    fetch("/api/persona").then((r) => r.json()).then((data) => {
      setPersona(data);
      setCarregando(false);
    });
  }, []);

  function abrirEdicao() {
    if (!persona) return;
    setForm({ ...persona });
    setStep("perfil");
    setEditando(true);
    setAberta(null);
  }

  async function salvar() {
    setSalvando(true);
    try {
      const res = await fetch("/api/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setPersona(data);
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  }

  const sugestoes: Sugestao[] = (() => {
    if (!persona?.sugestoesIA) return [];
    try { return JSON.parse(persona.sugestoesIA); } catch { return []; }
  })();

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  // ============ MODO EDIÇÃO ============
  if (editando && persona) {
    const stepIdx = STEPS.indexOf(step);
    const isLast = stepIdx === STEPS.length - 1;
    const isFirst = stepIdx === 0;

    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Atualizar Persona</h1>
            <p className="text-sm text-gray-500 mt-0.5">A IA vai regenerar as sugestões ao salvar</p>
          </div>
          <button onClick={() => setEditando(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${step === s ? "bg-gray-900 text-white" : i < stepIdx ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {i < stepIdx && <Check size={10} />}
              {STEP_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Step: Perfil */}
        {step === "perfil" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Quem é a sua cliente ideal?</h2>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nome da persona</label>
              <input value={form.nomePersona} onChange={(e) => setForm((p) => ({ ...p, nomePersona: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Faixa etária</label>
                <input value={form.faixaEtaria} onChange={(e) => setForm((p) => ({ ...p, faixaEtaria: e.target.value }))}
                  placeholder="ex: 25 a 40 anos"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Localização</label>
                <input value={form.localizacao} onChange={(e) => setForm((p) => ({ ...p, localizacao: e.target.value }))}
                  placeholder="ex: Londrina e região"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Perfil de compra</label>
              <input value={form.perfilCompra} onChange={(e) => setForm((p) => ({ ...p, perfilCompra: e.target.value }))}
                placeholder="ex: Consultivo, não impulsivo"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400" />
            </div>
          </div>
        )}

        {/* Step: Desejos */}
        {step === "desejos" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">O que ela mais deseja?</h2>
            {form.desejos.map((d, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={d.emoji} onChange={(e) => setForm((p) => ({ ...p, desejos: p.desejos.map((x, j) => j === i ? { ...x, emoji: e.target.value } : x) }))}
                    className="w-12 text-center text-lg border border-gray-200 rounded-lg px-1 py-1.5 focus:outline-none" placeholder="🎯" />
                  <input value={d.titulo} onChange={(e) => setForm((p) => ({ ...p, desejos: p.desejos.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x) }))}
                    placeholder="Título do desejo" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
                  <button onClick={() => setForm((p) => ({ ...p, desejos: p.desejos.filter((_, j) => j !== i) }))}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
                <textarea value={d.desc} onChange={(e) => setForm((p) => ({ ...p, desejos: p.desejos.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) }))}
                  placeholder="Descreva este desejo com detalhes" rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none resize-none" />
              </div>
            ))}
            <button onClick={() => setForm((p) => ({ ...p, desejos: [...p.desejos, { emoji: "✨", titulo: "", desc: "" }] }))}
              className="w-full text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl py-3 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors">
              <Plus size={13} /> Adicionar desejo
            </button>
          </div>
        )}

        {/* Step: Medos */}
        {step === "medos" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">O que ela teme na hora de comprar?</h2>
            {form.medos.map((m, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={m.emoji} onChange={(e) => setForm((p) => ({ ...p, medos: p.medos.map((x, j) => j === i ? { ...x, emoji: e.target.value } : x) }))}
                    className="w-12 text-center text-lg border border-gray-200 rounded-lg px-1 py-1.5 focus:outline-none" placeholder="😰" />
                  <input value={m.titulo} onChange={(e) => setForm((p) => ({ ...p, medos: p.medos.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x) }))}
                    placeholder="Título do medo" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
                  <button onClick={() => setForm((p) => ({ ...p, medos: p.medos.filter((_, j) => j !== i) }))}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
                <textarea value={m.desc} onChange={(e) => setForm((p) => ({ ...p, medos: p.medos.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) }))}
                  placeholder="Por que ela teme isso?" rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none resize-none" />
              </div>
            ))}
            <button onClick={() => setForm((p) => ({ ...p, medos: [...p.medos, { emoji: "😰", titulo: "", desc: "" }] }))}
              className="w-full text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl py-3 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors">
              <Plus size={13} /> Adicionar medo
            </button>
          </div>
        )}

        {/* Step: Tom de voz */}
        {step === "voz" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-3">As 3 palavras que definem a marca</h2>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <input key={i} value={form.palavrasMarca[i] ?? ""}
                    onChange={(e) => setForm((p) => { const arr = [...p.palavrasMarca]; arr[i] = e.target.value; return { ...p, palavrasMarca: arr }; })}
                    placeholder={["Palavra 1", "Palavra 2", "Palavra 3"][i]}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none text-center" />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Palavras/expressões que a marca NUNCA deve usar</h2>
              {form.palavrasProibidas.map((p, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={p.proibido} onChange={(e) => setForm((prev) => ({ ...prev, palavrasProibidas: prev.palavrasProibidas.map((x, j) => j === i ? { ...x, proibido: e.target.value } : x) }))}
                    placeholder='❌ palavra proibida' className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
                  <input value={p.correto} onChange={(e) => setForm((prev) => ({ ...prev, palavrasProibidas: prev.palavrasProibidas.map((x, j) => j === i ? { ...x, correto: e.target.value } : x) }))}
                    placeholder='✅ substituto certo' className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
                  <button onClick={() => setForm((prev) => ({ ...prev, palavrasProibidas: prev.palavrasProibidas.filter((_, j) => j !== i) }))}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => setForm((p) => ({ ...p, palavrasProibidas: [...p.palavrasProibidas, { proibido: "", correto: "" }] }))}
                className="w-full text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl py-3 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors">
                <Plus size={13} /> Adicionar palavra proibida
              </button>
            </div>
          </div>
        )}

        {/* Step: Diferenciais */}
        {step === "diferenciais" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">Quais são os grandes diferenciais do negócio?</h2>
            {form.diferenciais.map((d, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <input value={d.icon} onChange={(e) => setForm((p) => ({ ...p, diferenciais: p.diferenciais.map((x, j) => j === i ? { ...x, icon: e.target.value } : x) }))}
                    className="w-12 text-center text-lg border border-gray-200 rounded-lg px-1 py-1.5 focus:outline-none" placeholder="🏆" />
                  <input value={d.titulo} onChange={(e) => setForm((p) => ({ ...p, diferenciais: p.diferenciais.map((x, j) => j === i ? { ...x, titulo: e.target.value } : x) }))}
                    placeholder="Nome do diferencial" className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
                  <button onClick={() => setForm((p) => ({ ...p, diferenciais: p.diferenciais.filter((_, j) => j !== i) }))}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
                <textarea value={d.desc} onChange={(e) => setForm((p) => ({ ...p, diferenciais: p.diferenciais.map((x, j) => j === i ? { ...x, desc: e.target.value } : x) }))}
                  placeholder="Por que isso importa para a cliente?" rows={2}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none resize-none" />
              </div>
            ))}
            <button onClick={() => setForm((p) => ({ ...p, diferenciais: [...p.diferenciais, { icon: "🏆", titulo: "", desc: "" }] }))}
              className="w-full text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl py-3 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors">
              <Plus size={13} /> Adicionar diferencial
            </button>
          </div>
        )}

        {/* Step: Comunicação */}
        {step === "comunicar" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">Como a marca deve se comunicar com ela?</h2>
            <p className="text-xs text-gray-500">Dicas de tom e abordagem que toda peça de conteúdo deve seguir.</p>
            {form.comoComunicar.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input value={c} onChange={(e) => setForm((p) => ({ ...p, comoComunicar: p.comoComunicar.map((x, j) => j === i ? e.target.value : x) }))}
                  placeholder='ex: "Dirija em vez de perguntar"'
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
                <button onClick={() => setForm((p) => ({ ...p, comoComunicar: p.comoComunicar.filter((_, j) => j !== i) }))}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            ))}
            <button onClick={() => setForm((p) => ({ ...p, comoComunicar: [...p.comoComunicar, ""] }))}
              className="w-full text-xs text-gray-500 border border-dashed border-gray-200 rounded-xl py-3 hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors">
              <Plus size={13} /> Adicionar dica de comunicação
            </button>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3 mt-8">
          {!isFirst && (
            <button onClick={() => setStep(STEPS[stepIdx - 1])}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Voltar
            </button>
          )}
          {!isLast ? (
            <button onClick={() => setStep(STEPS[stepIdx + 1])}
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors">
              Próximo
            </button>
          ) : (
            <button onClick={salvar} disabled={salvando}
              className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {salvando ? (
                <><Loader2 size={14} className="animate-spin" /> A IA está analisando…</>
              ) : (
                <><Sparkles size={14} /> Salvar e regenerar sugestões</>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============ MODO VISUALIZAÇÃO ============
  if (!persona) return null;

  type Secao = { id: string; titulo: string; icon: React.ElementType; cor: string; bg: string; conteudo: React.ReactNode };

  const secoes: Secao[] = [
    {
      id: "perfil",
      titulo: "Perfil da Persona",
      icon: User, cor: "#7C3AED", bg: "#F5F3FF",
      conteudo: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="w-14 h-14 rounded-full bg-purple-200 flex items-center justify-center text-2xl font-bold text-purple-700">
              {persona.nomePersona.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{persona.nomePersona}</div>
              <div className="text-sm text-gray-500">{persona.faixaEtaria} · {persona.localizacao}</div>
              <div className="text-xs text-purple-600 font-medium mt-0.5">Cliente ideal da It Case</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Faixa etária", valor: persona.faixaEtaria },
              { label: "Localização", valor: persona.localizacao },
              { label: "Renda", valor: "Renda própria" },
              { label: "Perfil de compra", valor: persona.perfilCompra },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-[11px] text-gray-400 mb-0.5">{item.label}</div>
                <div className="text-sm font-medium text-gray-800">{item.valor}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "desejos",
      titulo: "O que ela deseja",
      icon: Heart, cor: "#E11D48", bg: "#FFF1F2",
      conteudo: (
        <div className="space-y-3">
          {persona.desejos.map((item) => (
            <div key={item.titulo} className="flex gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
              <span className="text-xl shrink-0">{item.emoji}</span>
              <div>
                <div className="text-sm font-semibold text-gray-900">{item.titulo}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "medos",
      titulo: "O que ela teme",
      icon: AlertTriangle, cor: "#D97706", bg: "#FFFBEB",
      conteudo: (
        <div className="space-y-3">
          {persona.medos.map((item) => (
            <div key={item.titulo} className="flex gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-xl shrink-0">{item.emoji}</span>
              <div>
                <div className="text-sm font-semibold text-gray-900">{item.titulo}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "voz",
      titulo: "Tom de voz & Vocabulário",
      icon: MessageSquare, cor: "#0891B2", bg: "#ECFEFF",
      conteudo: (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">As 3 palavras da marca</div>
            <div className="flex gap-2">
              {persona.palavrasMarca.filter(Boolean).map((p) => (
                <div key={p} className="flex-1 bg-cyan-50 border border-cyan-200 rounded-xl py-3 text-center text-sm font-semibold text-cyan-700">{p}</div>
              ))}
            </div>
          </div>
          {persona.palavrasProibidas.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nunca usar</div>
              <div className="space-y-1.5">
                {persona.palavrasProibidas.map((item) => (
                  <div key={item.proibido} className="flex items-center gap-2 text-xs">
                    <span className="line-through text-red-400 bg-red-50 px-2 py-0.5 rounded">❌ "{item.proibido}"</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded">✅ "{item.correto}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {persona.comoComunicar.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Como se comunicar</div>
              <div className="space-y-1.5 text-xs text-gray-600">
                {persona.comoComunicar.map((c, i) => (
                  <div key={i} className="flex gap-2 p-2 bg-gray-50 rounded-lg"><span>✓</span><span>{c}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "diferenciais",
      titulo: "Diferenciais que ela valoriza",
      icon: Star, cor: "#7C3AED", bg: "#F5F3FF",
      conteudo: (
        <div className="space-y-2">
          {persona.diferenciais.map((item) => (
            <div key={item.titulo} className="flex gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <span className="text-xl shrink-0">{item.icon}</span>
              <div>
                <div className="text-sm font-semibold text-gray-900">{item.titulo}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "sugestoes",
      titulo: "Sugestões de melhoria",
      icon: Lightbulb, cor: "#059669", bg: "#ECFDF5",
      conteudo: (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-medium">
            ⚠️ Qualquer alteração na persona deve ser atualizada aqui para a IA recalcular a estratégia de conteúdo.
          </div>
          {sugestoes.length > 0 ? sugestoes.map((item) => (
            <div key={item.titulo} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-sm font-semibold text-gray-900">{item.titulo}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${item.tagCor}`}>{item.tag}</span>
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
            </div>
          )) : (
            <div className="text-center py-6 text-gray-400">
              <Lightbulb size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Atualize a persona para gerar sugestões personalizadas pela IA</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "atualizar",
      titulo: "Atualizar a persona",
      icon: TrendingUp, cor: "#D97706", bg: "#FFFBEB",
      conteudo: (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="font-semibold text-amber-900 mb-2">🔄 Como funciona a atualização</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Toda a estratégia de conteúdo — roteiros, temas, tendências, legendas — é criada pensando nessa persona.
              Quando algo mudar (nova faixa etária, novo diferencial, nova dor identificada), atualize aqui para que a IA recalcule a rota.
            </p>
          </div>
          {persona.atualizadoEm && (
            <p className="text-xs text-gray-400 text-center">
              Última atualização: {format(new Date(persona.atualizadoEm), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}
          <button onClick={abrirEdicao}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-sm font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors">
            <Pencil size={14} /> Atualizar persona agora
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Smartphone size={18} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Estudo de Persona</h1>
              <p className="text-sm text-gray-500">It Case · Quem é a sua cliente ideal</p>
            </div>
          </div>
          <button onClick={abrirEdicao}
            className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Pencil size={12} /> Editar
          </button>
        </div>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex gap-2">
          <ShoppingBag size={14} className="shrink-0 mt-0.5" />
          <span>Todo conteúdo criado aqui é pensado nessa persona. Conhecê-la bem é o que faz a diferença entre post ignorado e venda no direct.</span>
        </div>
      </div>

      <div className="space-y-3">
        {secoes.map((secao) => {
          const Icon = secao.icon;
          const estaAberta = aberta === secao.id;
          return (
            <div key={secao.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <button onClick={() => setAberta(estaAberta ? null : secao.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: secao.bg }}>
                    <Icon size={15} style={{ color: secao.cor }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{secao.titulo}</span>
                </div>
                {estaAberta ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {estaAberta && (
                <div className="px-4 pb-4 border-t border-gray-50">
                  <div className="pt-3">{secao.conteudo}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
