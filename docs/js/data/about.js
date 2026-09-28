/**
 * Blocos "Sobre" — texto institucional, evergreen (não muda por edição). Mesmo card colorido com ícone das
 * outras seções (components/info-card.js): `trackColor` reusa as cores da marca (data/tokens.css), `icon` vem
 * de data/icons.js (iconsRepository).
 */
const ABOUT_SECTIONS = [
  {
    id: "devfest",
    trackColor: "var(--google-blue)",
    icon: "mic",
    title: "Sobre o DevFest",
    body: "O DevFest é uma conferência de tecnologia voltada para quem quer aprender, trocar experiência e se conectar com a comunidade tech de Campinas e região.",
  },
  {
    id: "gdg",
    trackColor: "var(--google-green)",
    icon: "users",
    title: "O que é o GDG?",
    body: "O GDG Campinas é parte de um programa do Google (Google Developer Group), uma entre mais de 700 comunidades espalhadas pelo mundo. O objetivo é criar espaços de compartilhamento de conhecimento sobre desenvolvimento de software, da forma mais acessível possível pra quem quer aprender e compartilhar.",
  },
];

const aboutRepository = createRepository(ABOUT_SECTIONS);
