/**
 * O LOCAL do evento (PUC Campinas, Campus I), só dado. `public: false` mostra o local só no modo DEV (pra conferir antes); `true` libera em produção (ver applyVenue, features/event-venue.js).
 * `venue`, `building`, `entrance` e `address` substituem EVENT.venue e EVENT.address (cabeçalho, calendário e dados estruturados leem de lá); `mapQuery` e `mapZoom` dizem ao mapa e ao "Como chegar" o que procurar e a que distância; `links` são os botões extras do bloco "Local". Os textos são traduzidos por
 * igualdade (data/i18n/en.js); os endereços são do site oficial da universidade.
 */
const VENUE = {
  public: false,
  venue: "PUC-Campinas, Campus I",
  building: "Prédio H-02", // o prédio do evento
  entrance: "Entrada pelo portão 2", // por onde entrar (aparece junto do endereço e no mapa)
  address: "Av. Reitor Benedito José Barreto Fonseca, Parque dos Jacarandás, Campinas, SP, 13086-900", // o que aparece escrito no site
  mapQuery: "PUC Campinas - Campus I, Av. Reitor Benedito José Barreto Fonseca, Parque dos Jacarandás, Campinas, SP, 13086-900", // o que o Google Maps procura (nome + rua: o pino cai no campus)
  mapZoom: 16,
  links: [
    { id: "map", label: "Mapa do campus (PDF)", url: "https://www.puc-campinas.edu.br/wp-content/uploads/2026/07/Mapa-PUC-Campus-I-26-2.pdf" },
    { id: "about", label: "Sobre o Campus I", url: "https://www.puc-campinas.edu.br/campus-i/" },
  ],
};

const venueRepository = createRepository(VENUE);
