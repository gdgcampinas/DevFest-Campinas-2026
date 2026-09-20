/**
 * Tipos de ingresso — MOCK (valores e benefícios de exemplo) até a
 * organização confirmar. Cada tipo é só dado: quantos existirem, o
 * card e o CTA se ajustam. `price` em reais (0 = grátis); `url` é
 * opcional (padrão: EVENT.tickets.url); `featured` destaca o card;
 * `color` é um token de cor (tokens.css).
 */
const TICKET_TYPES = [
  {
    id: "gratis",
    name: "Grátis",
    price: 0,
    color: "var(--google-blue)",
    description: "Para quem quer viver o evento e aprender junto com a comunidade.",
    benefits: ["Acesso a todas as palestras e trilhas", "Credencial de participante", "Certificado de participação"],
  },
  {
    id: "camiseta",
    name: "Ingresso com camiseta",
    price: 60,
    color: "var(--google-yellow)",
    featured: true,
    badge: "Mais escolhido",
    description: "Leve a lembrança do DevFest para casa.",
    benefits: ["Tudo do ingresso Grátis", "Camiseta oficial do DevFest Campinas 2026"],
  },
  {
    id: "vip",
    name: "VIP",
    price: 150,
    color: "var(--google-green)",
    description: "A experiência completa, com mais conforto e networking.",
    benefits: ["Tudo do ingresso com camiseta", "Credencial VIP e entrada prioritária", "Área de networking exclusiva", "Kit de brindes dos patrocinadores"],
  },
];

/** Aviso mostrado abaixo dos cards enquanto os valores forem de exemplo. */
const TICKETS_NOTE = "Valores e benefícios de exemplo, sujeitos a confirmação. As inscrições acontecem pelo Sympla.";

const ticketsRepository = createRepository(TICKET_TYPES, {
  getById: id => TICKET_TYPES.find(type => type.id === id),
});
