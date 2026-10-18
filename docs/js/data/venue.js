/**
 * O LOCAL do evento (PUC Campinas, Campus I), só dado. `public: false` mostra o local só no modo DEV (pra conferir antes); `true` libera em produção (ver applyVenue, features/event-venue.js).
 * `venue` e `address` substituem EVENT.venue e EVENT.address (cabeçalho, mapa, calendário e dados estruturados leem de lá); `links` são os botões extras do bloco "Local". Os textos são traduzidos por
 * igualdade (data/i18n/en.js); os endereços são do site oficial da universidade.
 */
const VENUE = {
  public: false,
  venue: "PUC Campinas - Campus I",
  address: "PUC Campinas - Campus I, Av. Reitor Benedito José Barreto Fonseca, Parque dos Jacarandás, Campinas, SP, 13086-900",
  links: [
    { id: "map", label: "Mapa do campus (PDF)", url: "https://www.puc-campinas.edu.br/wp-content/uploads/2026/07/Mapa-PUC-Campus-I-26-2.pdf" },
    { id: "about", label: "Sobre o Campus I", url: "https://www.puc-campinas.edu.br/campus-i/" },
  ],
};

const venueRepository = createRepository(VENUE);
