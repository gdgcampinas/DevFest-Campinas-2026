/**
 * Ícones de traço (viewBox 24x24) por nome — único lugar com os paths.
 * Quem precisa de um ícone usa iconMarkup(name) (components/icon.js);
 * dado que referencia ícone (ex.: talk-formats.js) guarda só o nome.
 */
const ICONS = {
  "thumbs-up": '<path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 2 2v4h6a2 2 0 0 1 2 2l-1.5 7a2 2 0 0 1-2 1.5H7"/>',
  mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  users: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 6 1.5 6 4.5"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.2-4.6A8 8 0 1 1 21 12z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 3v4M17 5h4M5 17v4M3 19h4"/>',
  code: '<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 4l-4 16"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
  rocket: '<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2M12 15l-3-3a22 22 0 0 1 2-4 12 12 0 0 1 11-5c0 3-1 8-5 11a22 22 0 0 1-4 2z"/><path d="M9 12H4s.5-3 2-4c1.6-1 5 0 5 0M12 15v5s3-.5 4-2c1-1.6 0-5 0-5"/><circle cx="16" cy="8" r="1"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  download: '<path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 20h14"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M8.2 10.8 14.8 7.2M8.2 13.2l6.6 3.6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
};

const iconsRepository = createRepository(ICONS, {
  get: name => ICONS[name] ?? "",
});
