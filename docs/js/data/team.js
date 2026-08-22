/**
 * Organizadores/voluntários do DevFest Campinas 2026 — MOCK abaixo
 * até confirmar nomes/fotos reais. `type` distingue organizador de
 * voluntário (mesmo grid/card, só filtra em 2 seções na página Time).
 * `social` aceita qualquer rede — cada item vira 1 ícone.
 */
const TEAM = [
  {
    name: "Nome Sobrenome",
    role: "Direção Geral",
    type: "organizador",
    photo: placeholderImage("Foto — exemplo", 320, 240),
    social: [
      { name: "facebook", link: "https://facebook.com" },
      { name: "linkedin", link: "https://linkedin.com" },
    ],
  },
  {
    name: "Nome Sobrenome",
    role: "Voluntário(a)",
    type: "voluntario",
    photo: placeholderImage("Foto — exemplo", 320, 240),
    social: [
      { name: "linkedin", link: "https://linkedin.com" },
    ],
  },
];
