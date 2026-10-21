/**
 * Guia de tamanhos da camiseta do kit, só dado. Medidas em CENTÍMETROS (altura: do ombro até a barra; largura: de axila a axila), aproximadas: podem variar até 2 cm. `public: false` mostra o guia só em
 * modo DEV (pra conferir); `true` libera em produção (ver features/release-gate.js). Os textos são traduzidos por igualdade (data/i18n/en.js); os tamanhos (PP, P, M...) são códigos, não texto.
 */
const TSHIRT_SIZES_CONFIG = { public: true }; // LIBERADO em produção em 2026-10-21

const TSHIRT_SIZES = [
  { id: "masculina", label: "Masculina", sizes: [
    { size: "PP", height: 67, width: 51 }, { size: "P", height: 69, width: 54 }, { size: "M", height: 72, width: 56 }, { size: "G", height: 75, width: 58 },
    { size: "GG", height: 77, width: 60 }, { size: "XG", height: 79, width: 62 }, { size: "XXG", height: 82, width: 64 }, { size: "XXXG", height: 82, width: 66 },
  ] },
  { id: "feminina", label: "Feminina", sizes: [
    { size: "PP", height: 62, width: 48 }, { size: "P", height: 63, width: 49 }, { size: "M", height: 64, width: 52 }, { size: "G", height: 65, width: 55 },
    { size: "GG", height: 70, width: 56 }, { size: "XG", height: 73, width: 61 }, { size: "XXG", height: 75, width: 62 },
  ] },
  { id: "infantil", label: "Infantil", sizes: [
    { size: "6", height: 47, width: 35 }, { size: "8", height: 51, width: 38 }, { size: "10", height: 54, width: 41 }, { size: "12", height: 58, width: 45 }, { size: "14", height: 62, width: 46 },
  ] },
];

const TSHIRT_SIZES_TEXTS = {
  badge: "GUIA DE TAMANHOS",
  title: "Qual é o seu",
  titleAccent: "tamanho?",
  sub: "As medidas da camiseta do kit, para você escolher o tamanho certo na hora da inscrição.",
  subStrong: "Confira antes de se inscrever.",
  columns: { sizeName: "Tamanho", height: "Altura", width: "Largura" },
  unit: "cm",
  heightLabel: "Altura",
  widthLabel: "Largura",
  approx: "Medidas aproximadas: podem variar até 2 cm.",
  tipTitle: "Como escolher o seu tamanho",
  tip: "Deite uma camiseta sua que serve bem e compare a largura (de axila a axila) e a altura (do ombro até a barra).",
  shortcut: "Guia de tamanhos",
  diagramLabel: "Desenho da camiseta com a altura e a largura marcadas",
};

const tshirtSizesRepository = createRepository(TSHIRT_SIZES, { getById: id => TSHIRT_SIZES.find(model => model.id === id) });
const tshirtSizesTextsRepository = createRepository(TSHIRT_SIZES_TEXTS);
const tshirtSizesConfigRepository = createRepository(TSHIRT_SIZES_CONFIG);
