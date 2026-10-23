/**
 * O mapa do campus com os pontos perto do prédio do evento, só dado. `public: false` mostra o mapa só no modo DEV (pra conferir); `true` libera em produção (ver features/release-gate.js).
 * `image` é o mapa oficial do Campus I (PUC-Campinas); `x` e `y` são a posição de cada ponto em % da imagem; `focus` é a área que o botão "Aproximar" mostra (centro e aumento).
 * Cada `kind` tem uma cor em `VENUE_MAP_TYPES`. Os textos são traduzidos por igualdade (data/i18n/en.js). Para um ponto novo, é só uma linha em VENUE_MAP_POINTS.
 */
const VENUE_MAP_CONFIG = { public: false };

const VENUE_MAP = {
  image: "assets/img/campus/mapa-campus-i.webp",
  alt: "Mapa oficial do Campus I da PUC-Campinas",
  focus: { x: 47, y: 62, zoom: 2.3 },
  selectedId: "h2",
};

const VENUE_MAP_TYPES = {
  venue: { color: "#d62839" },
  transit: { color: "#1f6fd1" },
  info: { color: "#0f8a6a" },
  foodtruck: { color: "#d4530f" },
  food: { color: "#a86a0b" },
  parking: { color: "#6a50d0" },
  gate: { color: "#2b2b33" },
};

const VENUE_MAP_POINTS = [
  { id: "h2", kind: "venue", mark: "H", x: 40.1, y: 62.4, name: "Prédio H-02", text: "Onde acontece o DevFest Campinas." },
  { id: "bus", kind: "transit", mark: "B", x: 46.7, y: 60.8, name: "Ponto de ônibus", text: "Na Av. Dom Humberto Mozzoni, ao lado do H-Zero." },
  { id: "info", kind: "info", mark: "i", x: 49.0, y: 58.4, name: "Posto de informações", text: "No H-Zero. Dúvidas e orientação do campus." },
  { id: "foodtruck", kind: "foodtruck", mark: "F", x: 52.3, y: 60.6, name: "Food trucks", text: "Em frente ao H-Zero, perto do posto de informações." },
  { id: "food", kind: "food", mark: "A", x: 58.0, y: 72.7, name: "Praça de alimentação", text: "A mais próxima do H-02, ao sul dos prédios H." },
  { id: "parking", kind: "parking", mark: "C", x: 32.9, y: 51.0, name: "Estacionamento C", text: "O maior perto do H-02. Siga a pé pela Av. Dom Humberto Mozzoni." },
  { id: "gate1", kind: "gate", mark: "1", x: 70.4, y: 35.7, name: "Portão 1", text: "Entrada pelo nordeste do campus." },
  { id: "gate2", kind: "gate", mark: "2", x: 91.6, y: 73.5, name: "Portão 2", text: "Entrada pela Av. Reitor Benedito José Barreto Fonseca." },
  { id: "gate3", kind: "gate", mark: "3", x: 46.6, y: 90.3, name: "Portão 3", text: "Entrada pelo sul, perto da Rua Dom Paulo de Tarso Campos." },
];

const VENUE_MAP_TEXTS = {
  badge: "COMO CHEGAR",
  title: "O campus e o",
  titleAccent: "H-02",
  sub: "Toque num ponto do mapa para ver o que é. Tudo o que você precisa fica perto do prédio H-02.",
  zoomIn: "Aproximar do H-02",
  zoomOut: "Ver o campus inteiro",
  official: "Mapa oficial (PDF)",
  officialUrl: "https://www.puc-campinas.edu.br/wp-content/uploads/2026/07/Mapa-PUC-Campus-I-26-2.pdf",
  credit: "Mapa: PUC-Campinas",
  legend: "Pontos do mapa",
};

const venueMapRepository = createRepository(VENUE_MAP);
const venueMapPointsRepository = createRepository(VENUE_MAP_POINTS, { getById: id => VENUE_MAP_POINTS.find(point => point.id === id) });
const venueMapTypesRepository = createRepository(VENUE_MAP_TYPES);
const venueMapTextsRepository = createRepository(VENUE_MAP_TEXTS);
const venueMapConfigRepository = createRepository(VENUE_MAP_CONFIG);
