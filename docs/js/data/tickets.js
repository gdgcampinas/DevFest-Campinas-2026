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
    description: "Leve a lembrança do DevFest para casa.",
    benefits: ["Tudo do ingresso Grátis", "Camiseta oficial do DevFest Campinas 2026", "Certificado de participação (para quem fizer check-in em ao menos uma palestra)"],
  },
];

/** Texto no lugar do preço enquanto o valor não estiver definido. */
const TICKET_PRICE_TBD = "Valor a definir";

/** Aviso mostrado abaixo dos cards. */
const TICKETS_NOTE = "As inscrições acontecem pelo Sympla.";

const ticketsRepository = createRepository(TICKET_TYPES, {
  getById: id => TICKET_TYPES.find(type => type.id === id),
});
