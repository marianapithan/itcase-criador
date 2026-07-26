import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

const CONTEUDOS = [
  {
    titulo: "Chegada de estoque novo",
    formato: "REELS",
    dataplanejada: "2026-07-27",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `ATENÇÃO (falado, olhando pra câmera, tom de urgência):
"Se você tava esperando o modelo certo aparecer, para tudo e olha isso."

INTERESSE (enquanto mostra as caixas/produtos):
"Chegou remessa nova com modelos que estavam em falta. Se você tava esperando pra comprar, é agora."

DESEJO (mostrando 2-3 aparelhos, close no design/tela):
"Olha esse aqui... [nome do modelo], com [destaque: cor/capacidade/condição]. E esse outro, [nome do modelo], perfeito estado."

AÇÃO (falado + texto na tela):
"Corre que é remessa limitada. Passa na loja hoje ou chama a gente no direct pra reservar o seu!"

LEGENDA: Chegou remessa nova e é por tempo limitado! 📦✨ Vem conferir os modelos antes que acabe.`,
  },
  {
    titulo: "Prova social / depoimentos",
    formato: "CARROSSEL",
    dataplanejada: "2026-07-28",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `Slide 1 — ATENÇÃO:
"Isso é o que nossos clientes falam sobre a IT Case 💙"

Slide 2 — INTERESSE:
"'Comprei meu celular seminovo e veio tudo certinho, com nota e garantia. Recomendo demais!' — [Nome do cliente]"

Slide 3 — DESEJO (reforçando benefício):
"'Fui super bem atendida, sem pressa e sem enrolação. Voltei pra comprar acessório também!' — [Nome do cliente]"

Slide 4 — DESEJO (mais um depoimento, reforçando confiança):
"'Deu um probleminha no aparelho e resolveram na hora, sem drama. Isso é garantia de verdade.' — [Nome do cliente]"

Slide 5 — AÇÃO:
"Quer ser o próximo a confiar na IT Case? Vem conhecer a loja no [shopping]!"

LEGENDA: Nada fala mais alto que quem já comprou com a gente. Obrigado a cada cliente que confia na IT Case! 💙 Vem fazer parte dessa lista também.`,
  },
  {
    titulo: "Bastidores / atendimento",
    formato: "POST_ESTATICO",
    dataplanejada: "2026-07-29",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `HEADLINE — ATENÇÃO:
"Aqui, você é atendido de verdade"

CORPO — INTERESSE:
"Sem robô, sem espera de dias. Nossa equipe te atende de perto e te ajuda a escolher certo."

REFORÇO — DESEJO:
"Loja física no [shopping] — você vê, testa e leva com segurança."

LEGENDA — AÇÃO: Na IT Case, você não fala com robô nem espera dias por resposta. Nossa equipe te atende de perto, tira dúvida na hora e te ajuda a escolher certo. Vem conhecer a loja no [shopping]! 💙`,
  },
  {
    titulo: "Garantia de verdade",
    formato: "POST_ESTATICO",
    dataplanejada: "2026-07-30",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `HEADLINE — ATENÇÃO:
"Garantia de verdade, sem letra miúda"

CORPO — INTERESSE:
"Comprou e algo não ficou certo? A gente resolve, com loja física pra te atender."

REFORÇO — DESEJO:
"Segurança de comprar sabendo que tem quem te atenda depois."

LEGENDA — AÇÃO: Você tem garantia de verdade, com loja física pra te atender. Sem enrolação, sem sumiço. É assim que a gente trabalha. 🤝 Vem comprar com essa tranquilidade.`,
  },
  {
    titulo: "React: película mal colocada",
    formato: "REELS",
    dataplanejada: "2026-07-31",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `ATENÇÃO (reagindo a vídeo de alguém colocando película errado):
"Em pleno 2026 você ainda usa película desse jeito?"

INTERESSE (pausando o vídeo pra comentar os erros):
"Essa película não serve nem pra proteção do celular. Se cair, vai quebrar de qualquer jeito, e ainda esquenta seu aparelho — por isso sempre faz bolha e levanta a lateral."

DESEJO (cortando pra demonstração de aplicação correta na loja):
"Aqui na IT Case trabalhamos com a única película do mercado que te dá 6 meses de garantia de tela. Além de proteger de verdade, se quebrar, a gente paga o conserto pra você."

AÇÃO (CTA):
"Passa na loja e coloca do jeito certo, sem dor de cabeça!"

LEGENDA: Película mal colocada não protege nada. Vem colocar do jeito certo com a gente! 📱✅`,
  },
  {
    titulo: "Vitrine de acessórios",
    formato: "REELS",
    dataplanejada: "2026-08-01",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `ATENÇÃO (falado, mostrando uma gaveta/vitrine cheia de itens):
"Você sabia que a IT Case tem muito mais que capa?"

INTERESSE (mostrando os itens um a um, rápido):
"Fone, power bank, carregador, película... tudo o que seu celular precisa pra funcionar redondo, num lugar só."

DESEJO (destacando 2-3 itens específicos com detalhe):
"Esse power bank aqui carrega o celular todinho fora de casa. E esse fone... [destacar diferencial]."

AÇÃO (CTA):
"Passa na loja e monta seu kit completo!"

LEGENDA: Muito além da capa: fone, power bank, carregador e mais — tudo o que seu celular precisa, num lugar só. Vem conferir! 🔌🎧`,
  },
  {
    titulo: "Como a IT Case verifica cada aparelho",
    formato: "CARROSSEL",
    dataplanejada: "2026-08-02",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `Slide 1 — ATENÇÃO:
"Você sabe o que acontece antes de um seminovo chegar na nossa vitrine?"

Slide 2 — INTERESSE (etapa 1):
"Primeiro, testamos bateria, tela e câmera item por item."

Slide 3 — INTERESSE (etapa 2):
"Depois, conferimos o IMEI pra garantir que não tem restrição nem pendência."

Slide 4 — DESEJO (etapa 3 + benefício):
"Só então o aparelho ganha nossa garantia e vai pra loja — pronto pra você levar sem medo."

Slide 5 — AÇÃO:
"Vem conferir de perto esse processo. Te esperamos na loja!"

LEGENDA: Cada seminovo passa por um processo rigoroso antes de chegar até você: teste completo, verificação de IMEI e garantia. Segurança do começo ao fim. ✅📱`,
  },
  {
    titulo: "React: comprou online e recebeu um tijolo",
    formato: "REELS",
    dataplanejada: "2026-08-03",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `ATENÇÃO (reagindo a vídeo de alguém abrindo caixa e encontrando um tijolo):
"Para tudo... ela comprou um celular online e recebeu ISSO"

INTERESSE (pausando o vídeo pra comentar, cara de choque):
"Pagou, esperou, e quando abriu a caixa era um tijolo. Isso acontece mais do que você imagina."

DESEJO (cortando pra loja física, mostrando o processo de compra segura):
"Por isso, confie naquilo que você vê. Aqui você vê o aparelho, testa na sua mão e só leva depois de conferir tudo. Nada de caixa surpresa."

AÇÃO (CTA):
"Vem comprar com segurança, na loja física do Shopping Catuaí. Te esperamos!"

LEGENDA: Golpe de celular online é mais comum do que parece. Na loja física, você testa antes de levar — sem susto. 📦🚫`,
  },
  {
    titulo: "Vitrine seminovos",
    formato: "CARROSSEL",
    dataplanejada: "2026-08-04",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `Slide 1 — ATENÇÃO:
"Seminovo bom é assim: testado, com garantia e no preço certo"

Slide 2 — INTERESSE (modelo 1):
"[Modelo 1] — ótimo estado, testado e com garantia. Preço especial pra quem quer economizar sem abrir mão de qualidade."

Slide 3 — INTERESSE (modelo 2):
"[Modelo 2] — bateria testada, tela sem riscos, pronto pra usar."

Slide 4 — DESEJO (modelo 3 + reforço):
"[Modelo 3] — o queridinho da loja, saindo rápido. Garante o seu antes que acabe."

Slide 5 — AÇÃO:
"Fala com a gente no direct e confere todos os modelos disponíveis!"

LEGENDA: Separamos seminovos com ótimo custo-benefício e procedência garantida. Chama no direct e confere os modelos disponíveis! 📲`,
  },
  {
    titulo: "Teaser promoção de capas",
    formato: "POST_ESTATICO",
    dataplanejada: "2026-08-05",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `HEADLINE — ATENÇÃO:
"Capa nova pra semana? Prepara que vem coisa boa por aí 👀"

CORPO — INTERESSE:
"Faltam 2 dias pra uma novidade que você vai querer aproveitar."

REFORÇO — DESEJO:
"Fica de olho, porque vai valer a pena esperar."

LEGENDA — AÇÃO: Sexta-feira tem novidade boa chegando pra quem ama capa nova. Fica ligado por aqui! 👀📱`,
  },
  {
    titulo: "Teaser final promoção de capas",
    formato: "REELS",
    dataplanejada: "2026-08-06",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `ATENÇÃO (falado, clima de suspense):
"Amanhã tem promoção de capa e você não vai querer perder."

INTERESSE (mostrando algumas capas sem revelar preço):
"Separamos um mostruário gigante de modelos novos pra Samsung, Motorola e iPhone."

DESEJO (aproximando câmera dos detalhes das capas):
"E amanhã eu conto exatamente como vai funcionar a promoção — vai valer muito a pena."

AÇÃO (CTA):
"Ativa as notificações e não perde. Amanhã aqui, às [horário]!"

LEGENDA: Amanhã tem promoção de capa chegando. Ativa as notificações pra não perder! 👀🔥`,
  },
  {
    titulo: "Lançamento Promoção de Capas — Reels",
    formato: "REELS",
    dataplanejada: "2026-08-07",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `ATENÇÃO (falado, animado):
"Chegou o dia! Promoção de capa começando agora!"

INTERESSE (explicando a mecânica):
"Pra Samsung e Motorola, é valor fixo em todas as capas da loja. E pra quem tem iPhone, é leve X, pague Y."

DESEJO (mostrando a variedade de modelos, cores e estampas):
"Olha essa variedade de modelos... tem pra todo estilo, e o preço tá imperdível."

AÇÃO (CTA com urgência):
"Corre na loja, a promoção vai até dia 16 de agosto!"

LEGENDA: A promoção que você esperava chegou! Capas Samsung e Motorola por valor fixo e no iPhone é leve X, pague Y. Válido até 16/08, só aqui na loja. Corre que é por tempo limitado! 🔥📱`,
  },
  {
    titulo: "Lançamento Promoção de Capas — Carrossel",
    formato: "CARROSSEL",
    dataplanejada: "2026-08-07",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `Slide 1 — ATENÇÃO:
"PROMOÇÃO DE CAPAS chegou! 🎉"

Slide 2 — INTERESSE (mecânica Samsung/Motorola):
"Samsung e Motorola: valor fixo em todas as capas da loja."

Slide 3 — INTERESSE (mecânica iPhone):
"iPhone: leve X, pague Y."

Slide 4 — DESEJO (mostruário):
"Modelos, cores e estampas pra todo estilo. Vem escolher a sua!"

Slide 5 — AÇÃO:
"Promoção válida de 07/08 até 16/08 — só na loja física. Corre!"

LEGENDA: A promoção que você esperava chegou! Capas Samsung e Motorola por valor fixo e no iPhone é leve X, pague Y. Válido até 16/08, só aqui na loja. Corre que é por tempo limitado! 🔥📱`,
  },
  {
    titulo: "Reforço promoção + teaser Dia dos Pais",
    formato: "CARROSSEL",
    dataplanejada: "2026-08-08",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `Slide 1 — ATENÇÃO:
"Ainda dá tempo de garantir sua capa na promoção 🔥"

Slide 2 — INTERESSE (reforço da mecânica):
"Samsung e Motorola em valor fixo, iPhone em leve X pague Y. Promoção segue até dia 16/08."

Slide 3 — INTERESSE (gancho pro dia seguinte):
"E amanhã é Dia dos Pais! Preparamos algo especial pra ele 🎁"

Slide 4 — DESEJO (teaser dos produtos, sem revelar preço):
"Caixa de som, fone de ouvido e smartwatch... amanhã tem promoção especial nesses itens."

Slide 5 — AÇÃO:
"Amanhã tem promoção especial. Não perde!"

LEGENDA: A promoção de capas segue rolando! E amanhã, Dia dos Pais, preparamos uma surpresa especial pra você presentear ele. Fica de olho por aqui! 🎁📲`,
  },
  {
    titulo: "Dia dos Pais — Reels",
    formato: "REELS",
    dataplanejada: "2026-08-09",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `ATENÇÃO (falado, urgência de última hora):
"Ainda não comprou o presente do seu pai? Bora resolver isso agora!"

INTERESSE (mostrando os produtos):
"Separamos caixa de som, fone de ouvido e smartwatch em promoção especial de Dia dos Pais."

DESEJO (reforçando o benefício emocional + prático):
"Presente que ele vai usar de verdade, todo dia. E com a garantia que só a IT Case oferece."

AÇÃO (CTA com urgência):
"Corre na loja, hoje é o dia! A promoção é só hoje."

LEGENDA: Ainda não comprou o presente do seu pai? Caixa de som, fone de ouvido e smartwatch em promoção especial. Presente que ele vai usar todo dia, com garantia de verdade. Corre que é só hoje! 🎁📲`,
  },
  {
    titulo: "Dia dos Pais — Carrossel",
    formato: "CARROSSEL",
    dataplanejada: "2026-08-09",
    canal: "Instagram",
    campanha: "Roteiro AIDA Jul-Ago",
    roteiro: `Slide 1 — ATENÇÃO:
"Feliz Dia dos Pais! Presente na promoção é aqui 🎁"

Slide 2 — INTERESSE (caixa de som):
"Caixa de som em promoção — som de qualidade pra ele curtir onde quiser."

Slide 3 — INTERESSE (fone de ouvido):
"Fone de ouvido em promoção — praticidade no dia a dia dele."

Slide 4 — DESEJO (smartwatch, reforçando o presente ideal):
"Smartwatch em promoção — o presente completo pra quem gosta de tecnologia e estilo."

Slide 5 — AÇÃO:
"Presenteie com qualidade e garantia. Só hoje, aqui na loja!"

LEGENDA: Feliz Dia dos Pais! 🎉 Preparamos uma seleção especial pra você presentear com qualidade: caixa de som, fone de ouvido e smartwatch em promoção. Presente que ele vai usar todo dia, com a garantia que só a IT Case oferece. Corre que é só hoje! 🎁📲`,
  },
];

export async function POST() {
  const criados: string[] = [];

  for (const item of CONTEUDOS) {
    const existing = await prisma.conteudo.findFirst({
      where: { titulo: item.titulo, campanha: item.campanha },
    });
    if (existing) {
      criados.push(`SKIP: ${item.titulo}`);
      continue;
    }
    await prisma.conteudo.create({
      data: {
        titulo: item.titulo,
        formato: item.formato,
        canal: item.canal,
        campanha: item.campanha,
        roteiro: item.roteiro,
        status: "ROTEIRO_PRONTO",
        dataplanejada: new Date(item.dataplanejada + "T12:00:00.000Z"),
      },
    });
    criados.push(`OK: ${item.titulo}`);
  }

  return NextResponse.json({ importados: criados });
}
