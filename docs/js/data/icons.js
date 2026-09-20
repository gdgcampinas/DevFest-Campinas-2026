/**
 * Ícones de traço (viewBox 24x24) por nome — único lugar com os paths.
 * Quem precisa de um ícone usa iconMarkup(name) (components/icon.js);
 * dado que referencia ícone (ex.: talk-formats.js) guarda só o nome.
 */
const ICONS = {
  mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  users: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 6 1.5 6 4.5"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.2-4.6A8 8 0 1 1 21 12z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
};

const iconsRepository = createRepository(ICONS, {
  get: name => ICONS[name] ?? "",
});
