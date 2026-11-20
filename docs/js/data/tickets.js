/**
 * Tipos de ingresso REAIS (definidos pelo Renato em 2026-10-17, iguais aos do Sympla: Grátis e Ingresso + Kit Camiseta; o selo diz só "Vagas limitadas", sem número, por decisão do Renato em 2026-10-21: o Sympla limita cada tipo, e o site não promete uma quantidade). Aparecem no site quando as vendas abrem (`EVENT.tickets.salesOpen`) ou em DEV. Cada tipo é só dado: quantos existirem, o
 * card e o CTA se ajustam. `price` em reais (0 = grátis, ausente = ainda
 * não definido, o card mostra TICKET_PRICE_TBD); `url` é
 * opcional (padrão: EVENT.tickets.url); `featured` destaca o card;
 * `color` é um token de cor (tokens.css).
 */
const TICKET_TYPES = [
  {
    id: "gratis",
    name: "Ingresso Grátis",
    price: 0,
    color: "var(--google-blue)",
    badge: "Vagas limitadas",
    description: "Para viver o evento e aprender junto com a comunidade.",
    benefits: ["Acesso a todas as palestras e trilhas", "Credencial de participante", "Certificado de participação (para quem fizer check-in em ao menos uma palestra)"],
  },
  {
    id: "camiseta",
    name: "Ingresso + Kit Camiseta",
    price: 45.1, // o que o comprador paga no Sympla (valor do ingresso mais a taxa dele, que NÃO é detalhada no site)
    color: "var(--google-yellow)",
    featured: true,
    showcase: "tshirt", // vitrine das fotos da camiseta no card (pages/ingressos.js)
    badge: "Vagas limitadas",
    // VENDAS ENCERRADAS (2026-11-20): `enabled` = acabou (selo, preço riscado, botão sem link, capa com o meme, card apagado); `public` = vale em produção (false = só em modo DEV, pra conferir antes). LIBERADO em produção em 2026-11-20.
    // Abriu um lote extra? `enabled: false`. O meme da capa e o texto alternativo moram aqui, por tipo.
    soldOut: { enabled: true, public: true, art: "assets/img/tickets/camiseta-vendas-encerradas.webp", artAlt: "Meme do DevFest: a fênix triste com um cabide na mão diz \"Eu: depois eu compro a camiseta...\". Camisetas do evento: vendas encerradas." },
    description: "Leve a lembrança do DevFest para casa.",
    benefits: ["Tudo do ingresso Grátis", "Camiseta oficial do DevFest Campinas 2026", "Certificado de participação (para quem fizer check-in em ao menos uma palestra)"],
  },
];

/** Texto no lugar do preço enquanto o valor não estiver definido. */
const TICKET_PRICE_TBD = "Valor a definir";

/** Textos do estado "vendas encerradas" de um tipo de ingresso (selo e botão). Traduzidos por igualdade (data/i18n/en.js). */
const TICKET_SOLD_OUT_TEXTS = { badge: "Vendas encerradas", button: "Vendas encerradas" };

/** Chamada mostrada em destaque abaixo dos cards (callout: ação + motivo). */
const TICKETS_NOTE = "Inscreva-se pelo Sympla e garanta seu lugar no DevFest Campinas 2026.";

const ticketsRepository = createRepository(TICKET_TYPES, {
  getById: id => TICKET_TYPES.find(type => type.id === id),
});
