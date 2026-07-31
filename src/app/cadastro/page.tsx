"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, User, Loader2, X, ChevronDown } from "lucide-react";
import { CONFIG } from "@/lib/config";
import Link from "next/link";

/* ── Conteúdo dos documentos ─────────────────────────────────────────────── */

const TERMOS_DE_USO = `TERMOS DE USO — CRIA PARA MIM

1. Aceitação dos Termos
Ao acessar ou utilizar o aplicativo "Cria Para Mim", você concorda integralmente com estes Termos de Uso. Caso não concorde, não deverá utilizar a Plataforma.

2. Descrição do Serviço
O Cria Para Mim é um estúdio de conteúdo que auxilia criadores e negócios a planejar, criar e organizar publicações para redes sociais (Reels, Stories, Posts), incluindo geração de roteiros com apoio de inteligência artificial, calendário editorial, biblioteca de conteúdo, estudo de público/persona, mapa de objeções e apoio ao planejamento de tráfego pago.

3. Cadastro do Usuário
Para utilizar a Plataforma, você deverá fornecer informações verdadeiras, completas e atualizadas, incluindo nome, e-mail e demais dados solicitados no perfil. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.

4. Conteúdo Gerado e Inserido pelo Usuário
Todo conteúdo estratégico que você inserir (diagnóstico de empresa, persona, jornada do cliente, posicionamento, objeções, temas e roteiros) é de sua titularidade e responsabilidade. Você declara possuir todos os direitos necessários sobre as informações e materiais que insere na Plataforma e se responsabiliza pela veracidade e licitude desses dados.

Os roteiros e conteúdos gerados com apoio de inteligência artificial a partir das suas informações são disponibilizados para seu uso comercial, respeitados os termos de uso dos provedores de IA envolvidos (item 5). O Cria Para Mim não garante originalidade absoluta, exatidão ou adequação legal do conteúdo gerado por IA, sendo responsabilidade do usuário revisar o material antes de publicá-lo.

5. Integrações com Provedores de Inteligência Artificial
A Plataforma permite que você conecte suas próprias chaves de API de provedores terceiros (como Anthropic/Claude, OpenAI/ChatGPT e Google Gemini) para geração de conteúdo. Ao cadastrar uma chave de API, você declara ser o titular legítimo dessa credencial e concorda que:

a) o uso dessas chaves está sujeito aos termos de uso e política de privacidade do respectivo provedor;
b) eventuais custos, limites de uso ou cobranças junto a esses provedores são de sua exclusiva responsabilidade;
c) o Cria Para Mim atua apenas como intermediário técnico, enviando as informações necessárias (como dados de persona e briefing) para geração do conteúdo solicitado, não se responsabilizando por indisponibilidades, alterações ou políticas desses provedores externos.

6. Uso Aceitável
Você concorda em não utilizar a Plataforma para fins ilícitos, para gerar conteúdo discriminatório, difamatório, enganoso ou que viole direitos de terceiros, nem para tentar acessar indevidamente dados de outros usuários ou comprometer a segurança do sistema.

7. Planos, Metas e Funcionalidades
Funcionalidades como metas de publicação, calendário e relatórios são ferramentas de apoio à gestão de conteúdo e não constituem garantia de resultado de audiência, vendas ou desempenho em redes sociais.

8. Propriedade Intelectual da Plataforma
O software, marca, layout, funcionalidades e demais elementos do Cria Para Mim são de propriedade do desenvolvedor da Plataforma, sendo vedada sua reprodução, engenharia reversa ou exploração comercial não autorizada.

9. Limitação de Responsabilidade
A Plataforma é fornecida "como está". Na máxima extensão permitida em lei, o Cria Para Mim não se responsabiliza por indisponibilidades temporárias, perda de dados, resultados de negócio ou danos indiretos decorrentes do uso do serviço, incluindo aqueles derivados de instabilidade dos provedores de IA integrados.

10. Suspensão e Encerramento
O usuário pode encerrar sua conta a qualquer momento. A Plataforma pode suspender ou encerrar contas que violem estes Termos, mediante notificação, salvo em casos de violação grave que exijam ação imediata.

11. Alterações destes Termos
Estes Termos podem ser atualizados periodicamente. Alterações relevantes serão comunicadas por e-mail ou aviso na Plataforma, e o uso continuado após a alteração implica concordância com os novos termos.

12. Lei Aplicável e Foro
Estes Termos são regidos pelas leis brasileiras, elegendo-se o foro da comarca competente para dirimir eventuais controvérsias.

13. Contato
Dúvidas sobre estes Termos podem ser enviadas para criaparamimapp@gmail.com.`;

