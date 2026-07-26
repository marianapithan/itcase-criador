"use client";
import { useState } from "react";
import {
  User, Target, Heart, AlertTriangle, MessageSquare, TrendingUp,
  Lightbulb, ChevronDown, ChevronUp, Star, ShoppingBag, Smartphone,
} from "lucide-react";

type Secao = {
  id: string;
  titulo: string;
  icon: React.ElementType;
  cor: string;
  bg: string;
  conteudo: React.ReactNode;
};

export default function PersonaPage() {
  const [aberta, setAberta] = useState<string | null>("perfil");

  const secoes: Secao[] = [
    {
      id: "perfil",
      titulo: "Perfil da Persona",
      icon: User,
      cor: "#7C3AED",
      bg: "#F5F3FF",
      conteudo: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="w-14 h-14 rounded-full bg-purple-200 flex items-center justify-center text-2xl font-bold text-purple-700">A</div>
            <div>
              <div className="font-semibold text-gray-900">Ana Conquista</div>
              <div className="text-sm text-gray-500">25–40 anos · Londrina, PR</div>
              <div className="text-xs text-purple-600 font-medium mt-0.5">Cliente ideal da It Case</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Faixa etária", valor: "25 a 40 anos" },
              { label: "Independência financeira", valor: "Renda própria" },
              { label: "Localização", valor: "Londrina e região" },
              { label: "Perfil de compra", valor: "Consultivo, não impulsivo" },
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
      icon: Heart,
      cor: "#E11D48",
      bg: "#FFF1F2",
      conteudo: (
        <div className="space-y-3">
          {[
            { emoji: "✨", titulo: "Status e reconhecimento", desc: "O iPhone não é só um celular — é um símbolo de conquista pessoal. Ela quer sentir que chegou lá." },
            { emoji: "⚡", titulo: "Produtividade real", desc: "Usa o ecossistema Apple para trabalhar, estudar e se organizar. Valoriza quem entende isso." },
            { emoji: "🤝", titulo: "Pertencimento", desc: "Quer fazer parte de um grupo que compartilha valores: qualidade, cuidado e bom gosto." },
            { emoji: "🛡️", titulo: "Segurança na compra", desc: "Quer saber que não vai se arrepender. Garantia, procedência e suporte pós-venda são decisivos." },
          ].map((item) => (
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
      icon: AlertTriangle,
      cor: "#D97706",
      bg: "#FFFBEB",
      conteudo: (
        <div className="space-y-3">
          {[
            { emoji: "😰", titulo: "Ser enganada", desc: "Medo de comprar um produto adulterado, clonado ou com procedência duvidosa. Transparência é tudo." },
            { emoji: "😤", titulo: "Falta de suporte", desc: "Comprar e ficar na mão depois. Ela quer saber que pode voltar se tiver problema." },
            { emoji: "💸", titulo: "Pagar caro pelo errado", desc: "Investir em algo que não atende ao que ela realmente precisa. Precisa de consultoria, não de pressão de vendas." },
          ].map((item) => (
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
      icon: MessageSquare,
      cor: "#0891B2",
      bg: "#ECFEFF",
      conteudo: (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">As 3 palavras da marca</div>
            <div className="flex gap-2">
              {["Confiança", "Acolhimento", "Proximidade"].map((p) => (
                <div key={p} className="flex-1 bg-cyan-50 border border-cyan-200 rounded-xl py-3 text-center text-sm font-semibold text-cyan-700">{p}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nunca usar</div>
            <div className="space-y-1.5">
              {[
                { proibido: "capinha", correto: "capa de celular" },
                { proibido: "posso ajudar?", correto: "direcionar com confiança" },
                { proibido: "preço imbatível", correto: "o melhor custo-benefício pra você" },
                { proibido: "aproveite agora!", correto: "convidar sem pressionar" },
              ].map((item) => (
                <div key={item.proibido} className="flex items-center gap-2 text-xs">
                  <span className="line-through text-red-400 bg-red-50 px-2 py-0.5 rounded">❌ "{item.proibido}"</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded">✅ "{item.correto}"</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Como se comunicar</div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex gap-2 p-2 bg-gray-50 rounded-lg"><span>✓</span><span>Dirija em vez de perguntar ("Você precisa de..." em vez de "Posso te ajudar?")</span></div>
              <div className="flex gap-2 p-2 bg-gray-50 rounded-lg"><span>✓</span><span>Convide em vez de pressionar ("Vem conhecer" em vez de "Corre que acaba!")</span></div>
              <div className="flex gap-2 p-2 bg-gray-50 rounded-lg"><span>✓</span><span>Humanize — ela compra de pessoas que confiam, não de lojas</span></div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "diferenciais",
      titulo: "Diferenciais que ela valoriza",
      icon: Star,
      cor: "#7C3AED",
      bg: "#F5F3FF",
      conteudo: (
        <div className="space-y-2">
          {[
            { icon: "🛡️", titulo: "Película com garantia de tela de 6 meses", desc: "Única na região — tranquilidade que ela não encontra em outro lugar." },
            { icon: "📱", titulo: "iPhones seminovos nunca abertos", desc: "Originais, com peças Apple, garantia de 6 meses. Combate o medo de comprar algo duvidoso." },
            { icon: "🏪", titulo: "Loja física no Shopping Catuaí", desc: "Presença física = credibilidade. Ela pode ir pessoalmente, tocar, testar." },
            { icon: "🤝", titulo: "Atendimento consultivo", desc: "Não empurra produto — encontra a solução certa pra cada cliente." },
          ].map((item) => (
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
      titulo: "Sugestões de melhoria da persona",
      icon: Lightbulb,
      cor: "#059669",
      bg: "#ECFDF5",
      conteudo: (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-medium">
            ⚠️ Qualquer alteração na persona deve ser comunicada ao app para recalcular a estratégia de conteúdo.
          </div>
          {[
            {
              titulo: "Expandir para 18–24 anos (oportunidade não explorada)",
              desc: "Jovens com primeiro emprego e renda própria estão comprando iPhone como símbolo de independência. Criar conteúdo específico pra esse grupo pode abrir um novo segmento.",
              tag: "Baixo custo · Alto potencial",
              tagCor: "bg-green-100 text-green-700",
            },
            {
              titulo: "Persona B2B — empresas e profissionais liberais",
              desc: "Médicos, advogados e microempresários que precisam de iPhone/MacBook para trabalhar com produtividade. Compram em quantidade e indicam para toda a equipe.",
              tag: "Ticket médio alto",
              tagCor: "bg-blue-100 text-blue-700",
            },
            {
              titulo: "Explorar gifting (presentes e datas comemorativas)",
              desc: "Pessoa próxima comprando para presentear mãe, namorado, filho. Criação de conteúdo de 'presente perfeito' antes de datas como Dia das Mães, Natal e aniversários.",
              tag: "Sazonal · Alta conversão",
              tagCor: "bg-orange-100 text-orange-700",
            },
            {
              titulo: "Persona Recompra — clientes que já compraram",
              desc: "Quem comprou uma vez e ficou satisfeito precisa de conteúdo que o convide a voltar: acessórios, upgrade de modelo, película nova, indicação para amigos.",
              tag: "Fidelização",
              tagCor: "bg-purple-100 text-purple-700",
            },
          ].map((item) => (
            <div key={item.titulo} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="text-sm font-semibold text-gray-900">{item.titulo}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${item.tagCor}`}>{item.tag}</span>
              </div>
              <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "avisos",
      titulo: "Como atualizar a persona",
      icon: TrendingUp,
      cor: "#D97706",
      bg: "#FFFBEB",
      conteudo: (
        <div className="space-y-3 text-sm text-gray-700">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="font-semibold text-amber-900 mb-2">🔄 Recalcular a rota de conteúdo</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Toda a estratégia de conteúdo — roteiros, temas, tendências, legendas — é criada pensando nessa persona.
              Se ela mudar (nova faixa etária, novo diferencial, nova dor identificada), o contexto da IA precisa ser atualizado.
            </p>
          </div>
          <div className="text-xs text-gray-500 leading-relaxed">
            <p className="font-medium text-gray-700 mb-2">Para atualizar a persona no app:</p>
            <div className="space-y-2">
              <div className="flex gap-2"><span className="font-bold text-gray-400 shrink-0">1.</span><span>Abra o arquivo <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">src/lib/config.ts</code> na raiz do projeto</span></div>
              <div className="flex gap-2"><span className="font-bold text-gray-400 shrink-0">2.</span><span>Edite o campo <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px]">contextoIA</code> com as novas informações da persona</span></div>
              <div className="flex gap-2"><span className="font-bold text-gray-400 shrink-0">3.</span><span>Salve e faça um novo deploy — todos os próximos conteúdos já usarão a persona atualizada</span></div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Smartphone size={18} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Estudo de Persona</h1>
            <p className="text-sm text-gray-500">It Case · Quem é a sua cliente ideal</p>
          </div>
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
              <button
                onClick={() => setAberta(estaAberta ? null : secao.id)}
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
