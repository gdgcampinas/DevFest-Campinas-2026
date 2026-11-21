/**
 * O LOCAL do evento (PUC Campinas, Campus I), só dado. `public: false` mostra o local só no modo DEV (pra conferir antes); `true` libera em produção (ver applyVenue, features/event-venue.js).
 * `venue`, `building`, `entrance` e `address` substituem EVENT.venue e EVENT.address (cabeçalho, calendário e dados estruturados leem de lá); `mapQuery` e `mapZoom` dizem ao mapa e ao "Como chegar" o que procurar e a que distância; `links` são os botões extras do bloco "Local". Os textos são traduzidos por
 * igualdade (data/i18n/en.js); os endereços são do site oficial da universidade.
 */
const VENUE = {
  public: true, // LIBERADO em produção em 2026-10-23
  venue: "PUC-Campinas, Campus I",
  building: "Prédio H-02", // o prédio do evento
  entrance: "Entrada pelo portão 2", // por onde entrar (aparece junto do endereço e no mapa)
  address: "Av. Dom Humberto Mozzoni, 120-160, Parque dos Jacarandás, Campinas, SP", // o que aparece escrito no site
  mapQuery: "Av. Dom Humberto Mozzoni, 120, Campinas, SP", // o que o Google Maps procura: SÓ o endereço da rua com um número (a busca por nome do campus ou por faixa "120-160" não acha o pino e mostra a região sem marcador; este põe o pino na PUC, testado em 2026-11-21)
  mapZoom: 16,
  links: [
    { id: "map", label: "Mapa do campus (PDF)", url: "https://www.puc-campinas.edu.br/wp-content/uploads/2026/07/Mapa-PUC-Campus-I-26-2.pdf" },
    { id: "about", label: "Sobre o Campus I", url: "https://www.puc-campinas.edu.br/campus-i/" },
  ],
};

const venueRepository = createRepository(VENUE);