const POLITICA_PRIVACIDADE = `POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD) — CRIA PARA MIM

1. Introdução
Esta Política descreve como o Cria Para Mim ("nós") coleta, usa, armazena e protege os dados pessoais dos usuários ("você", "titular"), em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD).

2. Controlador dos Dados
Mariana Cunha Silva Pithan é a controladora dos dados pessoais tratados nesta Plataforma. Contato: criaparamimapp@gmail.com.

3. Dados Pessoais Coletados
Coletamos as seguintes categorias de dados, fornecidos diretamente por você:

• Dados de identificação e contato: nome, e-mail (usado como login), data de nascimento, número de WhatsApp.
• Dados profissionais/negócio: nome da empresa, perfis de Instagram e TikTok vinculados.
• Dados de estratégia e conteúdo: informações inseridas nos módulos de diagnóstico da empresa, persona do público-alvo, jornada do cliente, análise de mercado, posicionamento, estilo de comunicação, objeções de venda e demais textos e roteiros criados na Plataforma.
• Dados de configuração técnica: chaves de API de provedores de inteligência artificial (Anthropic, OpenAI, Google Gemini) que você opcionalmente cadastra para habilitar a geração de conteúdo.
• Dados de uso da Plataforma: metas de publicação, calendário editorial, histórico de conteúdos criados e publicados, valor de investimento informado para planejamento de tráfego pago.
• Dados de acesso: cookie de sessão e registros técnicos (logs) necessários para segurança e funcionamento do serviço.

4. Finalidades do Tratamento
Os dados são utilizados para: criar e manter sua conta; personalizar e gerar conteúdo (roteiros, posts, análises de persona) por meio de inteligência artificial; organizar seu calendário e biblioteca de conteúdo; permitir a comunicação com você sobre a conta e o serviço; garantir a segurança da Plataforma; e cumprir obrigações legais.

5. Bases Legais
O tratamento se fundamenta, conforme o caso, na execução de contrato (art. 7º, V, LGPD) para viabilizar as funcionalidades contratadas; no legítimo interesse (art. 7º, IX) para melhorias e segurança da Plataforma; e no consentimento (art. 7º, I), quando aplicável, para finalidades específicas como comunicações de marketing.

6. Compartilhamento de Dados
Para gerar os conteúdos solicitados, as informações de persona, briefing e roteiros que você insere são transmitidas aos provedores de inteligência artificial que você optar por conectar (Anthropic/Claude, OpenAI, Google Gemini), que atuam como operadores de dados nos termos da LGPD, sujeitos às próprias políticas de privacidade. Não vendemos dados pessoais a terceiros. Poderemos compartilhar dados com prestadores de infraestrutura (hospedagem, banco de dados) estritamente para viabilizar o funcionamento da Plataforma, ou quando exigido por lei ou ordem judicial.

Quando o recurso de pagamento for lançado, esta seção será atualizada para indicar o processador de pagamentos utilizado, deixando claro que o Cria Para Mim não armazena diretamente dados sensíveis de cartão.

7. Armazenamento e Segurança
Os dados são armazenados em ambiente controlado, com medidas técnicas e administrativas voltadas a prevenir acessos não autorizados, perda ou vazamento. Chaves de API cadastradas por você são armazenadas de forma protegida e utilizadas exclusivamente para viabilizar a integração solicitada.

8. Retenção dos Dados
Mantemos seus dados enquanto sua conta estiver ativa e pelo prazo necessário para cumprir finalidades legais, contratuais ou regulatórias. Após o encerramento da conta, os dados poderão ser eliminados ou anonimizados, ressalvadas hipóteses de guarda obrigatória por lei.

9. Direitos do Titular
Nos termos do art. 18 da LGPD, você pode solicitar a qualquer momento: confirmação da existência de tratamento; acesso aos dados; correção de dados incompletos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade; eliminação de dados tratados com consentimento; informação sobre compartilhamento; e revogação do consentimento. As solicitações podem ser feitas pelo e-mail criaparamimapp@gmail.com.

10. Encarregado de Dados (DPO)
Para exercer seus direitos ou esclarecer dúvidas sobre esta Política, entre em contato com nossa Encarregada de Proteção de Dados pelo e-mail criaparamimapp@gmail.com.

11. Cookies e Tecnologias Semelhantes
Atualmente, o Cria Para Mim utiliza apenas cookies e armazenamento local estritamente necessários ao funcionamento da Plataforma, não empregando cookies de rastreamento, publicidade ou análise de terceiros. Especificamente:

• Cookie de sessão: utilizado para manter você autenticado(a) durante o uso da Plataforma, sem finalidade de marketing.
• Armazenamento local (localStorage): utilizado para guardar preferências de exibição (como tema claro/escuro) e valores informados por você em funcionalidades como o planejamento de tráfego pago, a fim de melhorar sua experiência de uso.

Nenhum desses dados é compartilhado com terceiros para fins publicitários.

12. Alterações desta Política
Esta Política pode ser atualizada periodicamente. Mudanças relevantes serão comunicadas por e-mail ou aviso na Plataforma, com indicação da data da última atualização.

13. Contato
Dúvidas, solicitações ou reclamações relacionadas a esta Política podem ser enviadas para criaparamimapp@gmail.com.`;

