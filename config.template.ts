// ============================================================
//  crIAdor · Template de configuração — copie para src/lib/config.ts
// ============================================================
//
//  INSTRUÇÕES:
//  1. Renomeie este arquivo para src/lib/config.ts
//  2. Preencha todos os campos com as informações do negócio
//  3. Atualize src/lib/team.ts com os emails e senha do time
//  4. Faça o deploy no Vercel (veja README)
//
// ============================================================

export const CONFIG = {
  // Nome do negócio exibido na sidebar, login e título da página
  nome: "Nome do Negócio",

  // Subtítulo (ex.: "Studio de Conteúdo", "Central de Marketing", "Canal do Criador")
  tagline: "Studio de Conteúdo",

  // Contexto completo para a IA — cole aqui tudo que ela precisa saber
  // sobre o negócio para gerar roteiros, tendências e legendas relevantes.
  contextoIA: `
Você é um especialista em criação de conteúdo digital para [NOME DO NEGÓCIO].

SOBRE O NEGÓCIO:
- Nome: [NOME DO NEGÓCIO]
- Segmento: [ex.: loja de moda feminina / personal trainer / advogada trabalhista]
- Localização: [cidade, estado — ou "online" se for digital]
- Diferencial: [o que torna este negócio único]

PÚBLICO-ALVO:
- [Quem são os clientes / seguidores]
- Desejam: [o que buscam ao consumir este conteúdo]
- Medos/objeções: [o que os impede de comprar ou engajar]

TOM DE VOZ:
- 3 palavras que definem o tom: [palavra1], [palavra2], [palavra3]
- Nunca usar: [expressões que não combinam com a marca]
- Sempre usar: [expressões e abordagens que a marca adota]

META DOS PRÓXIMOS 90 DIAS:
[descreva o objetivo principal — ex.: dobrar seguidores, lançar produto, etc.]
`.trim(),
};
