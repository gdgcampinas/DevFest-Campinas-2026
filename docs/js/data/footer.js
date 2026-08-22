/**
 * Colunas do rodapé — cada coluna é {title, items: [{label, url}]},
 * mesmo formato pra todas: link list genérica, nada hardcoded em HTML.
 * "Eventos anteriores" e "Contato" com exemplo — confirmar/ajustar.
 */
const FOOTER_COLUMNS = [
  {
    title: "Links",
    items: [
      { label: "Meetup", url: "https://www.meetup.com/gdgcampinas/" },
      { label: "Instagram", url: "https://www.instagram.com/gdgcampinas" },
      { label: "LinkedIn", url: "https://www.linkedin.com/company/gdg-campinas/" },
      { label: "Linktree", url: "https://linktr.ee/gdgcampinas" },
    ],
  },
  {
    title: "Eventos anteriores",
    items: [
      { label: "EloTech 2026", url: "https://gdgcampinas.github.io/EloTech-Agibank/" },
    ],
  },
  {
    title: "Contato",
    items: [
      { label: "gdgcampinascontato@gmail.com", url: "mailto:gdgcampinascontato@gmail.com" },
    ],
  },
];