/* ── Modal de documento ──────────────────────────────────────────────────── */

function ModalDocumento({
  titulo, conteudo, onAceitar, onFechar,
}: { titulo: string; conteudo: string; onAceitar: () => void; onFechar: () => void }) {
  const [podeConcordar, setPodeConcordar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const chegouAoFim = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
    if (chegouAoFim) setPodeConcordar(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{ background: "#122a1d", border: "1px solid #1e4535", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #1e4535" }}>
          <h2 className="text-sm font-bold" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>{titulo}</h2>
          <button onClick={onFechar} className="p-1 rounded-lg transition-colors hover:bg-white/5" style={{ color: "#6a9a78" }}>
            <X size={16} />
          </button>
        </div>

        {/* Indicador "role para ler" */}
        {!podeConcordar && (
          <div className="flex items-center gap-2 px-5 py-2 shrink-0" style={{ background: "rgba(200,217,42,0.08)", borderBottom: "1px solid #1e4535" }}>
            <ChevronDown size={13} style={{ color: "#c8d92a" }} className="animate-bounce" />
            <span className="text-xs" style={{ color: "#8ab89a" }}>Role até o final para concordar</span>
          </div>
        )}

        {/* Conteúdo com scroll */}
        <div ref={scrollRef} onScroll={onScroll}
          className="flex-1 overflow-y-auto px-5 py-4 text-xs leading-relaxed whitespace-pre-wrap"
          style={{ color: "#8ab89a" }}>
          {conteudo}
          <div className="h-8" />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 shrink-0" style={{ borderTop: "1px solid #1e4535" }}>
          {!podeConcordar ? (
            <button disabled
              className="w-full py-2.5 rounded-xl text-sm font-bold opacity-30 cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "#c8d92a", color: "#0d2b1e" }}>
              <ChevronDown size={14} />
              Role até o final para concordar
            </button>
          ) : (
            <button onClick={onAceitar}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
              style={{ background: "#c8d92a", color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)" }}>
              Li e concordo ✓
            </button>
          )}
          <button onClick={onFechar} className="w-full text-center text-xs mt-3 transition-colors" style={{ color: "#4a7055" }}>
            Fechar sem concordar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Página de cadastro ──────────────────────────────────────────────────── */

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouLGPD, setAceitouLGPD] = useState(false);
  const [modalAberto, setModalAberto] = useState<"termos" | "lgpd" | null>(null);
  const [tentouEnviar, setTentouEnviar] = useState(false);

  const podeSalvar = nome && email && senha && aceitouTermos && aceitouLGPD;

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setTentouEnviar(true);
    if (!aceitouTermos || !aceitouLGPD) return;
    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json();
      if (!res.ok) { setErro(data.erro ?? "Erro ao criar conta."); return; }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErro("Erro ao conectar. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 grid-bg" style={{ background: "#0d2b1e" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
            style={{ background: "linear-gradient(135deg, #c8d92a, #9b8fd4)", boxShadow: "0 0 32px rgba(200,217,42,0.3)" }}>
            <Sparkles size={24} style={{ color: "#0d2b1e" }} />
          </div>
          <h1 className="text-2xl font-bold leading-tight" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
            {CONFIG.plataforma}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6a9a78" }}>Crie sua conta gratuita</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "#122a1d", border: "1px solid #1e4535" }}>
          <h2 className="text-base font-semibold mb-1" style={{ color: "#e4f0de", fontFamily: "var(--font-syne, inherit)" }}>
            Começar agora
          </h2>
          <p className="text-xs mb-6" style={{ color: "#6a9a78" }}>
            Seu estúdio de conteúdo inteligente, pronto em segundos.
          </p>

          <form onSubmit={cadastrar} className="space-y-4">
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#8ab89a" }}>Nome</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4a7055" }} />
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" required autoFocus
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none transition"
                  style={{ background: "#0a2318", color: "#e4f0de", border: "1px solid #2d5a3d" }}
                  onFocus={e => (e.target.style.borderColor = "#c8d92a")}
                  onBlur={e => (e.target.style.borderColor = "#2d5a3d")} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#8ab89a" }}>Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4a7055" }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none transition"
                  style={{ background: "#0a2318", color: "#e4f0de", border: "1px solid #2d5a3d" }}
                  onFocus={e => (e.target.style.borderColor = "#c8d92a")}
                  onBlur={e => (e.target.style.borderColor = "#2d5a3d")} />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: "#8ab89a" }}>Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4a7055" }} />
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" required
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none transition"
                  style={{ background: "#0a2318", color: "#e4f0de", border: "1px solid #2d5a3d" }}
                  onFocus={e => (e.target.style.borderColor = "#c8d92a")}
                  onBlur={e => (e.target.style.borderColor = "#2d5a3d")} />
              </div>
            </div>

            {/* ── Checkboxes de aceite ────────────────────────────────── */}
            <div className="space-y-3 pt-1">
              {/* Termos de Uso */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={aceitouTermos} onChange={e => setAceitouTermos(e.target.checked)}
                  className="mt-0.5 shrink-0 w-4 h-4 rounded accent-lime-400 cursor-pointer" />
                <span className="text-xs leading-relaxed" style={{ color: tentouEnviar && !aceitouTermos ? "#f06080" : "#6a9a78" }}>
                  Li e concordo com os{" "}
                  <button type="button" onClick={() => setModalAberto("termos")}
                    className="underline underline-offset-2 font-medium transition-colors hover:opacity-80"
                    style={{ color: tentouEnviar && !aceitouTermos ? "#f06080" : "#c8d92a" }}>
                    Termos de Uso
                  </button>
                </span>
              </label>

              {/* Política de Privacidade (LGPD) */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={aceitouLGPD} onChange={e => setAceitouLGPD(e.target.checked)}
                  className="mt-0.5 shrink-0 w-4 h-4 rounded accent-lime-400 cursor-pointer" />
                <span className="text-xs leading-relaxed" style={{ color: tentouEnviar && !aceitouLGPD ? "#f06080" : "#6a9a78" }}>
                  Li e estou ciente com a{" "}
                  <button type="button" onClick={() => setModalAberto("lgpd")}
                    className="underline underline-offset-2 font-medium transition-colors hover:opacity-80"
                    style={{ color: tentouEnviar && !aceitouLGPD ? "#f06080" : "#c8d92a" }}>
                    Política de Privacidade e LGPD
                  </button>
                </span>
              </label>

              {tentouEnviar && (!aceitouTermos || !aceitouLGPD) && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#f06080", background: "rgba(240,96,128,0.08)", border: "1px solid rgba(240,96,128,0.2)" }}>
                  É necessário concordar com os dois documentos para criar sua conta.
                </p>
              )}
            </div>

            {erro && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#f06080", background: "rgba(240,96,128,0.1)", border: "1px solid rgba(240,96,128,0.2)" }}>
                {erro}
              </p>
            )}

            <button type="submit" disabled={carregando || !nome || !email || !senha}
              className="w-full py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2 mt-2"
              style={{ background: "#c8d92a", color: "#0d2b1e", fontFamily: "var(--font-syne, inherit)" }}>
              {carregando ? <Loader2 size={15} className="animate-spin" /> : null}
              {carregando ? "Criando conta…" : "Criar minha conta"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "#4a7055" }}>
          Já tem conta?{" "}
          <Link href="/login" className="underline" style={{ color: "#6a9a78" }}>Fazer login</Link>
        </p>
        <p className="text-center text-[10px] mt-2" style={{ color: "#2d5a3d" }}>
          powered by <span className="font-semibold" style={{ color: "#4a7055" }}>{CONFIG.plataforma}</span>
        </p>
      </div>

      {/* ── Modais ─────────────────────────────────────────────────────── */}
      {modalAberto === "termos" && (
        <ModalDocumento
          titulo="Termos de Uso"
          conteudo={TERMOS_DE_USO}
          onAceitar={() => { setAceitouTermos(true); setModalAberto(null); }}
          onFechar={() => setModalAberto(null)}
        />
      )}
      {modalAberto === "lgpd" && (
        <ModalDocumento
          titulo="Política de Privacidade e LGPD"
          conteudo={POLITICA_PRIVACIDADE}
          onAceitar={() => { setAceitouLGPD(true); setModalAberto(null); }}
          onFechar={() => setModalAberto(null)}
        />
      )}
    </div>
  );
}
