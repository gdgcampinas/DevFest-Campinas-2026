/**
 * Números da última edição — prova social na home. Array vazio some a
 * seção inteira (mesmo padrão de sponsors/team). Preenchido com os
 * números reais do DevFest Campinas 2025.
 */
const LAST_EDITION_STATS = {
  title: "Números do DevFest 2025",
  items: [
    { value: "700", label: "participantes", sub: "de Campinas e região" },
    { value: "36+", label: "horas", sub: "de muito networking e conteúdo de altíssima qualidade" },
    { value: "37", label: "palestrantes", sub: "referências nos assuntos" },
    { value: "4", label: "trilhas", sub: "simultâneas" },
  ],
};

const statsRepository = createRepository(LAST_EDITION_STATS);
