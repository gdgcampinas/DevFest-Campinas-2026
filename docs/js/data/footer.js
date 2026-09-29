/**
 * Colunas do rodapé — cada coluna é {title, items: [{label, url}]},
 * mesmo formato pra todas: link list genérica, nada hardcoded em HTML.
 * URLs/e-mail vêm de CONTACT (data/contact.js, precisa carregar antes) — única fonte de verdade,
 * reusada também no Código de conduta (features/cod.js).
 */
const FOOTER_COLUMNS = [
  {
    title: "Links",
    items: [
      { label: "Meetup", url: CONTACT.meetup },
      { label: "Instagram", url: CONTACT.instagram },
      { label: "LinkedIn", url: CONTACT.linkedin },
      { label: "Linktree", url: CONTACT.linktree },
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
      { label: CONTACT.email, url: `mailto:${CONTACT.email}` },
    ],
  },
];

const footerRepository = createRepository(FOOTER_COLUMNS);
